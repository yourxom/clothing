import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { sendOrderStatusEmail, sendOrderConfirmationEmail } from "@/lib/email";
import { restoreOrderStock } from "@/lib/order-stock";

type Props = { params: Promise<{ id: string }> };

// Statuses that warrant a customer notification email.
const NOTIFY_STATUSES = new Set(["CONFIRMED", "PROCESSING", "DELIVERED", "CANCELLED", "REFUNDED"]);
const ORDER_STATUSES = ["PENDING","CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CANCELLED","REFUNDED"];
const PAYMENT_STATUSES = ["PENDING","PAID","FAILED","REFUNDED"];
// Terminal states in which stock has already been returned to inventory.
const RESTORED_STATES = new Set(["CANCELLED", "REFUNDED"]);

export async function PATCH(request: NextRequest, { params }: Props) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const { status, paymentStatus } = (body as Record<string, unknown>) ?? {};

  const wantStatus  = status        !== undefined ? String(status)        : null;
  const wantPayment = paymentStatus !== undefined ? String(paymentStatus) : null;

  if (wantStatus === null && wantPayment === null) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 422 });
  }
  if (wantStatus !== null && !ORDER_STATUSES.includes(wantStatus)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 422 });
  }
  if (wantPayment !== null && !PAYMENT_STATUSES.includes(wantPayment)) {
    return NextResponse.json({ error: "Invalid payment status." }, { status: 422 });
  }

  // Load current state so we can account for stock correctly on transitions.
  const current = await db.order.findUnique({
    where:  { id },
    select: {
      status: true, paymentStatus: true, paymentProvider: true,
      lines: { select: { variantSku: true, quantity: true } },
    },
  });
  if (!current) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // Was stock reserved for this order? COD reserves at creation; gateway orders
  // reserve on successful payment.
  const stockReserved = current.paymentProvider === "cod" || current.paymentStatus === "PAID";
  // Restore stock only when transitioning INTO a cancelled/refunded state from a
  // non-restored state — never twice.
  const enteringRestored =
    wantStatus !== null &&
    RESTORED_STATES.has(wantStatus) &&
    !RESTORED_STATES.has(current.status);

  // If transitioning to PAID, stock needs to be reserved if not already done.
  const enteringPaid = wantPayment === "PAID" && current.paymentStatus !== "PAID" && !stockReserved;

  const data: Record<string, unknown> = {};
  if (wantStatus  !== null) data.status        = wantStatus;
  if (wantPayment !== null) {
    data.paymentStatus = wantPayment;
    // If setting payment to PAID on a PENDING order, also confirm the order if not explicitly set
    if (wantPayment === "PAID" && wantStatus === null && current.status === "PENDING") {
      data.status = "CONFIRMED";
    }
  }

  const order = await db.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where:  { id },
      data:   data as never,
      select: {
        id: true, orderNumber: true, status: true, paymentStatus: true,
        guestEmail: true, totalPaise: true,
        user: { select: { email: true } },
        lines: { select: { productName: true, size: true, quantity: true } },
      },
    });

    // Reserve stock if transitioning to PAID
    if (enteringPaid) {
      for (const line of current.lines) {
        const variant = await tx.productVariant.findUnique({
          where:  { sku: line.variantSku },
          select: { id: true, inventory: { select: { id: true, quantity: true } } },
        });
        if (variant?.inventory) {
          await tx.inventory.update({
            where: { id: variant.inventory.id },
            data:  { quantity: Math.max(0, variant.inventory.quantity - line.quantity) },
          });
        }
      }
    }

    // Restore stock if transitioning to CANCELLED or REFUNDED
    if (enteringRestored && (stockReserved || enteringPaid)) {
      await restoreOrderStock(tx, current.lines);
    }

    // Sync associated payment record if exists
    const latestPayment = await tx.payment.findFirst({
      where: { orderId: id },
      orderBy: { createdAt: "desc" },
    });

    if (latestPayment) {
      if (wantPayment === "PAID" && latestPayment.status !== "PAID") {
        await tx.payment.update({
          where: { id: latestPayment.id },
          data: {
            status: "PAID",
            receivedAmountPaise: latestPayment.expectedAmountPaise,
            verificationType: "MANUAL",
            verifiedById: session.user?.id ?? null,
            verifiedAt: new Date(),
          },
        });
      } else if ((wantPayment === "FAILED" || wantStatus === "CANCELLED") &&
                 (latestPayment.status === "PENDING_PAYMENT" || latestPayment.status === "UNDER_REVIEW")) {
        await tx.payment.update({
          where: { id: latestPayment.id },
          data: {
            status: "REJECTED",
            rejectionReason: "Order cancelled or payment marked failed by admin",
            verifiedById: session.user?.id ?? null,
            verifiedAt: new Date(),
          },
        });
      }
    }

    return updated;
  });

  // Notify the customer of a status change. Non-blocking — never fail the update.
  // When admin confirms an order, dispatch the full order confirmation email.
  if (wantStatus !== null && NOTIFY_STATUSES.has(wantStatus)) {
    const rawEmail = order.user?.email ?? order.guestEmail;
    const to = (rawEmail && !rawEmail.endsWith("@phone.aurelia.local")) ? rawEmail : null;
    if (to) {
      if (wantStatus === "CONFIRMED" && current.status !== "CONFIRMED") {
        void sendOrderConfirmationEmail(
          to,
          order.orderNumber,
          order.totalPaise,
          order.lines.map(l => ({ productName: l.productName, size: l.size, quantity: l.quantity }))
        ).catch(err => console.error("[orders] confirmation email failed:", err));
      } else if (wantStatus !== "CONFIRMED") {
        void sendOrderStatusEmail(to, order.orderNumber, wantStatus).catch(err =>
          console.error("[orders] status email failed:", err)
        );
      }
    }
  }

  return NextResponse.json({ ok: true, order });
}
