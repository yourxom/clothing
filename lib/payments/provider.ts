// Provider adapter interface — every Merchant UPI provider (Razorpay, Cashfree,
// a direct bank UPI integration, or a future provider) implements this same
// contract. The checkout/payment layer only ever talks to this interface, so
// swapping providers never requires touching checkout code.

export type CreatePaymentInput = {
  orderId:         string; // our internal Order.id
  orderNumber:     string; // human-facing order number, e.g. AUR-2026-00001
  amountPaise:     number; // server-calculated, authoritative amount
  currency:        string; // "INR"
  customerName?:   string;
  customerEmail?:  string;
  customerPhone?:  string;
  notes?:          Record<string, string>;
};

export type CreatePaymentResult = {
  providerOrderId: string;   // provider's order/session id
  providerPaymentId?: string; // some providers issue this immediately
  // Data the frontend needs to actually collect payment (e.g. Razorpay's
  // checkout.js needs { keyId, amount, currency, orderId }; a UPI-QR-based
  // provider might return a QR image/string instead).
  clientConfig:    Record<string, unknown>;
  expiresAt?:      Date;
};

export type PaymentStatusResult = {
  status:          "created" | "pending" | "paid" | "failed" | "expired";
  providerPaymentId?: string;
  receivedAmountPaise?: number;
  currency?:       string;
  utr?:            string; // bank reference, when the provider exposes one
  raw?:            unknown; // provider's raw response, for logging/audit only
};

export type WebhookVerifyInput = {
  rawBody:   string;         // exact raw request body (signature is computed over this)
  signature: string;         // signature header value from the request
  headers?:  Record<string, string>;
};

export type WebhookVerifyResult = {
  valid: boolean;
  eventId?: string;          // provider's unique event id, for idempotency
  eventType?: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  status?: "paid" | "failed" | "pending";
  receivedAmountPaise?: number;
  currency?: string;
  utr?: string;
  raw?: unknown;
};

export type RefundResult = {
  ok: boolean;
  providerRefundId?: string;
  error?: string;
};

/**
 * Every Merchant UPI (or future) payment provider implements this interface.
 * Implementations must NEVER log or persist raw secrets, and must verify
 * webhook authenticity cryptographically per the provider's own documentation.
 */
export interface PaymentProvider {
  readonly name: string; // e.g. "razorpay"

  /** True only when valid credentials are configured for this provider. */
  isConfigured(): boolean;

  /** Creates a payment session/order with the provider for the given amount. */
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;

  /** Polls the provider for the current status of a previously-created payment. */
  getPaymentStatus(providerPaymentId: string): Promise<PaymentStatusResult>;

  /** Verifies a webhook payload's authenticity (signature) and parses its contents. */
  verifyWebhook(input: WebhookVerifyInput): Promise<WebhookVerifyResult>;

  /** Issues a refund for a previously-paid payment. */
  refundPayment(providerPaymentId: string, amountPaise: number): Promise<RefundResult>;
}
