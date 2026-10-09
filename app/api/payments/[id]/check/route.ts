// Backend-initiated transaction status check — called when the webhook hasn't
// arrived yet. Queries ONLY the bank associated with the payment session.
// NEVER trusts the frontend's claim of success — this is a server→bank call.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMerchantProvider } from "@/lib/payments/provider-registry";
import { markPaymentPaid } from "@/lib/payments/payment-service";
import { recordPaymentEvent } from "@/lib/payments/events";
import { rewardReferrerForOrder } from "@/lib/referral";
import { sendOrderConfirmationEmail } from "@/lib/email";
import type { BankUpiProvider } from "@/lib/payments/bank-provider";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  const payment = await db.payment.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          user:  true,
          lines: { include: { product: true } },
        },
      },
    },
  });
  if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });

  // Authorization: only the order owner or admin may check.
  const isAdmin = ["admin","superadmin"].includes((session?.user as { role?: string })?.role ?? "");
  if (!isAdmin && payment.order.userId && session?.user?.id !== payment.order.userId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // If already paid, just return the current status.
  if (payment.status === "PAID") {
    return NextResponse.json({ ok: true, status: "PAID", alreadyPaid: true });
  }

  // Must be a MERCHANT_UPI payment with a merchantReference.
  if (payment.paymentMethod !== "MERCHANT_UPI" || !payment.merchantReference) {
    return NextResponse.json({ ok: false, status: payment.status, message: "Not a bank UPI payment." });
  }

  // Resolve provider using the exact bank account that created this payment session.
  const provider = await getMerchantProvider(payment.bankAccountId ?? undefined, payment.provider ?? undefined);
  if (!provider) {
    return NextResponse.json({ ok: false, status: payment.status, message: "Bank provider not available." });
  }

  // Query the bank's transaction status API.
  const bankProvider = provider as BankUpiProvider;
  let txStatus;
  try {
    txStatus = await bankProvider.queryTransactionStatus(
      payment.merchantReference,
      payment.providerOrderId ?? undefined
    );
  } catch (err) {
    console.error("[payments/check] queryTransactionStatus error:", err);
    return NextResponse.json({ ok: false, status: payment.status, message: "Bank API query failed." });
  }

  // Store the status-poll result for audit.
  await db.paymentTransaction.create({
    data: {
      paymentId:              payment.id,
      orderId:                payment.orderId,
      bankAccountId:          payment.bankAccountId ?? null,
      provider:               payment.provider ?? "",
      providerTransactionId:  txStatus.providerTransactionId ?? null,
      rrn:                    txStatus.rrn ?? null,
      utr:                    txStatus.utr ?? null,
      merchantReference:      payment.merchantReference,
      payeeVpa:               txStatus.rawResponse ? undefined : null,
      amountPaise:            txStatus.amountPaise ?? payment.expectedAmountPaise,
      currency:               txStatus.currency ?? "INR",
      status:                 txStatus.status,
      source:                 "status_poll",
      reconciliationStatus:   txStatus.status === "SUCCESS" ? "MATCHED" : "MANUAL_REVIEW",
      verificationMethod:     "status_api",
    },
  }).catch(() => { /* non-critical */ });

  await recordPaymentEvent(payment.id, "WEBHOOK_RECEIVED", {
    source: "system",
    metadata: { via: "status_poll", status: txStatus.status, rrn: txStatus.rrn },
  });

  if (txStatus.status !== "SUCCESS") {
    return NextResponse.json({ ok: true, status: payment.status, bankStatus: txStatus.status });
  }

  // Validate — same rigour as the webhook handler.
  const validation = bankProvider.validateTransaction(
    txStatus, payment.expectedAmountPaise, payment.merchantReference
  );
  if (!validation.valid) {
    return NextResponse.json({ ok: false, status: payment.status, message: validation.reason });
  }

  // Mark PAID in a transaction.
  try {
    await db.$transaction(async (tx) => {
      await markPaymentPaid(tx, payment.id, {
        verificationType:    "AUTOMATIC",
        verifiedBySystem:    true,
        receivedAmountPaise: txStatus.amountPaise ?? payment.expectedAmountPaise,
        providerPaymentId:   txStatus.providerTransactionId ?? null,
        utr:                 txStatus.utr ?? txStatus.rrn ?? null,
      });
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
        id: payment.order.id, userId: payment.order.userId,
        totalPaise: payment.order.totalPaise, referralRewarded: payment.order.referralRewarded,
      });
    });
  } catch (err) {
    if ((err as Error).message?.includes("Already paid")) {
      return NextResponse.json({ ok: true, status: "PAID", alreadyPaid: true });
    }
    return NextResponse.json({ ok: false, message: (err as Error).message }, { status: 422 });
  }

  const email = payment.order.user?.email;
  if (email) {
    sendOrderConfirmationEmail(
      email, payment.order.orderNumber, payment.order.totalPaise,
      payment.order.lines.map(l => ({ productName: l.product.name, size: l.size, quantity: l.quantity }))
    ).catch(console.error);
  }

  return NextResponse.json({ ok: true, status: "PAID" });
}
