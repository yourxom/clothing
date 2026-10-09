import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/catalog";
import { getReferralConfig, getSiteConfig } from "@/lib/settings";
import { ensureReferralCode } from "@/lib/referral";
import { ReferralShare } from "@/components/referral-share";

export const metadata: Metadata = { title: "Refer & Earn — AURELIA" };
export const dynamic = "force-dynamic";

const REASON_LABEL: Record<string, string> = {
  REFERRAL_FIXED:   "Referral reward",
  REFERRAL_PERCENT: "Referral reward",
  REDEEMED:         "Redeemed at checkout",
  ADMIN_ADJUST:     "Adjustment",
  REFUND:           "Refund",
};

export default async function ReferPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  // Make sure the user has a code to share.
  const code = await ensureReferralCode(userId);

  const [cfg, site, user, ledger, referredCount, qualifiedCount] = await Promise.all([
    getReferralConfig(),
    getSiteConfig(),
    db.user.findUnique({ where: { id: userId }, select: { pointsBalance: true } }),
    db.pointsLedger.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.user.count({ where: { referredById: userId } }),
    // Referred users who have at least one paid order (i.e. who earned you points).
    db.user.count({ where: { referredById: userId, orders: { some: { paymentStatus: "PAID" } } } }),
  ]);

  const balance = user?.pointsBalance ?? 0;
  const link = `${site.siteUrl}/?ref=${code}`;

  return (
    <div className="acct-page">
      <div className="acct-page-header">
        <h1 className="acct-page-title serif">Refer &amp; Earn</h1>
        <p className="acct-page-sub">Share your code — earn points when a friend makes their first purchase.</p>
      </div>

      {/* Balance + program terms */}
      <div className="refer-top">
        <div className="refer-balance">
          <span className="refer-balance-num">{formatPrice(balance)}</span>
          <span className="refer-balance-lbl">Points balance (usable as store credit)</span>
        </div>
        <div className="refer-terms">
          {cfg.enabled ? (
            <p>
              When someone signs up with your link and completes their first order, you earn
              {cfg.fixedRupees > 0 && <> <strong>{formatPrice(cfg.fixedPaise)}</strong></>}
              {cfg.fixedRupees > 0 && cfg.percentRate > 0 && " plus"}
              {cfg.percentRate > 0 && <> <strong>{cfg.percentRate}%</strong> of their order value</>}
              {" "}in points. 1 point = ₹1 at checkout.
            </p>
          ) : (
            <p className="muted">The referral program is currently paused. Your code still works once it&apos;s back on.</p>
          )}
        </div>
      </div>

      {/* Share code + link */}
      <ReferralShare code={code} link={link} />

      {/* Referral counts */}
      <div className="refer-stat-grid">
        <div className="refer-stat">
          <span className="refer-stat-num">{referredCount}</span>
          <span className="refer-stat-lbl">Friends joined</span>
        </div>
        <div className="refer-stat">
          <span className="refer-stat-num">{qualifiedCount}</span>
          <span className="refer-stat-lbl">Made a purchase</span>
        </div>
      </div>

      {/* Points history */}
      <h2 className="serif" style={{ fontSize: "1.1rem", margin: "2rem 0 .8rem" }}>Points history</h2>
      {ledger.length === 0 ? (
        <p className="muted">No points activity yet. Share your code to start earning.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Date</th><th>Activity</th><th>Points</th><th>Balance</th></tr>
            </thead>
            <tbody>
              {ledger.map(e => (
                <tr key={e.id}>
                  <td style={{ fontSize: ".78rem", color: "var(--muted)" }}>
                    {new Date(e.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td>{e.description || REASON_LABEL[e.reason] || e.reason}</td>
                  <td style={{ color: e.deltaPaise >= 0 ? "#3a7d44" : "#8b3344", fontWeight: 600 }}>
                    {e.deltaPaise >= 0 ? "+" : "−"}{formatPrice(Math.abs(e.deltaPaise))}
                  </td>
                  <td>{formatPrice(e.balanceAfterPaise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
