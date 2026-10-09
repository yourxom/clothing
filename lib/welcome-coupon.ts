// Welcome-coupon granting. Every new user receives their own single-use
// Rs 100 coupon. Each grant creates a UNIQUE coupon code owned by exactly one
// user (via UserCoupon), so once it is redeemed it can never be used again —
// by that user or anyone else.
import { db } from "@/lib/db";

/** Rs 100 in paise. */
export const WELCOME_COUPON_PAISE = 10000;

/** Human-friendly, unambiguous code alphabet (no O/0/I/1). */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSuffix(len = 6): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

/**
 * Grants a personal Rs 100 welcome coupon to `userId` if they don't already
 * have one. Safe to call more than once — it is a no-op after the first grant.
 * Never throws in a way that would block signup; callers should still catch.
 */
export async function grantWelcomeCoupon(userId: string): Promise<void> {
  // Already granted? (any welcome coupon owned by this user)
  const existing = await db.userCoupon.findFirst({
    where: { userId, coupon: { isWelcome: true } },
    select: { id: true },
  });
  if (existing) return;

  // Generate a unique code (retry on the rare collision).
  let code = "";
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = `WELCOME-${randomSuffix()}`;
    const clash = await db.coupon.findUnique({ where: { code: candidate }, select: { id: true } });
    if (!clash) { code = candidate; break; }
  }
  if (!code) code = `WELCOME-${Date.now().toString(36).toUpperCase()}`;

  // A fresh Coupon owned by this one user + the UserCoupon link, created
  // together. singleUse ensures it can be redeemed exactly once, ever.
  await db.coupon.create({
    data: {
      code,
      description: "Rs 100 off your first order — welcome to AURELIA.",
      discountType: "FIXED",
      discountValue: WELCOME_COUPON_PAISE,
      minOrderPaise: 0,
      usageLimit: 1,
      perUserLimit: 1,
      singleUse: true,
      isWelcome: true,
      scope: "PERSONAL",
      active: true,
      userCoupons: {
        create: { userId, code },
      },
    },
  });
}
