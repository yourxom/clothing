import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/catalog";
import { getReferralConfig } from "@/lib/settings";
import { ReferralProgramToggle } from "@/components/referral-program-toggle";

export const metadata: Metadata = { title: "Referrals — Admin" };
export const dynamic = "force-dynamic";

function label(u: { name: string | null; email: string; phone: string | null }): string {
  if (u.name) return u.name;
  if (u.email && !u.email.endsWith("@phone.aurelia.local")) return u.email;
  if (u.phone) return `+91 ${u.phone}`;
  return "Account";
}

export default async function AdminReferralsPage() {
  const session = await requireAdmin();
  if (!session) redirect("/login");

  const cfg = await getReferralConfig();

  // Referrers = users who have referred at least one other user. Pull their
  // referred users + whether each referred user has a paid order (converted).
  const referrers = await db.user.findMany({
    where: { referrals: { some: {} } },
    select: {
      id: true, name: true, email: true, phone: true, pointsBalance: true,
      referrals: {
        select: {
          id: true, name: true, email: true, phone: true, createdAt: true,
          orders: { where: { paymentStatus: "PAID" }, select: { id: true }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Points issued per referrer (sum of positive referral ledger entries).
  const earnedByUser = await db.pointsLedger.groupBy({
    by: ["userId"],
    where: { reason: { in: ["REFERRAL_FIXED", "REFERRAL_PERCENT"] } },
    _sum: { deltaPaise: true },
  });
  const earnedMap = new Map(earnedByUser.map(r => [r.userId, r._sum.deltaPaise ?? 0]));

  // Program-wide totals.
  const [issuedAgg, redeemedAgg] = await Promise.all([
    db.pointsLedger.aggregate({
      where: { deltaPaise: { gt: 0 } },
      _sum: { deltaPaise: true },
    }),
    db.pointsLedger.aggregate({
      where: { deltaPaise: { lt: 0 } },
      _sum: { deltaPaise: true },
    }),
  ]);
  const totalIssued   = issuedAgg._sum.deltaPaise ?? 0;
  const totalRedeemed = Math.abs(redeemedAgg._sum.deltaPaise ?? 0);
  const outstanding   = totalIssued - totalRedeemed;

  const totalReferred  = referrers.reduce((s, r) => s + r.referrals.length, 0);
  const totalConverted = referrers.reduce((s, r) => s + r.referrals.filter(u => u.orders.length > 0).length, 0);

  // Recent referral earnings for the activity feed.
  const recent = await db.pointsLedger.findMany({
    where: { reason: { in: ["REFERRAL_FIXED", "REFERRAL_PERCENT"] } },
    orderBy: { createdAt: "desc" },
    take: 25,
  });
  const recentUserIds = [...new Set(recent.flatMap(r => [r.userId, r.sourceUserId].filter(Boolean) as string[]))];
  const recentUsers = await db.user.findMany({
    where: { id: { in: recentUserIds } },
    select: { id: true, name: true, email: true, phone: true },
  });
  const userMap = new Map(recentUsers.map(u => [u.id, u]));

  return (
    <div className="admin-page">
      <h1 className="admin-heading">
        Referrals <span className="admin-count">({referrers.length} referrer{referrers.length !== 1 ? "s" : ""})</span>
      </h1>
      <div className="referral-program-bar">
        <p className="muted" style={{ margin: 0, fontSize: ".85rem" }}>
          {cfg.enabled
            ? <>Rewards: <strong>₹{cfg.fixedRupees}</strong> + <strong>{cfg.percentRate}%</strong> of a referred friend&apos;s first order. Change amounts in <a href="/admin/settings" className="text-link" style={{ fontSize: ".72rem" }}>Settings</a>.</>
            : <>The program is paused — customers earn nothing until it&apos;s activated. Set reward amounts in <a href="/admin/settings" className="text-link" style={{ fontSize: ".72rem" }}>Settings</a>.</>}
        </p>
        <ReferralProgramToggle enabled={cfg.enabled} />
      </div>

      {/* Summary stats */}
      <div className="coupon-stat-grid" style={{ marginBottom: "2rem" }}>
        <div className="coupon-stat">
          <span className="coupon-stat-num">{formatPrice(totalIssued)}</span>
          <span className="coupon-stat-lbl">Total points issued</span>
        </div>
        <div className="coupon-stat">
          <span className="coupon-stat-num">{formatPrice(totalRedeemed)}</span>
          <span className="coupon-stat-lbl">Points redeemed</span>
        </div>
        <div className="coupon-stat">
          <span className="coupon-stat-num">{formatPrice(outstanding)}</span>
          <span className="coupon-stat-lbl">Outstanding (liability)</span>
        </div>
        <div className="coupon-stat">
          <span className="coupon-stat-num">{totalReferred}</span>
          <span className="coupon-stat-lbl">Friends referred</span>
        </div>
        <div className="coupon-stat">
          <span className="coupon-stat-num">{totalConverted}</span>
          <span className="coupon-stat-lbl">Converted (purchased)</span>
        </div>
      </div>

      {/* Who referred whom */}
      <h2 className="serif" style={{ fontSize: "1.1rem", margin: "0 0 .8rem" }}>Referrers</h2>
      {referrers.length === 0 ? (
        <p className="notice">No referrals yet.</p>
      ) : (
        <div className="admin-table-wrap" style={{ marginBottom: "2rem" }}>
          <table className="admin-table">
            <thead>
              <tr><th>Referrer</th><th>Referred users</th><th>Converted</th><th>Points earned</th><th>Balance</th></tr>
            </thead>
            <tbody>
              {referrers.map(r => {
                const converted = r.referrals.filter(u => u.orders.length > 0).length;
                return (
                  <tr key={r.id}>
                    <td><strong>{label(r)}</strong></td>
                    <td>
                      <div className="referral-friends">
                        {r.referrals.map(u => (
                          <span key={u.id} className={`referral-chip${u.orders.length > 0 ? " referral-chip--converted" : ""}`}>
                            {label(u)}{u.orders.length > 0 ? " ✓" : ""}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{converted} / {r.referrals.length}</td>
                    <td style={{ color: "#3a7d44", fontWeight: 600 }}>{formatPrice(earnedMap.get(r.id) ?? 0)}</td>
                    <td>{formatPrice(r.pointsBalance)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent referral earnings */}
      <h2 className="serif" style={{ fontSize: "1.1rem", margin: "0 0 .8rem" }}>Recent referral earnings</h2>
      {recent.length === 0 ? (
        <p className="notice">No points have been awarded yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Date</th><th>Referrer earned</th><th>From friend</th><th>Points</th></tr>
            </thead>
            <tbody>
              {recent.map(e => {
                const earner = userMap.get(e.userId);
                const friend = e.sourceUserId ? userMap.get(e.sourceUserId) : null;
                return (
                  <tr key={e.id}>
                    <td style={{ fontSize: ".78rem", color: "var(--muted)" }}>
                      {new Date(e.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td>{earner ? label(earner) : "—"}</td>
                    <td>{friend ? label(friend) : "—"}</td>
                    <td style={{ color: "#3a7d44", fontWeight: 600 }}>+{formatPrice(e.deltaPaise)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
