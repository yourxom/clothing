// Axis Bank Direct UPI Merchant Provider
//
// INTEGRATION REQUIREMENTS (obtain from Axis Bank merchant onboarding):
// - Signed merchant agreement with Axis Bank
// - Registered business with GST in India
// - Axis Bank business current account
// - Axis Bank Merchant UPI / API banking credentials
//
// CREDENTIALS NEEDED (set via Admin → Payment Accounts):
//   apiKey        → Axis client_id (from Axis API portal)
//   apiSecret     → Axis client_secret (from Axis API portal)
//   webhookSecret → Webhook HMAC signing key (configured in Axis merchant dashboard)
//   merchantId    → Axis merchant code / MID
//   additionalCreds.virtualAddress → Your registered Axis merchant VPA (e.g. aurelia@axis)
//
// ONBOARDING: Contact Axis Bank corporate banking / merchant services team.
// API Documentation: Shared under NDA post-onboarding via Axis API developer portal.
//
// TODO (fill in once you have Axis API docs):
//   - Replace placeholder URLs with real Axis API endpoints
//   - Implement Axis-specific request signing (OAuth2 / HMAC / header-based)
//   - Parse Axis-specific response codes into standard statuses
//   - Handle Axis-specific error codes

import { buildUpiPaymentUri, generateUpiQrDataUrl } from "@/lib/payments/upi-qr";
import { BaseBankUpiProvider } from "@/lib/payments/providers/base-bank-provider";
import type { BankAccountConfig, BankTransactionStatus, BankWebhookResult } from "@/lib/payments/bank-provider";
import type { CreatePaymentInput, CreatePaymentResult, RefundResult } from "@/lib/payments/provider";

// Base URL placeholder — replace with real Axis API base URL after onboarding.
const AXIS_API_BASE = {
  test:       "https://api-uat.axisbank.com",      // TODO: verify with Axis docs
  production: "https://api.axisbank.com",           // TODO: verify with Axis docs
} as const;

export class AxisProvider extends BaseBankUpiProvider {
  readonly name     = "Axis Bank UPI";
  readonly bankCode = "axis";

  constructor(config: BankAccountConfig) {
    super(config);
  }

  private get baseUrl(): string {
    return AXIS_API_BASE[this.config.environment];
  }

  // TODO: Replace with Axis Bank's actual OAuth2 / API-key authentication scheme.
  private authHeaders(): Record<string, string> {
    return {
      "Content-Type":  "application/json",
      "client_id":     this.config.credentials.apiKey,
      "client_secret": this.config.credentials.apiSecret,
      // TODO: Axis may require OAuth2 bearer token obtained from a token endpoint.
      // If so, fetch and cache the token here before every call.
    };
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (!this.isConfigured()) throw new Error("Axis Bank UPI is not configured.");

    // Build the UPI payment URI and QR from server-trusted data.
    const upiUri = buildUpiPaymentUri({
      payeeVpa:    this.config.merchantVpa,
      payeeName:   this.config.merchantName,
      amountPaise: input.amountPaise,
      orderNumber: input.orderNumber,
    });
    const qrDataUrl = await generateUpiQrDataUrl(upiUri);

    // TODO: If Axis Bank's merchant API supports creating a dynamic payment
    // request server-side (recommended for auto-verification), replace the
    // manual UPI URI above with an Axis API call:
    //
    // const res = await fetch(`${this.baseUrl}/upi/merchant/payment/create`, {
    //   method: "POST",
    //   headers: this.authHeaders(),
    //   body: JSON.stringify({
    //     merchantId:       this.config.credentials.merchantId,
    //     merchantTxnId:    merchantReference,  // our unique reference
    //     amount:           (input.amountPaise / 100).toFixed(2),
    //     currency:         input.currency,
    //     payeeVpa:         this.config.merchantVpa,
    //     remarks:          `Order ${input.orderNumber}`,
    //     callbackUrl:      this.config.config?.callbackUrl,
    //   }),
    // });
    // const body = await res.json();
    // Use body.qrString or body.deepLink if Axis returns them.

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10-minute session

    return {
      providerOrderId: `AXIS-${input.orderNumber}-${Date.now()}`, // placeholder — use bank's ID
      clientConfig: {
        provider:    "axis",
        upiUri,
        qrDataUrl,
        upiId:       this.config.merchantVpa,
        accountName: this.config.merchantName,
      },
      expiresAt,
    };
  }

  async queryTransactionStatus(
    merchantReference: string,
    _providerOrderId?: string
  ): Promise<BankTransactionStatus> {
    if (!this.isConfigured()) return { found: false, status: "UNKNOWN" };

    // TODO: Replace with real Axis Bank transaction-status inquiry API call.
    // Typical endpoint pattern (verify with Axis docs):
    //
    // const res = await fetch(`${this.baseUrl}/upi/merchant/payment/status`, {
    //   method: "POST",
    //   headers: this.authHeaders(),
    //   body: JSON.stringify({
    //     merchantId:    this.config.credentials.merchantId,
    //     merchantTxnId: merchantReference,
    //   }),
    // });
    // const body = await res.json();
    // Map body.status to "SUCCESS" | "FAILURE" | "PENDING" etc.

    console.warn("[axis] queryTransactionStatus: API not yet configured. TODO: implement Axis status inquiry.");
    return {
      found:  false,
      status: "UNKNOWN",
      rawResponse: { message: "Axis Bank API integration pending. Contact Axis merchant services." },
    };
  }

  async verifyBankWebhook(
    rawBody: string,
    headers: Record<string, string>
  ): Promise<BankWebhookResult> {
    // TODO: Axis Bank webhook signature verification.
    // Check Axis merchant docs for the exact header name and HMAC scheme.
    // Common patterns:
    //   X-Axis-Signature: HMAC-SHA256(rawBody, webhookSecret) in hex or base64
    //   OR Axis may use a different verification method (OAuth, mutual TLS, etc.)
    //
    // Example (verify header name + encoding with Axis docs):
    // const signature = headers["x-axis-signature"] ?? "";
    // const valid = this.verifyHmacSha256(rawBody, this.config.credentials.webhookSecret, signature, "hex");
    // if (!valid) return { valid: false };
    // const payload = JSON.parse(rawBody);
    // ... parse Axis response fields

    console.warn("[axis] verifyBankWebhook: TODO — implement Axis webhook signature verification.");
    return {
      valid: false,
      rawPayload: { message: "Axis Bank webhook verification not yet implemented." },
    };
  }

  async refundPayment(
    providerPaymentId: string,
    amountPaise: number
  ): Promise<RefundResult> {
    // TODO: Implement Axis Bank refund API call.
    console.warn("[axis] refundPayment: TODO — implement Axis refund API.");
    return { ok: false, error: "Axis Bank refund API not yet implemented. Process manually." };
  }
}
