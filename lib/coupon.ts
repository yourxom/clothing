import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type CouponResult =
  | { valid: true; code: string; discountPaise: number; description: string | null }
  | { valid: false; error: string };

/**
 * Validates a coupon code against an order subtotal (in paise) for a given user.
 *
 * Two coupon scopes:
 *  - GENERAL  — any signed-in user may use the code, but each user ONLY ONCE.
 *               Enforced by a per-(coupon,user) redemption row.
 *  - PERSONAL — bound to one specific user via a UserCoupon grant. Only that
 *               owner may use it, and only once.
 *
 * Also enforces active flag, start/expiry window, min order, and any global
 * usageLimit set by the admin.
 *
 * Does NOT consume the coupon — call `redeemCoupon` inside the order
 * transaction after the order is created.
 */
export async function validateCoupon(
  rawCode: string,
  subtotalPaise: number,
  userId?: string,
): Promise<CouponResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { valid: false, error: "Enter a coupon code." };

  const coupon = await db.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.active) {
    return { valid: false, error: "This coupon code is not valid." };
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { valid: false, error: "This coupon is not active yet." };
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { valid: false, error: "This coupon has expired." };
  }

  // Every coupon in this system is tied to an account.
  if (!userId) {
    return { valid: false, error: "Please sign in to use this coupon." };
  }

  // Global usage cap (admin-set, applies across all users).
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return { valid: false, error: "This coupon has reached its usage limit." };
  }

  if (coupon.scope === "PERSONAL") {
    // Must be granted to this user and not yet redeemed by them.
    const grant = await db.userCoupon.findFirst({
      where: { couponId: coupon.id, userId },
      select: { redeemedAt: true },
    });
    if (!grant) {
      return { valid: false, error: "This coupon isn't available on your account." };
    }
    if (grant.redeemedAt) {
      return { valid: false, error: "You've already used this coupon." };
    }
  } else {
    // GENERAL — anyone may use it, but only once per user.
    const alreadyUsed = await db.couponRedemption.findUnique({
      where: { couponId_userId: { couponId: coupon.id, userId } },
      select: { id: true },
    });
    if (alreadyUsed) {
      return { valid: false, error: "You've already used this coupon." };
    }
  }

  if (subtotalPaise < coupon.minOrderPaise) {
    const min = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
      .format(coupon.minOrderPaise / 100);
    return { valid: false, error: `Minimum order of ${min} required for this coupon.` };
  }

  // Compute discount
  let discountPaise: number;
  if (coupon.discountType === "PERCENT") {
    discountPaise = Math.round(subtotalPaise * (coupon.discountValue / 100));
    if (coupon.maxDiscountPaise !== null && discountPaise > coupon.maxDiscountPaise) {
      discountPaise = coupon.maxDiscountPaise;
    }
  } else {
    discountPaise = coupon.discountValue;
  }
  // Never discount more than the subtotal
  discountPaise = Math.min(discountPaise, subtotalPaise);

  return { valid: true, code, discountPaise, description: coupon.description };
}

/**
 * Consumes a coupon for a placed order. MUST run inside the order transaction
 * so the "once per user" guarantee is race-safe: CouponRedemption is unique on
 * (couponId, userId), so two concurrent orders by the same user can never both
 * redeem it — the second insert throws and the transaction rolls back.
 *
 * Returns true if redeemed, false if the coupon could not be found.
 * Throws (rolling back the transaction) if this user already redeemed it.
 */
export async function redeemCoupon(
  tx: Prisma.TransactionClient,
  rawCode: string,
  userId: string,
  orderId: string,
): Promise<boolean> {
  const code = rawCode.trim().toUpperCase();
  const coupon = await tx.coupon.findUnique({ where: { code }, select: { id: true } });
  if (!coupon) return false;

  // Per-user lock — unique on (couponId, userId). A duplicate here means this
  // user already consumed the coupon → throw to roll the order back.
  await tx.couponRedemption.create({
    data: { couponId: coupon.id, code, userId, orderId },
  });

  // Bump global usage.
  await tx.coupon.update({
    where: { id: coupon.id },
    data:  { usageCount: { increment: 1 } },
  });

  // Mark this user's personal grant (if any) as redeemed.
  await tx.userCoupon.updateMany({
    where: { couponId: coupon.id, userId, redeemedAt: null },
    data:  { redeemedAt: new Date(), redeemedOrderId: orderId },
  });

  return true;
}

/**
 * @deprecated Use `redeemCoupon` inside the order transaction instead. Kept for
 * backwards compatibility; only bumps the global usage counter.
 */
export async function incrementCouponUsage(code: string) {
  await db.coupon.updateMany({
    where: { code: code.trim().toUpperCase() },
    data:  { usageCount: { increment: 1 } },
  });
}
