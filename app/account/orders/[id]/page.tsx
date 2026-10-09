import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/catalog";
import { FashionPlaceholder } from "@/components/fashion-placeholder";
import { CancelOrderButton } from "@/components/cancel-order-button";
import { ReturnRequestButton } from "@/components/return-request-button";
import type { Tone } from "@/lib/catalog";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id }  = await params;
  const order   = await db.order.findUnique({ where: { id }, select: { orderNumber: true } });
  return { title: order ? `Order ${order.orderNumber} — AURELIA` : "Order" };
}

const STATUS_STEPS = ["PENDING","CONFIRMED","PROCESSING","SHIPPED","DELIVERED"] as const;

const STEP_LABELS: Record<string, { label: string; icon: string; desc: string }> = {
  PENDING:    { label: "Order placed",    icon: "🧾", desc: "We received your order" },
  CONFIRMED:  { label: "Confirmed",       icon: "✅", desc: "Order confirmed & being prepared" },
  PROCESSING: { label: "Processing",      icon: "⚙️", desc: "Being packed and ready to ship" },
  SHIPPED:    { label: "Shipped",         icon: "🚚", desc: "On its way to you" },
  DELIVERED:  { label: "Delivered",       icon: "🎉", desc: "Enjoy your AURELIA styles" },
};

export default async function OrderDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const order  = await db.order.findUnique({
    where:   { id },
    include: {
      lines: true,
      shippingAddress: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!order || order.userId !== session.user.id) notFound();

  const latestPayment = order.payments[0] ?? null;

  const currentStep = STATUS_STEPS.indexOf(order.status as typeof STATUS_STEPS[number]);
  const isCancelledOrRefunded = order.status === "CANCELLED" || order.status === "REFUNDED";
  const isPaymentFailed = order.paymentStatus === "FAILED" || latestPayment?.status === "REJECTED";
  const isPaymentUnderReview = latestPayment?.status === "UNDER_REVIEW";
  const isPaymentAwaiting = order.paymentStatus === "PENDING" && latestPayment?.status === "PENDING_PAYMENT";

  // Cancellation is allowed only for a PENDING order within 24 hours of placing it.
  const withinCancelWindow = Date.now() - new Date(order.createdAt).getTime() <= 24 * 60 * 60 * 1000;
  const canCancel = order.status === "PENDING" && withinCancelWindow && !isCancelledOrRefunded;

  return (
    <div className="acct-page">
      {/* Header */}
      <div className="acct-order-detail-top">
        <div>
          <p className="acct-order-detail-eyebrow">
            {new Date(order.createdAt).toLocaleDateString("en-IN",
              { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 className="acct-page-title serif">Order #{order.orderNumber}</h1>
        </div>
        <div className="acct-order-detail-badges">
          <span className={`acct-status-pill acct-status-pill--${order.status.toLowerCase()}`}>
            {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
          </span>
          <span className={`acct-status-pill acct-status-pill--${order.paymentStatus === "PAID" ? "confirmed" : isPaymentFailed ? "cancelled" : "pending"}`}>
            {order.paymentStatus === "PAID"
              ? "✓ Paid"
              : isPaymentFailed
              ? "❌ Payment Failed"
              : isPaymentUnderReview
              ? "⏳ Verification in progress"
              : "Payment pending"}
          </span>
        </div>
      </div>

      {/* ── Status tracker ───────────────────────────────────── */}
      {!isCancelledOrRefunded && (
        <div className="acct-tracker">
          {STATUS_STEPS.map((step, i) => {
            const done    = i <= currentStep;
            const current = i === currentStep;
            const info    = STEP_LABELS[step];
            return (
              <div key={step}
                className={`acct-tracker-step${done ? " acct-tracker-step--done" : ""}${current ? " acct-tracker-step--current" : ""}`}>
                {/* connector line */}
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`acct-tracker-line${done ? " acct-tracker-line--done" : ""}`} aria-hidden="true" />
                )}
                <div className="acct-tracker-dot" aria-hidden="true">
                  {done ? <span>{i === currentStep ? info.icon : "✓"}</span> : <span>{i + 1}</span>}
                </div>
                <p className="acct-tracker-label">{info.label}</p>
                {current && <p className="acct-tracker-desc">{info.desc}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Informative Status Banners */}
      {isCancelledOrRefunded && (
        <div className="acct-cancelled-banner">
          <span aria-hidden="true">{order.status === "CANCELLED" ? "❌" : "↩️"}</span>
          <span>This order has been {order.status.toLowerCase()}.</span>
        </div>
      )}

      {!isCancelledOrRefunded && isPaymentFailed && (
        <div className="acct-cancelled-banner" style={{ background: "#fdf0f0", borderColor: "#f5c6cb", color: "#8b3344", marginBottom: "1.5rem" }}>
          <span aria-hidden="true">❌</span>
          <div>
            <strong>Payment could not be verified.</strong>
            {latestPayment?.rejectionReason && <p style={{ margin: ".25rem 0 0", fontSize: ".82rem" }}>Reason: {latestPayment.rejectionReason}</p>}
          </div>
        </div>
      )}

      {isPaymentUnderReview && (
        <div style={{ background: "#fef8ec", border: "1px solid #fae8c4", padding: "1rem 1.25rem", borderRadius: "4px", color: "#856404", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: ".75rem" }}>
          <span style={{ fontSize: "1.3rem" }}>⏳</span>
          <div style={{ fontSize: ".84rem" }}>
            <strong>Payment verification in progress</strong>
            <p style={{ margin: ".2rem 0 0", color: "#7a5c00" }}>
              We received your payment reference {latestPayment?.utr ? `(${latestPayment.utr})` : ""}. Our team is verifying your receipt and will confirm your order shortly.
            </p>
          </div>
        </div>
      )}

      {isPaymentAwaiting && (
        <div style={{ background: "#fef8ec", border: "1px solid #fae8c4", padding: "1rem 1.25rem", borderRadius: "4px", color: "#856404", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: ".75rem" }}>
          <span style={{ fontSize: "1.3rem" }}>⚠️</span>
          <div style={{ fontSize: ".84rem" }}>
            <strong>Awaiting payment confirmation</strong>
            <p style={{ margin: ".2rem 0 0", color: "#7a5c00" }}>
              Your order is placed in pending state. Please make sure to complete payment via UPI.
            </p>
          </div>
        </div>
      )}

      {/* ── Main grid ────────────────────────────────────────── */}
      <div className="acct-order-detail-grid">

        {/* Items */}
        <section className="acct-detail-card" aria-labelledby="od-items">
          <h2 id="od-items" className="acct-detail-card-title">
            Items ordered
            <span className="acct-detail-count">{order.lines.length} item{order.lines.length !== 1 ? "s" : ""}</span>
          </h2>
          <div className="acct-order-items-list">
            {order.lines.map(line => (
              <div key={line.id} className="acct-order-item">
                <div className="acct-order-item-art">
                  <FashionPlaceholder
                    label={line.productName}
                    tone={"sand" as Tone}
                  />
                </div>
                <div className="acct-order-item-info">
                  <p className="acct-order-item-name">{line.productName}</p>
                  <p className="acct-order-item-meta">Size: {line.size} · Qty: {line.quantity}</p>
                  <p className="acct-order-item-sku">SKU: {line.variantSku}</p>
                </div>
                <div className="acct-order-item-price">
                  <p>{formatPrice(line.totalPaise / 100)}</p>
                  <p className="acct-order-item-unit">
                    {line.quantity > 1 ? `${formatPrice(line.unitPaise / 100)} each` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Price breakdown */}
          <div className="acct-price-breakdown">
            <div className="acct-price-row">
              <span>Subtotal ({order.lines.length} items)</span>
              <span>{formatPrice(order.subtotalPaise / 100)}</span>
            </div>
            <div className="acct-price-row">
              <span>Delivery</span>
              <span className={order.shippingPaise === 0 ? "acct-price-free" : ""}>
                {order.shippingPaise === 0 ? "FREE" : formatPrice(order.shippingPaise / 100)}
              </span>
            </div>
            {order.taxPaise > 0 && (
              <div className="acct-price-row">
                <span>Tax</span>
                <span>{formatPrice(order.taxPaise / 100)}</span>
              </div>
            )}
            <div className="acct-price-row acct-price-row--total">
              <span>Order total</span>
              <strong>{formatPrice(order.totalPaise / 100)}</strong>
            </div>
          </div>
        </section>

        {/* Sidebar info */}
        <div className="acct-detail-sidebar">

          {/* Delivery address */}
          {order.shippingAddress && (
            <section className="acct-detail-card" aria-labelledby="od-addr">
              <h2 id="od-addr" className="acct-detail-card-title">Delivery address</h2>
              <div className="acct-address-block">
                <p className="acct-address-name">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.line1}
                  {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
                </p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                <p>{order.shippingAddress.pincode} · India</p>
              </div>
            </section>
          )}

          {/* Payment */}
          <section className="acct-detail-card" aria-labelledby="od-pay">
            <h2 id="od-pay" className="acct-detail-card-title">Payment</h2>
            <div className="acct-payment-block">
              {latestPayment ? (
                <>
                  <div className="acct-payment-row">
                    <span>Method</span>
                    <span className="acct-payment-val">
                      {latestPayment.paymentMethod === "MERCHANT_UPI" ? "UPI (automatic)" : "Direct UPI"}
                    </span>
                  </div>
                  <div className="acct-payment-row">
                    <span>Amount</span>
                    <span className="acct-payment-val">{formatPrice(latestPayment.expectedAmountPaise / 100)}</span>
                  </div>
                  <div className="acct-payment-row">
                    <span>Status</span>
                    <span className={`payment-status payment-status--${latestPayment.status.toLowerCase().replace(/_/g, "-")}`}
                      style={{ fontSize: ".7rem" }}>
                      {latestPayment.status === "UNDER_REVIEW" ? "Verification Pending"
                        : latestPayment.status === "PAID" ? (latestPayment.verificationType === "AUTOMATIC" ? "Paid (auto-verified)" : "Paid (admin verified)")
                        : latestPayment.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  {latestPayment.utr && (
                    <div className="acct-payment-row">
                      <span>UTR / Ref</span>
                      <span className="acct-payment-ref">{latestPayment.utr}</span>
                    </div>
                  )}
                  {(latestPayment as any).payerName && (
                    <div className="acct-payment-row">
                      <span>Paid by</span>
                      <span className="acct-payment-val">{(latestPayment as any).payerName}</span>
                    </div>
                  )}
                  {latestPayment.providerPaymentId && (
                    <div className="acct-payment-row">
                      <span>Payment ID</span>
                      <span className="acct-payment-ref" style={{ fontSize: ".72rem" }}>{latestPayment.providerPaymentId}</span>
                    </div>
                  )}
                  {latestPayment.verifiedAt && (
                    <div className="acct-payment-row">
                      <span>Verified</span>
                      <span className="acct-payment-val" style={{ fontSize: ".75rem" }}>
                        {new Date(latestPayment.verifiedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  )}
                  {latestPayment.rejectionReason && (
                    <p className="acct-payment-note" style={{ color: "#c0392b", marginTop: ".5rem" }}>
                      Reason: {latestPayment.rejectionReason}
                    </p>
                  )}
                  {/* Retry / shop link for rejected/failed/expired payments */}
                  {["REJECTED", "FAILED", "EXPIRED"].includes(latestPayment.status) && (
                    <Link href="/shop" className="button button-outline"
                      style={{ marginTop: ".75rem", fontSize: ".78rem", display: "inline-block" }}>
                      Browse Collection
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <div className="acct-payment-row">
                    <span>Status</span>
                    <span className={`acct-status-pill acct-status-pill--${order.paymentStatus === "PAID" ? "confirmed" : order.paymentStatus === "FAILED" ? "cancelled" : "pending"}`}
                      style={{ fontSize: ".7rem" }}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  {order.paymentProvider && (
                    <div className="acct-payment-row">
                      <span>Method</span>
                      <span className="acct-payment-val">{order.paymentProvider}</span>
                    </div>
                  )}
                  {order.paymentReference && (
                    <div className="acct-payment-row">
                      <span>Reference</span>
                      <span className="acct-payment-ref">{order.paymentReference}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Need help */}
          <section className="acct-detail-card acct-help-card" aria-labelledby="od-help">
            <h2 id="od-help" className="acct-detail-card-title">Need help?</h2>
            <p>For any issues with this order, our support team is here.</p>
            <Link href="/contact" className="acct-help-link">Contact support →</Link>
          </section>
        </div>
      </div>

      {/* Footer actions */}
      <div className="acct-order-detail-actions">
        <Link href="/account/orders" className="button button-outline">← Back to orders</Link>
        {isCancelledOrRefunded ? (
          <button type="button" className="button button-outline" disabled
            title="Invoice is not available for cancelled orders">
            Download invoice
          </button>
        ) : (
          <a href={`/api/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer"
            className="button button-outline">Download invoice</a>
        )}
        <Link href="/shop" className="button">Continue shopping</Link>
        {canCancel && (
          <CancelOrderButton orderId={order.id} />
        )}
        {(order.status === "DELIVERED") && (
          <ReturnRequestButton orderId={order.id} orderNumber={order.orderNumber} />
        )}
      </div>
    </div>
  );
}
