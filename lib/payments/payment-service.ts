// PaymentService — the single entry point checkout/admin code calls into.
// Keeps Razorpay/Cashfree/manual-UPI specifics out of the checkout route and
// out of admin routes. Internally delegates to the provider registry (for
// Merchant UPI) or applies manual-verification rules (for Personal UPI).
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { getMerchantProvider } from "@/lib/payments/provider-registry";
import { getPaymentSettings } from "@/lib/payments/settings";
import { buildUpiPaymentUri, generateUpiQrDataUrl } from "@/lib/payments/upi-qr";
import { recordPaymentEvent } from "@/lib/payments/events";

type DbClient = typeof db | Prisma.TransactionClient;

export type OrderForPayment = {
  id: string;
  orderNumber: string;
  totalPaise: number;
  currency: string;
  userId: string | null;
};

/** Normalizes a UTR/reference string for consistent duplicate-detection comparisons. */
export function normalizeUtr(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Starts a MERCHANT_UPI payment attempt: creates a Payment row (PENDING_PAYMENT)
 * and a provider-side order/session. Returns what the frontend needs to collect
 * payment (e.g. bank UPI QR data or Razorpay checkout.js config).
 *
 * @param bankAccountId  Optional: specific BankPaymentAccount.id to use.
 *                       If null, resolves via provider-registry (default account).
 */
export async function createMerchantPayment(
  order: OrderForPayment,
  customer: { name?: string; email?: string; phone?: string },
  bankAccountId?: string | null
) {
  const provider = await getMerchantProvider(bankAccountId ?? undefined);
  if (!provider) throw new Error("Merchant UPI is not configured or enabled.");

  // Generate a unique merchant reference for this payment attempt.
  // PAY-ORD12345-A83F9K format. Never reused — each attempt gets a new one.
  const merchantReference = `PAY-${order.orderNumber}-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  const result = await provider.createPayment({
    orderId:      order.id,
    orderNumber:  order.orderNumber,
    amountPaise:  order.totalPaise, // server-calculated — never trust a client-supplied amount
    currency:     order.currency,
    customerName:  customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    notes: { merchantReference },
  });

  const payment = await db.payment.create({
    data: {
      orderId:          order.id,
      userId:           order.userId,
      paymentMethod:    "MERCHANT_UPI",
      provider:         provider.name,
      bankAccountId:    bankAccountId ?? null,
      merchantReference,
      providerOrderId:  result.providerOrderId,
      expectedAmountPaise: order.totalPaise,
      currency:         order.currency,
      status:           "PENDING_PAYMENT",
      verificationType: "AUTOMATIC",
      expiresAt:        result.expiresAt ?? null,
    },
  });

  await recordPaymentEvent(payment.id, "PAYMENT_CREATED", { source: "system", newStatus: "PENDING_PAYMENT" });

  // Keep the Order row's legacy fields in sync for existing code that reads them.
  await db.order.update({
    where: { id: order.id },
    data: { paymentProvider: provider.name, paymentReference: result.providerOrderId },
  });

  return { payment, clientConfig: result.clientConfig, merchantReference };
}

/**
 * Starts a PERSONAL_UPI payment attempt: creates a Payment row and generates
 * a dynamic UPI QR from server-trusted order data (never from frontend input).
 */
export async function createPersonalUpiPayment(order: OrderForPayment) {
  const settings = await getPaymentSettings();
  if (!settings.personalUpiEnabled || !settings.personal.upiId) {
    throw new Error("Personal UPI is not configured or enabled.");
  }

  const payment = await db.payment.create({
    data: {
      orderId:  order.id,
      userId:   order.userId,
      paymentMethod: "PERSONAL_UPI",
      expectedAmountPaise: order.totalPaise,
      currency: order.currency,
      status: "PENDING_PAYMENT",
      verificationType: "MANUAL",
    },
  });

  await recordPaymentEvent(payment.id, "PAYMENT_CREATED", { source: "system", newStatus: "PENDING_PAYMENT" });

  let qrDataUrl: string | null = null;
  let upiUri: string | null = null;
  if (settings.personal.useDynamicQr) {
    upiUri = buildUpiPaymentUri({
      payeeVpa:    settings.personal.upiId,
      payeeName:   settings.personal.accountName || "AURELIA",
      amountPaise: order.totalPaise,
      orderNumber: order.orderNumber,
    });
    qrDataUrl = await generateUpiQrDataUrl(upiUri);
  }

  return {
    payment,
    upiId:        settings.personal.upiId,
    accountName:  settings.personal.accountName,
    bankName:     settings.personal.bankName,
    instructions: settings.personal.instructions,
    qrImageUrl:   settings.personal.useDynamicQr ? qrDataUrl : settings.personal.qrImageUrl,
    upiUri,
    amountPaise:  order.totalPaise,
  };
}

/**
 * Customer submits UTR (+ optional screenshot) for a Personal UPI payment.
 * Moves the payment to UNDER_REVIEW. Never marks it PAID — only an admin can.
 * Flags (but does not block) a UTR that matches a previously-approved payment.
 */
export async function submitPersonalUpiPayment(paymentId: string, input: {
  utr: string;
  payerName?: string | null;
  screenshotUrl?: string | null;
}) {
  const normalizedUtr = normalizeUtr(input.utr);
  if (!normalizedUtr) throw new Error("A valid UTR / transaction reference is required.");

  const duplicate = await db.payment.findFirst({
    where: { utr: normalizedUtr, status: "PAID", id: { not: paymentId } },
    select: { id: true },
  });

  const payment = await db.payment.update({
    where: { id: paymentId },
    data: {
      utr: normalizedUtr,
      ...(input.payerName ? { payerName: input.payerName.trim() } : {}),
      screenshotUrl: input.screenshotUrl ?? null,
      status: "UNDER_REVIEW",
      possibleDuplicate: Boolean(duplicate),
      submittedAt: new Date(),
    } as any,
  });

  await recordPaymentEvent(payment.id, "CUSTOMER_SUBMITTED_PAYMENT", {
    source: "customer",
    oldStatus: "PENDING_PAYMENT",
    newStatus: "UNDER_REVIEW",
    metadata: {
      possibleDuplicate: Boolean(duplicate),
      payerName: input.payerName?.trim() || null,
    },
  });

  return payment;
}

/**
 * Marks a payment PAID after verification (automatic via webhook/API, or
 * manual via admin approval). This is the ONLY path that may set PAID —
 * never trust a frontend "payment succeeded" signal on its own.
 *
 * Validates: order exists, amount matches, currency matches, not already PAID.
 * Idempotent — calling this twice for an already-PAID payment is a no-op.
 */
export async function markPaymentPaid(
  tx: DbClient,
  paymentId: string,
  verification: {
    verificationType: "AUTOMATIC" | "MANUAL";
    verifiedById?: string | null;   // admin User.id for MANUAL
    verifiedBySystem?: boolean;     // true for AUTOMATIC
    receivedAmountPaise: number;
    providerPaymentId?: string | null;
    providerSignature?: string | null;
    utr?: string | null;
  }
) {
  const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
  if (!payment) throw new Error("Payment not found.");

  // Idempotency: already paid — no-op, do not double-process.
  if (payment.status === "PAID") return payment;

  if (payment.order.currency !== "INR") {
    throw new Error("Unsupported currency.");
  }
  if (verification.receivedAmountPaise !== payment.expectedAmountPaise) {
    throw new Error(
      `Amount mismatch: expected ${payment.expectedAmountPaise}, received ${verification.receivedAmountPaise}.`
    );
  }

  const updated = await tx.payment.update({
    where: { id: paymentId },
    data: {
      status: "PAID",
      receivedAmountPaise: verification.receivedAmountPaise,
      providerPaymentId: verification.providerPaymentId ?? payment.providerPaymentId,
      providerSignature: verification.providerSignature ?? payment.providerSignature,
      utr: verification.utr ? normalizeUtr(verification.utr) : payment.utr,
      verificationType: verification.verificationType,
      verifiedById: verification.verifiedById ?? null,
      verifiedBySystem: Boolean(verification.verifiedBySystem),
      verifiedAt: new Date(),
    },
  });

  await tx.order.update({
    where: { id: payment.orderId },
    data: { paymentStatus: "PAID", status: "CONFIRMED" },
  });

  return updated;
}

/** Admin rejects a Personal UPI submission. Original record is kept (never deleted). */
export async function rejectPayment(paymentId: string, adminId: string, reason: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new Error("Payment not found.");

  const updated = await db.payment.update({
    where: { id: paymentId },
    data: {
      status: "REJECTED",
      rejectionReason: reason.slice(0, 300),
      verifiedById: adminId,
      verifiedAt: new Date(),
    },
  });

  // Sync the order status so both customer and admin portals reflect the rejection
  await db.order.update({
    where: { id: payment.orderId },
    data: {
      paymentStatus: "FAILED",
      status: "CANCELLED",
    },
  }).catch(err => console.error("[payments] Failed to update order on payment rejection:", err));

  await recordPaymentEvent(payment.id, "PAYMENT_REJECTED", {
    source: "admin", adminId, oldStatus: payment.status, newStatus: "REJECTED", metadata: { reason },
  });

  return updated;
}
