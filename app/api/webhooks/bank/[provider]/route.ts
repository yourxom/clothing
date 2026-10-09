// Universal bank UPI webhook handler — one route handles all 5 banks.
// Route: POST /api/webhooks/bank/axis
//        POST /api/webhooks/bank/icici
//        POST /api/webhooks/bank/hdfc
//        POST /api/webhooks/bank/kotak
//        POST /api/webhooks/bank/bob
//
// Security contract (enforced in order):
// 1. Parse raw body (required for HMAC verification — do NOT use request.json())
// 2. Find the BankPaymentAccount matching this provider (active, default)
// 3. Verify webhook signature using that account's webhookSecret
// 4. Check idempotency (WebhookEvent table)
// 5. Find Payment session by merchantReference
// 6. Validate transaction (amount, currency, VPA, reference)
// 7. Mark payment PAID inside a DB transaction
// 8. Decrement inventory
// 9. Trigger referral reward
// 10. Write audit log
// 11. Send confirmation email
//
// NEVER mark a payment PAID based on an unverified webhook.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMerchantProvider } from "@/lib/payments/provider-registry";
import { getDefaultBankAccount } from "@/lib/payments/bank-account-service";
import { markPaymentPaid } from "@/lib/payments/payment-service";
import { recordPaymentEvent } from "@/lib/payments/events";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { rewardReferrerForOrder } from "@/lib/referral";
import type { BankUpiProvider } from "@/lib/payments/bank-provider";

export const dynamic = "force-dynamic";

const VALID_PROVIDERS = new Set(["axis", "icici", "hdfc", "kotak", "bob"]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: rawProvider } = await params;
  const providerSlug = rawProvider.toLowerCase();

  if (!VALID_PROVIDERS.has(providerSlug)) {
    return NextResponse.json({ error: "Unknown provider." }, { status: 404 });
  }

  // 1. Raw body — MUST be read before any other parsing for HMAC verification.
  const rawBody = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => { headers[k] = v; });

  // 2. Find the active bank account for this provider.
  const bankProviderEnum = providerSlug.toUpperCase() as "AXIS"|"ICICI"|"HDFC"|"KOTAK"|"BOB";
  const bankAccount = await getDefaultBankAccount(bankProviderEnum);
  if (!bankAccount) {
    console.error(`[webhook/${providerSlug}] No active bank account configured.`);
    // Return 200 to prevent bank retrying — but log the issue.
    return NextResponse.json({ ok: true, message: "No account configured." });
  }

  // 3. Instantiate provider with the bank account's credentials.
  const provider = await getMerchantProvider(bankAccount.id);
  if (!provider) {
    console.error(`[webhook/${providerSlug}] Could not instantiate provider for account ${bankAccount.id}.`);
    return NextResponse.json({ ok: true, message: "Provider unavailable." });
  }

  // 4. Verify webhook authenticity (bank-specific signature scheme).
  const bankProvider = provider as BankUpiProvider;
  const verified = await bankProvider.verifyBankWebhook(rawBody, headers);
  if (!verified.valid) {
    console.error(`[webhook/${providerSlug}] Signature verification FAILED. Possible spoofed request.`);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // 5. Idempotency — skip if this event was already processed.
  if (verified.eventId) {
    const exists = await db.webhookEvent.findUnique({
      where: { provider_eventId: { provider: providerSlug, eventId: verified.eventId } },
    });
    if (exists) {
      return NextResponse.json({ ok: true, message: "Already processed." });
    }
    // Record immediately to prevent race-condition double-processing.
    await db.webhookEvent.create({
      data: { provider: providerSlug, eventId: verified.eventId, payload: rawBody.slice(0, 50_000) },
    }).catch(() => { /* concurrent insert — idempotent */ });
  }

  // 6. Store raw transaction record (always, even if we can't match it to an order).
  const txRecord = await db.paymentTransaction.create({
    data: {
      provider:               providerSlug,
      providerTransactionId:  verified.providerTransactionId ?? null,
      rrn:                    verified.rrn ?? null,
      utr:                    verified.utr ?? null,
      merchantReference:      verified.merchantReference ?? null,
      payerVpa:               verified.payerVpa ?? null,
      payeeVpa:               verified.payeeVpa ?? null,
      amountPaise:            verified.amountPaise ?? 0,
      currency:               verified.currency ?? "INR",
      status:                 verified.status ?? "UNKNOWN",
      source:                 "webhook",
      bankAccountId:          bankAccount.id,
      reconciliationStatus:   "MANUAL_REVIEW",
      verificationMethod:     "webhook",
    },
  });

  // Only process SUCCESS events.
  if (verified.status !== "SUCCESS") {
    console.log(`[webhook/${providerSlug}] Non-success event: ${verified.status}. Stored for reconciliation.`);
    return NextResponse.json({ ok: true, message: "Event acknowledged." });
  }

  // 7. Find the Payment session by merchantReference.
  const merchantRef = verified.merchantReference;
  if (!merchantRef) {
    console.error(`[webhook/${providerSlug}] No merchantReference in webhook — cannot match to order.`);
    await db.paymentTransaction.update({
      where: { id: txRecord.id },
      data: { reconciliationStatus: "UNMATCHED", reconciliationNote: "No merchantReference in webhook payload." },
    });
    return NextResponse.json({ ok: true, message: "Stored for manual reconciliation." });
  }

  const payment = await db.payment.findFirst({
    where: { merchantReference: merchantRef, paymentMethod: "MERCHANT_UPI" },
    include: {
      order: {
        include: {
          user:  true,
          lines: { include: { product: true } },
        },
      },
    },
  });

  if (!payment) {
    console.error(`[webhook/${providerSlug}] No Payment found for merchantReference: ${merchantRef}`);
    await db.paymentTransaction.update({
      where: { id: txRecord.id },
      data: { reconciliationStatus: "UNMATCHED", reconciliationNote: `No payment found for ref: ${merchantRef}` },
    });
    return NextResponse.json({ ok: true, message: "Stored for manual reconciliation." });
  }

  // 8. Validate transaction — amount, currency, VPA, reference.
  const validation = bankProvider.validateTransaction(
    verified,
    payment.expectedAmountPaise,
    merchantRef
  );
  if (!validation.valid) {
    console.error(`[webhook/${providerSlug}] Validation FAILED: ${validation.reason}`);
    await recordPaymentEvent(payment.id, "PAYMENT_REJECTED", {
      source: "webhook",
      metadata: { reason: validation.reason, merchantRef },
    });
    await db.paymentTransaction.update({
      where: { id: txRecord.id },
      data: {
        paymentId: payment.id, orderId: payment.orderId,
        reconciliationStatus: verified.amountPaise !== payment.expectedAmountPaise
          ? "AMOUNT_MISMATCH" : "MANUAL_REVIEW",
        reconciliationNote: validation.reason ?? "Validation failed.",
      },
    });
    return NextResponse.json({ error: validation.reason }, { status: 422 });
  }

  // 9. Mark payment PAID inside a DB transaction (idempotent — safe to call twice).
  try {
    await db.$transaction(async (tx) => {
      await markPaymentPaid(tx, payment.id, {
        verificationType:    "AUTOMATIC",
        verifiedBySystem:    true,
        receivedAmountPaise: verified.amountPaise ?? payment.expectedAmountPaise,
        providerPaymentId:   verified.providerTransactionId ?? null,
        utr:                 verified.utr ?? verified.rrn ?? null,
      });

      // Decrement inventory.
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

      // Referral reward.
      await rewardReferrerForOrder(tx, {
        id: payment.order.id, userId: payment.order.userId,
        totalPaise: payment.order.totalPaise, referralRewarded: payment.order.referralRewarded,
      });
    });
  } catch (err) {
    if ((err as Error).message?.includes("Already paid")) {
      // Idempotent — already processed by a previous webhook delivery.
      return NextResponse.json({ ok: true, message: "Already processed." });
    }
    console.error(`[webhook/${providerSlug}] markPaymentPaid failed:`, err);
    return NextResponse.json({ error: (err as Error).message }, { status: 422 });
  }

  // 10. Link transaction record to the payment + update reconciliation status.
  await db.paymentTransaction.update({
    where: { id: txRecord.id },
    data: {
      paymentId:           payment.id,
      orderId:             payment.orderId,
      reconciliationStatus: "MATCHED",
      verifiedAt:          new Date(),
    },
  });

  await recordPaymentEvent(payment.id, "PAYMENT_VERIFIED", {
    source: "webhook",
    newStatus: "PAID",
    metadata: { providerTransactionId: verified.providerTransactionId, utr: verified.utr, rrn: verified.rrn },
  });

  // 11. Confirmation email (best-effort).
  const email = payment.order.user?.email;
  if (email) {
    sendOrderConfirmationEmail(
      email, payment.order.orderNumber, payment.order.totalPaise,
      payment.order.lines.map(l => ({ productName: l.product.name, size: l.size, quantity: l.quantity }))
    ).catch(e => console.error(`[webhook/${providerSlug}] Email failed:`, e));
  }

  return NextResponse.json({ ok: true });
}
