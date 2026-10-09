import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/catalog";
import { AdminOrderActions } from "@/components/admin-actions";
import { AdminTrackingForm } from "@/components/admin-tracking-form";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const order  = await db.order.findUnique({ where: { id }, select: { orderNumber: true } });
  return { title: order?.orderNumber ?? "Order" };
}

export default async function AdminOrderDetail({ params }: Props) {
  const { id } = await params;
  const order  = await db.order.findUnique({
    where:   { id },
    include: {
      lines:           true,
      shippingAddress: true,
      user:            { select: { name: true, email: true, phone: true } },
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!order) notFound();

  const latestPayment = order.payments[0] ?? null;
  const payerName = (latestPayment as { payerName?: string | null })?.payerName;

  return (
    <div className="admin-page">
      <nav className="catalog-breadcrumb" style={{ marginBottom: "1.5rem" }}>
        <Link href="/admin/orders">Orders</Link>
        <span aria-hidden="true">/</span>
        {order.orderNumber}
      </nav>

      <div className="admin-order-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="admin-heading" style={{ margin: 0 }}>{order.orderNumber}</h1>
          <p style={{ margin: ".3rem 0 0", fontSize: ".82rem", color: "var(--muted)" }}>
            Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: ".5rem" }}>
          <span className={`account-order-status status--${order.status.toLowerCase()}`}>
            {order.status}
          </span>
          <span className={`account-order-status ${order.paymentStatus === "PAID" ? "status--confirmed" : order.paymentStatus === "FAILED" ? "status--cancelled" : "status--pending"}`}>
            Payment: {order.paymentStatus}
          </span>
        </div>
      </div>

      {/* Actions bar: order status controls on the left, shipment tracking on the right */}
      <div className="admin-order-actions-bar" style={{ marginTop: "1.25rem", marginBottom: "2rem" }}>
        <AdminOrderActions orderId={order.id} currentStatus={order.status} currentPaymentStatus={order.paymentStatus} />
        <AdminTrackingForm
          orderId={order.id}
          currentTracking={order.trackingNumber ?? ""}
          currentProvider={order.trackingProvider ?? ""}
          customerEmail={order.user?.email ?? order.guestEmail ?? ""}
          orderNumber={order.orderNumber}
        />
      </div>

      <div className="admin-detail-grid">
        <section>
          <h2 className="admin-section-title">Items ({order.lines.length})</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Product</th><th>SKU</th><th>Size</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
              <tbody>
                {order.lines.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 500 }}>{l.productName}</td>
                    <td style={{ fontSize: ".75rem", color: "var(--muted)" }}>{l.variantSku}</td>
                    <td>{l.size}</td>
                    <td>{l.quantity}</td>
                    <td>{formatPrice(l.unitPaise / 100)}</td>
                    <td style={{ fontWeight: 500 }}>{formatPrice(l.totalPaise / 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="confirmation-totals" style={{ maxWidth: "280px", marginLeft: "auto", marginTop: "1rem" }}>
            <div><span>Subtotal</span><span>{formatPrice(order.subtotalPaise / 100)}</span></div>
            <div><span>Shipping</span><span>{order.shippingPaise === 0 ? "Free" : formatPrice(order.shippingPaise / 100)}</span></div>
            {order.taxPaise > 0 && <div><span>GST</span><span>{formatPrice(order.taxPaise / 100)}</span></div>}
            {order.discountPaise > 0 && <div><span>Discount</span><span>-{formatPrice(order.discountPaise / 100)}</span></div>}
            {order.pointsUsedPaise > 0 && <div><span>Store Credit</span><span>-{formatPrice(order.pointsUsedPaise / 100)}</span></div>}
            <div className="confirmation-total"><span>Total</span><strong>{formatPrice(order.totalPaise / 100)}</strong></div>
          </div>
        </section>

        <aside>
          {/* Customer info */}
          <section style={{ marginBottom: "1.5rem", padding: "1.25rem", background: "var(--paper)", borderRadius: "4px", border: "1px solid var(--line)" }}>
            <h2 className="admin-section-title" style={{ marginTop: 0 }}>Customer</h2>
            <p style={{ margin: "0 0 .3rem", fontWeight: 500 }}>{order.shippingAddress?.fullName ?? order.user?.name ?? "Guest"}</p>
            <p style={{ margin: "0 0 .3rem", fontSize: ".82rem", color: "var(--muted)" }}>{order.user?.email ?? order.guestEmail ?? "No email"}</p>
            {(order.shippingAddress?.phone || order.user?.phone) && (
              <p style={{ margin: 0, fontSize: ".82rem", color: "var(--muted)" }}>📞 {order.shippingAddress?.phone ?? order.user?.phone}</p>
            )}
          </section>

          {/* Payment Details */}
          <section style={{ marginBottom: "1.5rem", padding: "1.25rem", background: "var(--paper)", borderRadius: "4px", border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".6rem" }}>
              <h2 className="admin-section-title" style={{ margin: 0 }}>Payment Details</h2>
              <span className={`account-order-status ${order.paymentStatus === "PAID" ? "status--confirmed" : order.paymentStatus === "FAILED" ? "status--cancelled" : "status--pending"}`} style={{ fontSize: ".7rem" }}>
                {order.paymentStatus}
              </span>
            </div>

            {latestPayment ? (
              <div style={{ fontSize: ".82rem", display: "flex", flexDirection: "column", gap: ".45rem" }}>
                <div>
                  <span style={{ color: "var(--muted)" }}>Method: </span>
                  <strong>{latestPayment.paymentMethod === "PERSONAL_UPI" ? "Personal UPI (Manual)" : latestPayment.paymentMethod === "MERCHANT_UPI" ? "Gateway UPI" : latestPayment.paymentMethod}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--muted)" }}>Payment Status: </span>
                  <span className={`account-order-status ${latestPayment.status === "PAID" ? "status--confirmed" : latestPayment.status === "REJECTED" ? "status--cancelled" : "status--pending"}`} style={{ fontSize: ".68rem", padding: ".15rem .45rem" }}>
                    {latestPayment.status}
                  </span>
                </div>
                {payerName && (
                  <div>
                    <span style={{ color: "var(--muted)" }}>Paid by: </span>
                    <strong style={{ color: "var(--ink)" }}>{payerName}</strong>
                  </div>
                )}
                {latestPayment.utr && (
                  <div>
                    <span style={{ color: "var(--muted)" }}>UTR / Ref: </span>
                    <code style={{ fontSize: ".78rem", background: "#f0ece4", padding: ".1rem .3rem", borderRadius: "3px" }}>{latestPayment.utr}</code>
                  </div>
                )}
                {latestPayment.screenshotUrl && (
                  <div style={{ marginTop: ".4rem" }}>
                    <a href={latestPayment.screenshotUrl} target="_blank" rel="noopener noreferrer" className="admin-table-link" style={{ fontSize: ".78rem" }}>
                      📸 View Screenshot Proof ↗
                    </a>
                  </div>
                )}
                {latestPayment.rejectionReason && (
                  <div style={{ color: "#c0392b", marginTop: ".3rem" }}>
                    Reason: {latestPayment.rejectionReason}
                  </div>
                )}
                {latestPayment.verifiedAt && (
                  <div style={{ fontSize: ".74rem", color: "var(--muted)", marginTop: ".3rem" }}>
                    Verified on {new Date(latestPayment.verifiedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                )}
                {/* Quick link to admin payments page if pending/review */}
                {["PENDING_PAYMENT", "UNDER_REVIEW"].includes(latestPayment.status) && (
                  <div style={{ marginTop: ".8rem", paddingTop: ".8rem", borderTop: "1px dashed var(--line)" }}>
                    <Link href={`/admin/payments?search=${encodeURIComponent(latestPayment.utr ?? order.orderNumber)}`} className="button" style={{ minHeight: "34px", padding: ".3rem .7rem", fontSize: ".72rem", width: "100%", textAlign: "center" }}>
                      Review in Payments Hub →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: ".82rem" }}>
                <p style={{ margin: "0 0 .3rem" }}>Provider: {order.paymentProvider ?? "None"}</p>
                {order.paymentReference && <p style={{ margin: 0, color: "var(--muted)", wordBreak: "break-all" }}>Ref: {order.paymentReference}</p>}
              </div>
            )}
          </section>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <section style={{ padding: "1.25rem", background: "var(--paper)", borderRadius: "4px", border: "1px solid var(--line)" }}>
              <h2 className="admin-section-title" style={{ marginTop: 0 }}>Shipping Address</h2>
              <p style={{ margin: "0 0 .25rem", fontWeight: 500 }}>{order.shippingAddress.fullName}</p>
              <p style={{ margin: "0 0 .25rem", fontSize: ".82rem", color: "var(--muted)" }}>📞 {order.shippingAddress.phone}</p>
              <p style={{ margin: "0 0 .25rem", fontSize: ".82rem" }}>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p style={{ margin: "0 0 .25rem", fontSize: ".82rem" }}>{order.shippingAddress.line2}</p>}
              <p style={{ margin: 0, fontSize: ".82rem" }}>{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
