// Points = store credit, stored as INR paise on User.pointsBalance, with an
// append-only PointsLedger for history. 1 point = ₹1 (we track paise internally
// for consistency with all other money in the app).
import { db } from "@/lib/db";
import type { Prisma, PointsReason } from "@prisma/client";

/** Current spendable balance (paise) for a user. */
export async function getPointsBalance(userId: string): Promise<number> {
  const u = await db.user.findUnique({ where: { id: userId }, select: { pointsBalance: true } });
  return u?.pointsBalance ?? 0;
}

/**
 * How many paise of points can actually be applied to an order: the lesser of
 * the user's balance, the requested amount, and a cap (so points never cover
 * more than `maxApplicablePaise`, e.g. the order total before credit).
 */
export function clampRedeemable(balancePaise: number, requestedPaise: number, maxApplicablePaise: number): number {
  const req = Math.max(0, Math.floor(requestedPaise));
  return Math.max(0, Math.min(req, balancePaise, maxApplicablePaise));
}

/**
 * Credits points to a user inside a transaction, writing a ledger entry and
 * updating the cached balance atomically.
 */
export async function awardPoints(
  tx: Prisma.TransactionClient,
  userId: string,
  deltaPaise: number,
  reason: PointsReason,
  opts: { description?: string; orderId?: string; sourceUserId?: string } = {},
): Promise<void> {
  if (deltaPaise <= 0) return;
  const updated = await tx.user.update({
    where: { id: userId },
    data:  { pointsBalance: { increment: deltaPaise } },
    select: { pointsBalance: true },
  });
  await tx.pointsLedger.create({
    data: {
      userId,
      deltaPaise,
      balanceAfterPaise: updated.pointsBalance,
      reason,
      description:  opts.description ?? null,
      orderId:      opts.orderId ?? null,
      sourceUserId: opts.sourceUserId ?? null,
    },
  });
}

/**
 * Redeems (spends) points inside a transaction. Re-checks the live balance to
 * stay race-safe, deducts, and records a negative ledger entry. Returns the
 * amount actually redeemed (0 if balance insufficient).
 */
export async function redeemPoints(
  tx: Prisma.TransactionClient,
  userId: string,
  amountPaise: number,
  orderId: string,
): Promise<number> {
  const amount = Math.max(0, Math.floor(amountPaise));
  if (amount === 0) return 0;

  // Re-read inside the transaction to prevent overspend under concurrency.
  const user = await tx.user.findUnique({ where: { id: userId }, select: { pointsBalance: true } });
  const balance = user?.pointsBalance ?? 0;
  const spend = Math.min(amount, balance);
  if (spend === 0) return 0;

  const updated = await tx.user.update({
    where: { id: userId },
    data:  { pointsBalance: { decrement: spend } },
    select: { pointsBalance: true },
  });
  await tx.pointsLedger.create({
    data: {
      userId,
      deltaPaise: -spend,
      balanceAfterPaise: updated.pointsBalance,
      reason: "REDEEMED",
      description: "Applied as store credit at checkout.",
      orderId,
    },
  });
  return spend;
}
