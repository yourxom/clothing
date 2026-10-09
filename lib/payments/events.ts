// Append-only audit trail for payment lifecycle events (PaymentEvent table).
// Never record secrets, PINs, OTPs, or full card/UPI credentials in metadata.
import { db } from "@/lib/db";

export type PaymentEventType =
  | "PAYMENT_CREATED" | "CUSTOMER_SUBMITTED_PAYMENT" | "WEBHOOK_RECEIVED"
  | "PAYMENT_VERIFIED" | "PAYMENT_REJECTED" | "PAYMENT_EXPIRED"
  | "REFUND_CREATED" | "SETTINGS_UPDATED";

export type PaymentState =
  | "PENDING_PAYMENT" | "UNDER_REVIEW" | "PAID" | "FAILED"
  | "REJECTED" | "EXPIRED" | "REFUNDED" | "PARTIALLY_REFUNDED";

export async function recordPaymentEvent(
  paymentId: string,
  eventType: PaymentEventType,
  opts: {
    source: "customer" | "admin" | "webhook" | "system";
    adminId?: string | null;
    oldStatus?: PaymentState;
    newStatus?: PaymentState;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    await db.paymentEvent.create({
      data: {
        paymentId,
        eventType,
        oldStatus: opts.oldStatus ?? null,
        newStatus: opts.newStatus ?? null,
        source: opts.source,
        adminId: opts.adminId ?? null,
        metadata: opts.metadata ? JSON.stringify(opts.metadata).slice(0, 4000) : null,
      },
    });
  } catch (err) {
    // Audit logging must never crash the primary payment flow.
    console.error("[payments/events] Failed to record event:", eventType, err);
  }
}
