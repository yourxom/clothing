// Verifies Razorpay payment signature after client-side payment completion.
// Also creates/updates a Payment row for audit trail completeness.
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { rewardReferrerForOrder } from "@/lib/referral";
import { recordPaymentEvent } from "@/lib/payments/events";

export async function POST(request: NextRequest) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: "Payment gateway not configured." }, { status: 503 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
    (body as Record<string, unknown>) ?? {};

  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json({ error: "Missing required payment fields." }, { status: 422 });
  }

  // Verify HMAC signature (constant-time comparison)
  const payload  = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto.createHmac("sha256", keySecret).update(payload).digest("hex");
  const valid = expected.length === String(razorpaySignature).length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(razorpaySignature)));

  if (!valid) {
    console.error("[verify-payment] Signature mismatch for order:", orderId);
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  // Mark order as confirmed and decrement inventory atomically
  const order = await db.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: String(orderId) },
      data:  {
        paymentStatus:    "PAID",
        status:           "CONFIRMED",
        paymentReference: String(razorpayPaymentId),
      },
      include: { lines: true },
    });

    // Decrement inventory
    for (const line of updated.lines) {
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

    // Update the Payment row if one exists (created by createMerchantPayment).
    const payment = await tx.payment.findFirst({
      where: { orderId: String(orderId), paymentMethod: "MERCHANT_UPI" },
      select: { id: true },
    });
    if (payment) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          providerPaymentId: String(razorpayPaymentId),
          providerSignature: String(razorpaySignature),
          receivedAmountPaise: updated.totalPaise,
          verificationType: "AUTOMATIC",
          verifiedBySystem: true,
          verifiedAt: new Date(),
        },
      });
      await recordPaymentEvent(payment.id, "PAYMENT_VERIFIED", {
        source: "webhook",
        newStatus: "PAID",
        metadata: { razorpayPaymentId: String(razorpayPaymentId), via: "client-verify" },
      });
    }

    await rewardReferrerForOrder(tx, {
      id: updated.id,
      userId: updated.userId,
      totalPaise: updated.totalPaise,
      referralRewarded: updated.referralRewarded,
    });

    return updated;
  });

  // Clear the user's cart now that payment has succeeded
  if (order.userId) {
    await db.savedItem.deleteMany({ where: { userId: order.userId, type: "BAG" } }).catch(console.error);
  }

  // Send order confirmation email to the customer
  const user = order.userId ? await db.user.findUnique({ where: { id: order.userId }, select: { email: true } }) : null;
  const customerEmail = user?.email ?? order.guestEmail;
  if (customerEmail) {
    const { sendOrderConfirmationEmail } = await import("@/lib/email");
    await sendOrderConfirmationEmail(
      customerEmail,
      order.orderNumber,
      order.totalPaise,
      order.lines.map(l => ({ productName: l.productName, size: l.size, quantity: l.quantity }))
    ).catch(err => console.error("[verify-payment] Failed to send order confirmation email:", err));
  }

  return NextResponse.json({ ok: true, order });
}
