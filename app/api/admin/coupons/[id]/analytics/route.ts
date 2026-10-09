import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Props = { params: Promise<{ id: string }> };

// Per-coupon usage analytics: redemption count, unique users, total discount
// given, revenue from coupon-backed orders, and the individual redemptions.
export async function GET(_: Request, { params }: Props) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;

  const coupon = await db.coupon.findUnique({ where: { id } });
  if (!coupon) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });

  // All redemption records for this coupon (one row per user that used it).
  const redemptions = await db.couponRedemption.findMany({
    where:   { couponId: id },
    orderBy: { createdAt: "desc" },
  });

  // Resolve the orders and users referenced by the redemptions in bulk.
  const orderIds = [...new Set(redemptions.map(r => r.orderId))];
  const userIds  = [...new Set(redemptions.map(r => r.userId))];

  const [orders, users] = await Promise.all([
    db.order.findMany({
      where:  { id: { in: orderIds } },
      select: { id: true, orderNumber: true, totalPaise: true, discountPaise: true, status: true, createdAt: true },
    }),
    db.user.findMany({
      where:  { id: { in: userIds } },
      select: { id: true, name: true, email: true, phone: true },
    }),
  ]);

  const orderMap = new Map(orders.map(o => [o.id, o]));
  const userMap  = new Map(users.map(u => [u.id, u]));

  function userLabel(uid: string): string {
    const u = userMap.get(uid);
    if (!u) return "Unknown user";
    if (u.name) return u.name;
    if (u.email && !u.email.endsWith("@phone.aurelia.local")) return u.email;
    if (u.phone) return `+91 ${u.phone}`;
    return "Account";
  }

  // Build per-redemption rows + roll up the totals.
  let totalDiscountPaise = 0;
  let totalRevenuePaise  = 0;
  let countedOrders      = 0;

  const rows = redemptions.map(r => {
    const o = orderMap.get(r.orderId);
    // Only count non-cancelled orders toward money totals.
    const counts = o ? o.status !== "CANCELLED" && o.status !== "REFUNDED" : false;
    if (o && counts) {
      totalDiscountPaise += o.discountPaise;
      totalRevenuePaise  += o.totalPaise;
      countedOrders++;
    }
    return {
      id:            r.id,
      user:          userLabel(r.userId),
      orderNumber:   o?.orderNumber ?? "—",
      orderStatus:   o?.status ?? "UNKNOWN",
      discountPaise: o?.discountPaise ?? 0,
      totalPaise:    o?.totalPaise ?? 0,
      redeemedAt:    r.createdAt.toISOString(),
    };
  });

  const uniqueUsers = userIds.length;
  const avgOrderPaise = countedOrders > 0 ? Math.round(totalRevenuePaise / countedOrders) : 0;

  return NextResponse.json({
    ok: true,
    coupon: { id: coupon.id, code: coupon.code, scope: coupon.scope, usageLimit: coupon.usageLimit },
    stats: {
      redemptions:        redemptions.length,
      uniqueUsers,
      totalDiscountPaise,
      totalRevenuePaise,
      avgOrderPaise,
      countedOrders,
    },
    rows,
  });
}
