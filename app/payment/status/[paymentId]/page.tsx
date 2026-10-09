import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Payment Status — AURELIA" };
export const dynamic = "force-dynamic";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p / 100);

export default async function PaymentStatusPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const session = await auth();
  const { paymentId } = await params;

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: {
        include: {
          user: { select: { id: true, email: true } },
        },
      },
    },
  });
  if (!payment) notFound();

  // Authorization: only owner or admin may view.
  const isAdmin = ["admin", "superadmin"].includes((session?.user as { role?: string })?.role ?? "");
  if (!isAdmin) {
    const ownerId = payment.order.userId;
    const guestEmail = payment.order.guestEmail;
    const sessionId = session?.user?.id;
    const sessionEmail = session?.user?.email;
    if (ownerId && sessionId && ownerId !== sessionId) redirect("/account/orders");
    if (!ownerId && guestEmail && sessionEmail && guestEmail !== sessionEmail) redirect("/");
  }

  const statusConfig = {
    PENDING_PAYMENT: {
      icon: "⏳", title: "Awaiting Payment",
      sub: "Please complete your payment to confirm the order.",
      color: "#706b62", bg: "#f5f5f0",
    },
    UNDER_REVIEW: {
      icon: "🕐", title: "Payment Submitted",
      sub: "Your payment details have been received and are being verified by our team.",
      color: "#b77b00", bg: "#fffbee",
    },
    PAID: {
      icon: "✅", title: "Payment Verified",
      sub: payment.verificationType === "AUTOMATIC"
        ? "Your payment was automatically verified. Order confirmed."
        : "Your payment was verified by our team. Order confirmed.",
      color: "#2e7d32", bg: "#eafbf1",
    },
    FAILED: {
      icon: "❌", title: "Payment Failed",
      sub: "Your payment could not be processed. Please try again.",
      color: "#c0392b", bg: "#fff0f0",
    },
    REJECTED: {
      icon: "❌", title: "Payment Not Verified",
      sub: payment.rejectionReason ?? "We could not verify your payment.",
      color: "#c0392b", bg: "#fff0f0",
    },
    EXPIRED: {
      icon: "⏰", title: "Payment Expired",
      sub: "This payment session has expired. Please start a new payment.",
      color: "#706b62", bg: "#f5f5f0",
    },
    REFUNDED:          { icon: "↩️", title: "Refunded",          sub: "Your payment has been refunded.",            color: "#1a5c9e", bg: "#f0f4ff" },
    PARTIALLY_REFUNDED:{ icon: "↩️", title: "Partially Refunded", sub: "A partial refund has been issued.",          color: "#1a5c9e", bg: "#f0f4ff" },
  } as const;

  const cfg = statusConfig[payment.status as keyof typeof statusConfig] ?? {
    icon: "ℹ️", title: payment.status, sub: "", color: "#706b62", bg: "#f5f5f0",
  };

  return (
    <main className="account-shell">
      <div className="payment-page">
        <div className="payment-success-card" style={{ borderColor: cfg.color }}>
          <div className="payment-success-icon" style={{ background: cfg.bg, borderRadius: "50%", padding: ".4rem", display: "inline-block", marginBottom: ".6rem" }}>
            {cfg.icon}
          </div>
          <h1 className="payment-success-title">{cfg.title}</h1>
          <p className="payment-success-sub">{cfg.sub}</p>

          <table className="payment-detail-table">
            <tbody>
              <tr><td>Order</td><td><strong>#{payment.order.orderNumber}</strong></td></tr>
              <tr><td>Amount</td><td><strong>{fmt(payment.expectedAmountPaise)}</strong></td></tr>
              <tr><td>Method</td><td>{payment.paymentMethod === "MERCHANT_UPI" ? "UPI (automatic)" : "Direct UPI (manual)"}</td></tr>
              {payment.utr && <tr><td>UTR / Ref</td><td style={{ fontFamily: "monospace" }}>{payment.utr}</td></tr>}
              {payment.providerPaymentId && <tr><td>Payment ID</td><td style={{ fontFamily: "monospace", fontSize: ".78rem" }}>{payment.providerPaymentId}</td></tr>}
              <tr>
                <td>Status</td>
                <td>
                  <span className={`payment-status payment-status--${payment.status.toLowerCase().replace(/_/g, "-")}`}>
                    {payment.status.replace(/_/g, " ")}
                  </span>
                </td>
              </tr>
              {payment.verifiedAt && (
                <tr><td>Verified at</td><td>{new Date(payment.verifiedAt).toLocaleString("en-IN")}</td></tr>
              )}
            </tbody>
          </table>

          <div style={{ display: "flex", gap: ".8rem", justifyContent: "center", marginTop: "1.5rem", flexWrap: "wrap" }}>
            <Link href="/account/orders" className="button">View all orders</Link>
            {(payment.status === "REJECTED" || payment.status === "FAILED" || payment.status === "EXPIRED") && (
              <Link href={`/account/orders/${payment.orderId}`} className="button button-outline">Try payment again</Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
