import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/catalog";

export const metadata: Metadata = { title: "Admin — AURELIA" };
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    totalUsers, totalOrders, totalRevenuePaise,
    pendingOrders, unreadMessages, totalNewsletterSubs,
    pendingReviews, recentOrders,
  ] = await Promise.all([
    db.user.count(),
    db.order.count(),
    db.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { totalPaise: true } }),
    db.order.count({ where: { status: "PENDING" } }),
    db.contactMessage.count({ where: { read: false } }),
    db.newsletterSubscriber.count(),
    db.review.count({ where: { approved: false } }),
    db.order.findMany({
      orderBy: { createdAt: "desc" }, take: 8,
      select: {
        id: true, orderNumber: true, status: true, paymentStatus: true,
        totalPaise: true, createdAt: true,
        lines: { select: { productName: true }, take: 1 },
      },
    }),
  ]);

  const totalRevenue = totalRevenuePaise._sum.totalPaise ?? 0;

  const stats = [
    { label: "Total users",       value: totalUsers,               href: "/admin/users",      badge: null },
    { label: "Total orders",      value: totalOrders,              href: "/admin/orders",     badge: pendingOrders > 0 ? `${pendingOrders} pending` : null },
    { label: "Revenue (paid)",    value: formatPrice(totalRevenue / 100), href: "/admin/orders", badge: null },
    { label: "Newsletter subs",   value: totalNewsletterSubs,      href: "/admin/newsletter", badge: null },
    { label: "Unread messages",   value: unreadMessages,           href: "/admin/contacts",   badge: unreadMessages > 0 ? "New" : null },
    { label: "Pending reviews",   value: pendingReviews,           href: "/admin/reviews",    badge: pendingReviews > 0 ? "Action needed" : null },
  ];

  return (
    <div className="admin-page">
      <h1 className="admin-heading">Dashboard</h1>

      <div className="admin-stats-grid">
        {stats.map(s => (
          <Link key={s.label} href={s.href} className="admin-stat-card">
            <span className="admin-stat-label">{s.label}</span>
            <span className="admin-stat-value">{s.value}</span>
            {s.badge && <span className="admin-stat-badge">{s.badge}</span>}
          </Link>
        ))}
      </div>

      <h2 className="admin-section-title">Recent orders</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th><th>Item(s)</th><th>Status</th>
              <th>Payment</th><th>Total</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map(o => (
              <tr key={o.id}>
                <td>
                  <Link href={`/admin/orders/${o.id}`} className="admin-table-link">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="muted" style={{ fontSize: ".8rem" }}>
                  {o.lines[0]?.productName ?? "—"}
                </td>
                <td>
                  <span className={`account-order-status status--${o.status.toLowerCase()}`}>
                    {o.status}
                  </span>
                </td>
                <td>
                  <span className={`account-order-status status--${o.paymentStatus === "PAID" ? "confirmed" : "pending"}`}>
                    {o.paymentStatus}
                  </span>
                </td>
                <td>{formatPrice(o.totalPaise / 100)}</td>
                <td className="muted" style={{ fontSize: ".78rem" }}>
                  {new Date(o.createdAt).toLocaleDateString("en-IN",
                    { day: "numeric", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
