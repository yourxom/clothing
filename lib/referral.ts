// Referral codes. Each user gets one unique, shareable code. Resolving a code
// to its owner lets us credit the referrer when a referred user first purchases.
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/** Unambiguous alphabet (no O/0/I/1) for easy sharing by voice/text. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(len = 7): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

/**
 * Ensures `userId` has a referral code, generating a unique one if missing.
 * Returns the code. Safe to call repeatedly.
 */
export async function ensureReferralCode(userId: string): Promise<string> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (user?.referralCode) return user.referralCode;

  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = randomCode();
    const clash = await db.user.findUnique({ where: { referralCode: candidate }, select: { id: true } });
    if (!clash) {
      await db.user.update({ where: { id: userId }, data: { referralCode: candidate } });
      return candidate;
    }
  }
  // Extremely unlikely fallback — append time entropy.
  const fallback = `${randomCode(4)}${Date.now().toString(36).toUpperCase().slice(-3)}`;
  await db.user.update({ where: { id: userId }, data: { referralCode: fallback } });
  return fallback;
}

/**
 * Resolves a referral code to the referrer's userId. Returns null if the code
 * is unknown or belongs to the signing-up user themselves (`selfUserId`).
 */
export async function resolveReferrer(rawCode: string, selfUserId?: string): Promise<string | null> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;
  const owner = await db.user.findUnique({ where: { referralCode: code }, select: { id: true } });
  if (!owner) return null;
  if (selfUserId && owner.id === selfUserId) return null; // can't refer yourself
  return owner.id;
}

/**
 * Pays the referrer when a referred user's FIRST order is successfully paid.
 * Runs inside the payment-verification transaction so it is atomic and never
 * double-pays (guarded by Order.referralRewarded + "first paid order" checks).
 *
 * Reward = a fixed amount of points + a percentage of this order's total,
 * both configured by the admin. Points are store credit in paise.
 *
 * No-op (returns null) when: the program is disabled, the buyer wasn't referred,
 * this isn't their first paid order, or the order was already rewarded.
 */
export async function rewardReferrerForOrder(
  tx: Prisma.TransactionClient,
  order: { id: string; userId: string | null; totalPaise: number; referralRewarded: boolean },
): Promise<{ referrerId: string; pointsPaise: number } | null> {
  if (!order.userId || order.referralRewarded) return null;

  const { getReferralConfig } = await import("@/lib/settings");
  const cfg = await getReferralConfig();
  if (!cfg.enabled) return null;

  const buyer = await tx.user.findUnique({
    where: { id: order.userId },
    select: { referredById: true },
  });
  if (!buyer?.referredById) return null; // not a referred user

  // Must be the buyer's FIRST paid order. Count their other PAID orders.
  const priorPaid = await tx.order.count({
    where: {
      userId: order.userId,
      paymentStatus: "PAID",
      id: { not: order.id },
    },
  });
  if (priorPaid > 0) return null;

  const fixed   = Math.max(0, cfg.fixedPaise);
  const percent = Math.max(0, Math.round(order.totalPaise * (cfg.percentRate / 100)));
  const pointsPaise = fixed + percent;
  if (pointsPaise <= 0) {
    await tx.order.update({ where: { id: order.id }, data: { referralRewarded: true } });
    return null;
  }

  // Lock this order so it can never be rewarded twice.
  await tx.order.update({ where: { id: order.id }, data: { referralRewarded: true } });

  const { awardPoints } = await import("@/lib/points");
  if (fixed > 0) {
    await awardPoints(tx, buyer.referredById, fixed, "REFERRAL_FIXED", {
      description: "Referral reward — a friend made their first purchase.",
      orderId: order.id,
      sourceUserId: order.userId,
    });
  }
  if (percent > 0) {
    await awardPoints(tx, buyer.referredById, percent, "REFERRAL_PERCENT", {
      description: `Referral reward — ${cfg.percentRate}% of a friend's first order.`,
      orderId: order.id,
      sourceUserId: order.userId,
    });
  }

  return { referrerId: buyer.referredById, pointsPaise };
}
