// Razorpay webhook endpoint — verifies the webhook signature cryptographically,
// checks idempotency, then marks the payment PAID after validating amount/currency.
// NEVER marks an order paid based on frontend claims — only on verified webhooks.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMerchantProvider } from "@/lib/payments/provider-registry";
import { markPaymentPaid } from "@/lib/payments/payment-service";
import { recordPaymentEvent } from "@/lib/payments/events";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { rewardReferrerForOrder } from "@/lib/referral";

export const dynamic = "force-dynamic";

// Razorpay requires the raw body for signature verification.
// Next.js App Router: use request.text() to get the raw body.
export async function POST(request: NextRequest) {
  const rawBody  = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const provider = await getMerchantProvider();
  if (!provider) {
    console.error("[webhook/razorpay] No provider configured — rejecting webhook.");
    return NextResponse.json({ error: "Provider not configured." }, { status: 503 });
  }

  // 1. Verify signature authenticity (HMAC-SHA256, constant-time comparison).
  const verified = await provider.verifyWebhook({ rawBody, signature });
  if (!verified.valid) {
    console.error("[webhook/razorpay] Invalid signature — possible spoofed request.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // 2. Idempotency — if we've already processed this exact event, return 200 immediately.
  if (verified.eventId) {
    const alreadyProcessed = await db.webhookEvent.findUnique({
      where: { provider_eventId: { provider: "razorpay", eventId: verified.eventId } },
    });
    if (alreadyProcessed) {
      return NextResponse.json({ ok: true, message: "Already processed." });
    }
    // Record the event first (before any state mutation) so duplicate deliveries
    // from retries are caught even if the handler partially fails.
    await db.webhookEvent.create({
      data: { provider: "razorpay", eventId: verified.eventId, payload: rawBody.slice(0, 50000) },
    }).catch(() => { /* race condition: another process beat us — idempotent, both succeed */ });
  }

  // 3. Only process payment.captured (successful payment) events.
  if (verified.eventType !== "payment.captured" || verified.status !== "paid") {
    // Log other events for audit but don't act on them.
    console.log(`[webhook/razorpay] Ignored event: ${verified.eventType} / ${verified.status}`);
    return NextResponse.json({ ok: true, message: "Event acknowledged." });
  }

  if (!verified.providerOrderId || !verified.providerPaymentId || !verified.receivedAmountPaise) {
    console.error("[webhook/razorpay] Webhook missing required fields:", verified);
    return NextResponse.json({ error: "Incomplete webhook data." }, { status: 422 });
  }

  // 4. Find the Payment row by providerOrderId.
  const payment = await db.payment.findFirst({
    where: { providerOrderId: verified.providerOrderId, paymentMethod: "MERCHANT_UPI" },
    include: {
      order: {
        include: {
          user: true,
          lines: { include: { product: true } },
        },
      },
    },
  });
  if (!payment) {
    console.error("[webhook/razorpay] No Payment row for providerOrderId:", verified.providerOrderId);
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  await recordPaymentEvent(payment.id, "WEBHOOK_RECEIVED", {
    source: "webhook",
    metadata: { eventType: verified.eventType, providerPaymentId: verified.providerPaymentId },
  });

  // 5. Mark paid in a transaction — validates amount, currency, idempotency.
  try {
    await db.$transaction(async (tx) => {
      await markPaymentPaid(tx, payment.id, {
        verificationType:    "AUTOMATIC",
        verifiedBySystem:    true,
        receivedAmountPaise: verified.receivedAmountPaise!,
        providerPaymentId:   verified.providerPaymentId,
        utr:                 verified.utr,
      });

      // Decrement inventory for each ordered line (same pattern as verify-payment route).
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

      // Reward referrer if applicable (idempotent — guarded inside rewardReferrerForOrder).
      await rewardReferrerForOrder(tx, {
        id: payment.order.id,
        userId: payment.order.userId,
        totalPaise: payment.order.totalPaise,
        referralRewarded: payment.order.referralRewarded,
      });
    });
  } catch (err) {
    // Amount mismatch or other validation failure — do NOT mark paid.
    console.error("[webhook/razorpay] markPaymentPaid failed:", err);
    await recordPaymentEvent(payment.id, "PAYMENT_REJECTED", {
      source: "webhook",
      metadata: { reason: (err as Error).message },
    });
    return NextResponse.json({ error: (err as Error).message }, { status: 422 });
  }

  await recordPaymentEvent(payment.id, "PAYMENT_VERIFIED", {
    source: "webhook",
    newStatus: "PAID",
    metadata: { providerPaymentId: verified.providerPaymentId, utr: verified.utr },
  });

  // 6. Send order confirmation email (best-effort).
  const email = payment.order.user?.email;
  if (email) {
    sendOrderConfirmationEmail(
      email,
      payment.order.orderNumber,
      payment.order.totalPaise,
      payment.order.lines.map(l => ({ productName: l.product.name, size: l.size, quantity: l.quantity }))
    ).catch(err => console.error("[webhook/razorpay] Confirmation email failed:", err));
  }

  return NextResponse.json({ ok: true });
}
