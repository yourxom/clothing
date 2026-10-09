import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/catalog";

export const metadata: Metadata = { title: "My Orders — AURELIA" };
export const dynamic = "force-dynamic";

const STATUS_ICON: Record<string, string> = {
  PENDING: "🕐", CONFIRMED: "✅", PROCESSING: "⚙️",
  SHIPPED: "🚚", DELIVERED: "📦", CANCELLED: "❌", REFUNDED: "↩️",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: "#b77b00", CONFIRMED: "#3a7d44", PROCESSING: "#3a7d44",
  SHIPPED: "#1a6aab", DELIVERED: "#3a7d44", CANCELLED: "#8b3344", REFUNDED: "#8b3344",
};
const STATUS_BG: Record<string, string> = {
  PENDING: "#fef8ec", CONFIRMED: "#edf7ee", PROCESSING: "#edf7ee",
  SHIPPED: "#e8f2fb", DELIVERED: "#edf7ee", CANCELLED: "#fdf0f0", REFUNDED: "#fdf0f0",
};

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      lines:  { select: { productName: true, size: true, quantity: true, totalPaise: true } },
      _count: { select: { lines: true } },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, paymentMethod: true },
      },
    },
  });

  return (
    <div className="acct-page">
      <div className="acct-page-header">
        <h1 className="acct-page-title serif">My Orders</h1>
        <p className="acct-page-sub">{orders.length} order{orders.length !== 1 ? "s" : ""} placed</p>
      </div>

      {orders.length === 0 ? (
        <div className="acct-empty acct-empty--large">
          <span className="acct-empty-icon" aria-hidden="true">📦</span>
          <h2 className="serif">No orders yet</h2>
          <p>When you place an order, it will appear here.</p>
          <Link href="/shop" className="button" style={{ marginTop: "1.2rem" }}>Shop the collection</Link>
        </div>
      ) : (
        <div className="acct-orders-full">
          {orders.map(order => {
            const latestPayment = order.payments[0] ?? null;
            let paymentText = "Payment pending";
            let paymentClass = "pending";
            if (order.paymentStatus === "PAID" || latestPayment?.status === "PAID") {
              paymentText = "✓ Paid";
              paymentClass = "confirmed";
            } else if (latestPayment?.status === "UNDER_REVIEW") {
              paymentText = "⏳ Verification pending";
              paymentClass = "pending";
            } else if (order.paymentStatus === "FAILED" || latestPayment?.status === "REJECTED") {
              paymentText = "❌ Payment failed";
              paymentClass = "failed";
            }

            return (
              <div key={order.id} className="acct-order-full-card">
                {/* Card header */}
                <div className="acct-order-full-header">
                  <div className="acct-order-full-meta">
                    <span className="acct-order-full-number">Order #{order.orderNumber}</span>
                    <span className="acct-order-full-date">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <span className="acct-order-full-items">{order._count.lines} item{order._count.lines !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="acct-order-full-right">
                    <div style={{ display: "flex", gap: ".4rem", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <span
                        className="acct-order-badge acct-order-badge--lg"
                        style={{
                          color: STATUS_COLOR[order.status] ?? "#706b62",
                          background: STATUS_BG[order.status] ?? "#f5f5f5",
                        }}
                      >
                        {STATUS_ICON[order.status]} {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                      </span>
                      <span className={`acct-status-pill acct-status-pill--${paymentClass}`} style={{ fontSize: ".72rem" }}>
                        {paymentText}
                      </span>
                    </div>
                    <p className="acct-order-full-total">{formatPrice(order.totalPaise / 100)}</p>
                  </div>
                </div>

                {/* Items preview */}
                <div className="acct-order-full-items-list">
                  {order.lines.map((line, i) => (
                    <div key={i} className="acct-order-line">
                      <div className="acct-order-line-dot" />
                      <div>
                        <p className="acct-order-line-name">{line.productName}</p>
                        <p className="acct-order-line-meta">Size {line.size} · Qty {line.quantity}</p>
                      </div>
                      <p className="acct-order-line-price">{formatPrice(line.totalPaise / 100)}</p>
                    </div>
                  ))}
                </div>

                {/* Card footer */}
                <div className="acct-order-full-footer">
                  <Link href={`/account/orders/${order.id}`} className="acct-order-detail-btn">
                    View order details →
                  </Link>
                  {order.status === "DELIVERED" && (
                    <Link href={`/products`} className="acct-order-action-btn">
                      Buy again
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
