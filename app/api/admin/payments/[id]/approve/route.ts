// Admin approves a Personal UPI payment after manually verifying receipt.
// Shows a confirmation prompt on the admin UI before this endpoint is called.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { markPaymentPaid } from "@/lib/payments/payment-service";
import { recordPaymentEvent } from "@/lib/payments/events";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { rewardReferrerForOrder } from "@/lib/referral";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;

  const payment = await db.payment.findUnique({
    where: { id },
    include: { order: { include: { user: true, lines: { include: { product: true } } } } },
  });
  if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  if (payment.paymentMethod !== "PERSONAL_UPI") {
    return NextResponse.json({ error: "Only Personal UPI payments require manual approval." }, { status: 400 });
  }
  if (payment.status === "PAID") {
    return NextResponse.json({ ok: true, message: "Already approved." });
  }
  if (!["UNDER_REVIEW", "PENDING_PAYMENT"].includes(payment.status)) {
    return NextResponse.json({ error: `Cannot approve a payment in status ${payment.status}.` }, { status: 400 });
  }

  const adminId = session.user?.id ?? "unknown";

  try {
    await db.$transaction(async (tx) => {
      await markPaymentPaid(tx, id, {
        verificationType:    "MANUAL",
        verifiedById:        adminId,
        receivedAmountPaise: payment.expectedAmountPaise,
      });

      // Decrement inventory (same pattern as verify-payment route).
      for (const line of payment.order.lines) {
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

      await rewardReferrerForOrder(tx, {
        id: payment.order.id,
        userId: payment.order.userId,
        totalPaise: payment.order.totalPaise,
        referralRewarded: payment.order.referralRewarded,
      });
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 422 });
  }

  await recordPaymentEvent(id, "PAYMENT_VERIFIED", {
    source: "admin", adminId,
    newStatus: "PAID",
    metadata: { approvedBy: adminId },
  });

  const rawEmail = payment.order.user?.email ?? payment.order.guestEmail;
  const email = (rawEmail && !rawEmail.endsWith("@phone.aurelia.local")) ? rawEmail : null;
  if (email) {
    sendOrderConfirmationEmail(
      email, payment.order.orderNumber, payment.order.totalPaise,
      payment.order.lines.map(l => ({ productName: l.product.name, size: l.size, quantity: l.quantity }))
    ).catch(console.error);
  }

  return NextResponse.json({ ok: true });
}
