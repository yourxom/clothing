import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/catalog";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id }, select: { orderNumber: true, status: true } });
  return { title: order ? (order.status === "CONFIRMED" ? `Order ${order.orderNumber} confirmed` : `Order ${order.orderNumber} received`) : "Order received" };
}

export default async function ConfirmationPage({ params }: Props) {
  const { id } = await params;

  const order = await db.order.findUnique({
    where:   { id },
    include: {
      lines:           true,
      shippingAddress: true,
    },
  });

  if (!order) notFound();

  return (
    <main id="main-content" className="container content-page confirmation-page">
      {/* Hero */}
      <div className="confirmation-hero">
        <span className="confirmation-check" aria-hidden="true">✓</span>
        <span className="eyebrow">{order.status === "CONFIRMED" ? "Order confirmed" : "Order received"}</span>
        <h1 className="serif">Thank you for your order.</h1>
        <p className="content-lead">
          Your order <strong>{order.orderNumber}</strong> has been received successfully.
          {order.status === "CONFIRMED"
            ? " A confirmation email has been sent to your registered email address."
            : " Our team will verify and confirm your order shortly. You will receive an email once the order is confirmed."}
        </p>
        <a href={`/api/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer"
          className="button" style={{ marginTop: "1rem" }}>
          Download invoice / bill
        </a>
      </div>

      {/* Order details */}
      <div className="confirmation-grid">
        {/* Lines */}
        <section aria-labelledby="order-items-heading">
          <h2 id="order-items-heading" className="serif">Items ordered</h2>
          <div className="confirmation-lines">
            {order.lines.map(line => (
              <div key={line.id} className="confirmation-line">
                <div>
                  <strong>{line.productName}</strong>
                  <span className="muted"> · Size {line.size} · Qty {line.quantity}</span>
                </div>
                <span>{formatPrice(line.totalPaise / 100)}</span>
              </div>
            ))}
          </div>

          <div className="confirmation-totals">
            <div>
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotalPaise / 100)}</span>
            </div>
            <div>
              <span>Shipping</span>
              <span>{order.shippingPaise === 0 ? "Free" : formatPrice(order.shippingPaise / 100)}</span>
            </div>
            {order.taxPaise > 0 && (
              <div>
                <span>GST</span>
                <span>{formatPrice(order.taxPaise / 100)}</span>
              </div>
            )}
            {order.discountPaise > 0 && (
              <div style={{ color: "#3a7d44" }}>
                <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                <span>−{formatPrice(order.discountPaise / 100)}</span>
              </div>
            )}
            <div className="confirmation-total">
              <span>Total</span>
              <strong>{formatPrice(order.totalPaise / 100)}</strong>
            </div>
          </div>
        </section>

        {/* Delivery address */}
        {order.shippingAddress && (
          <section aria-labelledby="delivery-heading">
            <h2 id="delivery-heading" className="serif">Delivering to</h2>
            <div className="confirmation-address">
              <p><strong>{order.shippingAddress.fullName}</strong></p>
              <p>{order.shippingAddress.phone}</p>
              <p>{order.shippingAddress.line1}
                {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
              </p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                – {order.shippingAddress.pincode}
              </p>
            </div>
          </section>
        )}

        {/* Status */}
        <section aria-labelledby="status-heading">
          <h2 id="status-heading" className="serif">Order status</h2>
          <div className="confirmation-status">
            <span className={`account-order-status status--${order.status.toLowerCase()}`}>
              {order.status}
            </span>
            <p style={{ marginTop: ".8rem" }}>
              Payment: <strong>{order.paymentStatus}</strong>
            </p>
            <p className="muted" style={{ fontSize: ".8rem", marginTop: ".4rem" }}>
              Placed on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>
        </section>
      </div>

      {/* CTAs */}
      <div className="confirmation-cta">
        <Link href="/shop" className="button">Continue browsing</Link>
        <Link href="/account" className="button button-outline">View account</Link>
      </div>
    </main>
  );
}
