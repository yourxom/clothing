// Razorpay implementation of the PaymentProvider interface — Merchant UPI
// with automatic verification. Credentials come from encrypted admin settings
// (lib/payments/settings.ts), falling back to .env for backward compatibility
// with the original integration (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).
import crypto from "crypto";
import type {
  PaymentProvider, CreatePaymentInput, CreatePaymentResult,
  PaymentStatusResult, WebhookVerifyInput, WebhookVerifyResult, RefundResult,
} from "@/lib/payments/provider";

export class RazorpayProvider implements PaymentProvider {
  readonly name = "razorpay";

  constructor(
    private keyId: string,
    private keySecret: string,
    private webhookSecret: string,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.keyId && this.keySecret);
  }

  private authHeader(): string {
    return `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64")}`;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (!this.isConfigured()) throw new Error("Razorpay is not configured.");

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": this.authHeader() },
      body: JSON.stringify({
        amount:   input.amountPaise,
        currency: input.currency,
        receipt:  input.orderNumber,
        notes:    { aur_order_id: input.orderId, ...input.notes },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[razorpay] Order creation failed:", err);
      throw new Error("Payment gateway error. Please try again.");
    }

    const rzpOrder = await res.json() as { id: string; amount: number; currency: string };
    return {
      providerOrderId: rzpOrder.id,
      clientConfig: {
        keyId:    this.keyId,
        amount:   rzpOrder.amount,
        currency: rzpOrder.currency,
        orderId:  rzpOrder.id,
      },
    };
  }

  async getPaymentStatus(providerPaymentId: string): Promise<PaymentStatusResult> {
    if (!this.isConfigured()) throw new Error("Razorpay is not configured.");
    const res = await fetch(`https://api.razorpay.com/v1/payments/${providerPaymentId}`, {
      headers: { "Authorization": this.authHeader() },
    });
    if (!res.ok) return { status: "failed" };
    const payment = await res.json() as {
      id: string; status: string; amount: number; currency: string; acquirer_data?: { rrn?: string };
    };
    const statusMap: Record<string, PaymentStatusResult["status"]> = {
      captured: "paid", authorized: "pending", created: "pending", failed: "failed",
    };
    return {
      status: statusMap[payment.status] ?? "pending",
      providerPaymentId: payment.id,
      receivedAmountPaise: payment.amount,
      currency: payment.currency,
      utr: payment.acquirer_data?.rrn,
      raw: payment,
    };
  }

  /**
   * Verifies the Razorpay webhook signature per their documented scheme:
   * HMAC-SHA256 of the raw request body, using the webhook secret configured
   * in the Razorpay dashboard, compared against the X-Razorpay-Signature header.
   * https://razorpay.com/docs/webhooks/validate-test/
   */
  async verifyWebhook(input: WebhookVerifyInput): Promise<WebhookVerifyResult> {
    if (!this.webhookSecret) {
      console.error("[razorpay] Webhook secret not configured; rejecting webhook.");
      return { valid: false };
    }
    const expected = crypto.createHmac("sha256", this.webhookSecret).update(input.rawBody).digest("hex");
    // Constant-time comparison to avoid timing side-channels.
    const valid = expected.length === input.signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(input.signature));
    if (!valid) return { valid: false };

    let parsed: {
      event?: string;
      payload?: { payment?: { entity?: {
        id?: string; order_id?: string; status?: string; amount?: number; currency?: string;
        acquirer_data?: { rrn?: string };
      } } };
    };
    try { parsed = JSON.parse(input.rawBody); } catch { return { valid: false }; }

    const entity = parsed.payload?.payment?.entity;
    const statusMap: Record<string, "paid" | "failed" | "pending"> = {
      captured: "paid", failed: "failed", authorized: "pending",
    };

    return {
      valid: true,
      // Razorpay webhooks don't include a separate "event id" field distinct
      // from payment id in the base plan; use payment id + event name as the
      // idempotency key, which is unique per (payment, event-type) delivery.
      eventId:    entity?.id ? `${entity.id}:${parsed.event ?? ""}` : undefined,
      eventType:  parsed.event,
      providerOrderId:   entity?.order_id,
      providerPaymentId: entity?.id,
      status:     entity?.status ? (statusMap[entity.status] ?? "pending") : undefined,
      receivedAmountPaise: entity?.amount,
      currency:   entity?.currency,
      utr:        entity?.acquirer_data?.rrn,
      raw:        parsed,
    };
  }

  async refundPayment(providerPaymentId: string, amountPaise: number): Promise<RefundResult> {
    if (!this.isConfigured()) return { ok: false, error: "Razorpay is not configured." };
    const res = await fetch(`https://api.razorpay.com/v1/payments/${providerPaymentId}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": this.authHeader() },
      body: JSON.stringify({ amount: amountPaise }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: (err as { error?: { description?: string } })?.error?.description ?? "Refund failed." };
    }
    const refund = await res.json() as { id: string };
    return { ok: true, providerRefundId: refund.id };
  }
}
