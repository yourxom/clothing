import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { grantWelcomeCoupon } from "@/lib/welcome-coupon";

// Grants the Rs 100 welcome coupon to every existing user who doesn't already
// have one. Safe to run repeatedly — users who already hold a welcome coupon
// are skipped by grantWelcomeCoupon.
export async function POST() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  // Only users without an existing welcome grant.
  const users = await db.user.findMany({
    where: { userCoupons: { none: { coupon: { isWelcome: true } } } },
    select: { id: true },
  });

  let granted = 0;
  for (const u of users) {
    try {
      await grantWelcomeCoupon(u.id);
      granted++;
    } catch {
      // Skip failures (e.g. a rare code collision) and keep going.
    }
  }

  return NextResponse.json({ ok: true, granted, scanned: users.length });
}
