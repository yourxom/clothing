import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/catalog";

export const metadata: Metadata = { title: "My Coupons — AURELIA" };
export const dynamic = "force-dynamic";

type CouponView = {
  id: string;
  code: string;
  description: string | null;
  label: string;             // e.g. "₹100 OFF" or "15% OFF"
  minOrderLabel: string | null;
  status: "available" | "used" | "expired";
  expiresAt: Date | null;
};

function discountLabel(type: string, value: number): string {
  // FIXED values are stored in paise; PERCENT values are whole percents.
  return type === "PERCENT" ? `${value}% OFF` : `${formatPrice(value / 100)} OFF`;
}

export default async function CouponsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const grants = await db.userCoupon.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { coupon: true },
  });

  const now = new Date();
  const coupons: CouponView[] = grants.map((g) => {
    const c = g.coupon;
    const expired = c.expiresAt ? c.expiresAt < now : false;
    const status: CouponView["status"] =
      g.redeemedAt ? "used" : (expired || !c.active) ? "expired" : "available";
    return {
      id:            g.id,
      code:          c.code,
      description:   c.description,
      label:         discountLabel(c.discountType, c.discountValue),
      minOrderLabel: c.minOrderPaise > 0 ? `Min. order ${formatPrice(c.minOrderPaise / 100)}` : null,
      status,
      expiresAt:     c.expiresAt,
    };
  });

  const available = coupons.filter((c) => c.status === "available");

  return (
    <div className="acct-page">
      <div className="acct-page-header">
        <h1 className="acct-page-title serif">My Coupons</h1>
        <p className="acct-page-sub">
          {available.length} coupon{available.length !== 1 ? "s" : ""} ready to use
        </p>
      </div>

      {coupons.length === 0 ? (
        <div className="acct-empty acct-empty--large">
          <span className="acct-empty-icon" aria-hidden="true">🎟️</span>
          <h2 className="serif">No coupons yet</h2>
          <p>Offers and reward coupons will appear here when they&apos;re added to your account.</p>
          <Link href="/shop" className="button" style={{ marginTop: "1.2rem" }}>Shop the collection</Link>
        </div>
      ) : (
        <div className="acct-coupons">
          {coupons.map((c) => (
            <div
              key={c.id}
              className={`acct-coupon acct-coupon--${c.status}`}
            >
              <div className="acct-coupon-left">
                <span className="acct-coupon-amount">{c.label}</span>
                {c.status !== "available" && (
                  <span className="acct-coupon-state">
                    {c.status === "used" ? "Used" : "Expired"}
                  </span>
                )}
              </div>
              <div className="acct-coupon-body">
                <div className="acct-coupon-code-row">
                  <span className="acct-coupon-code">{c.code}</span>
                </div>
                {c.description && <p className="acct-coupon-desc">{c.description}</p>}
                <div className="acct-coupon-meta">
                  {c.minOrderLabel && <span>{c.minOrderLabel}</span>}
                  {c.expiresAt && (
                    <span>
                      Valid till {new Date(c.expiresAt).toLocaleDateString("en-IN",
                        { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
                {c.status === "available" && (
                  <p className="acct-coupon-hint">
                    Apply <strong>{c.code}</strong> at checkout to redeem.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
