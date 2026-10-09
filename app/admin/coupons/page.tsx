import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/catalog";
import { CouponManager } from "@/components/coupon-manager";

export const metadata: Metadata = { title: "Coupons — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      userCoupons: {
        take: 1,
        include: { user: { select: { name: true, email: true, phone: true } } },
      },
    },
  });

  const serialized = coupons.map(c => {
    const owner = c.userCoupons[0]?.user;
    const ownerLabel = owner
      ? (owner.name
         || (owner.email && !owner.email.endsWith("@phone.aurelia.local") ? owner.email : null)
         || (owner.phone ? `+91 ${owner.phone}` : null))
      : null;
    return {
      id: c.id,
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderPaise: c.minOrderPaise,
      usageLimit: c.usageLimit,
      usageCount: c.usageCount,
      active: c.active,
      expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      scope: c.scope,
      ownerLabel,
      label: c.discountType === "PERCENT"
        ? `${c.discountValue}% off`
        : `${formatPrice(c.discountValue)} off`,
    };
  });

  return (
    <div className="admin-page">
      <h1 className="admin-heading">
        Coupons <span className="admin-count">({coupons.length})</span>
      </h1>
      <p className="muted" style={{ marginBottom: "1.5rem", fontSize: ".85rem" }}>
        Create and manage discount codes. <strong>General</strong> coupons can be used by any
        customer (once each); <strong>personal</strong> coupons are locked to one specific user.
      </p>
      <CouponManager initialCoupons={serialized} />
    </div>
  );
}
