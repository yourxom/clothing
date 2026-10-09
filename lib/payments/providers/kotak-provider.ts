// Kotak Mahindra Bank Direct UPI Merchant Provider
//
// INTEGRATION REQUIREMENTS:
// - Kotak Mahindra Bank business account with Kotak API Banking / UPI merchant services
// - Onboarding via Kotak API Banking portal (apibanking.kotak.com) or corporate RM
//
// CREDENTIALS NEEDED:
//   apiKey        → Kotak consumer key / API key
//   apiSecret     → Kotak consumer secret / API secret
//   webhookSecret → Webhook HMAC signing secret
//   merchantId    → Kotak merchant code / virtual address
//
// TODO: Replace all placeholder API calls after onboarding.

import { buildUpiPaymentUri, generateUpiQrDataUrl } from "@/lib/payments/upi-qr";
import { BaseBankUpiProvider } from "@/lib/payments/providers/base-bank-provider";
import type { BankAccountConfig, BankTransactionStatus, BankWebhookResult } from "@/lib/payments/bank-provider";
import type { CreatePaymentInput, CreatePaymentResult, RefundResult } from "@/lib/payments/provider";

const KOTAK_API_BASE = {
  test:       "https://uat.apigee.kotak.com",
  production: "https://api.apigee.kotak.com",
} as const;

export class KotakProvider extends BaseBankUpiProvider {
  readonly name     = "Kotak Mahindra Bank UPI";
  readonly bankCode = "kotak";

  constructor(config: BankAccountConfig) { super(config); }

  private get baseUrl() { return KOTAK_API_BASE[this.config.environment]; }

  private authHeaders(): Record<string, string> {
    return {
      "Content-Type":    "application/json",
      "consumerKey":     this.config.credentials.apiKey,
      "consumerSecret":  this.config.credentials.apiSecret,
      // TODO: Kotak may require OAuth2 bearer token or HMAC request signing.
    };
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (!this.isConfigured()) throw new Error("Kotak Mahindra Bank UPI is not configured.");
    const upiUri = buildUpiPaymentUri({
      payeeVpa: this.config.merchantVpa, payeeName: this.config.merchantName,
      amountPaise: input.amountPaise, orderNumber: input.orderNumber,
    });
    const qrDataUrl = await generateUpiQrDataUrl(upiUri);
    // TODO: Kotak merchant UPI payment creation API
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    return {
      providerOrderId: `KOTAK-${input.orderNumber}-${Date.now()}`,
      clientConfig: { provider: "kotak", upiUri, qrDataUrl, upiId: this.config.merchantVpa, accountName: this.config.merchantName },
      expiresAt,
    };
  }

  async queryTransactionStatus(merchantReference: string): Promise<BankTransactionStatus> {
    if (!this.isConfigured()) return { found: false, status: "UNKNOWN" };
    // TODO: Kotak transaction status inquiry API
    console.warn("[kotak] queryTransactionStatus: TODO — implement Kotak status inquiry.");
    return { found: false, status: "UNKNOWN", rawResponse: { message: "Kotak Bank API integration pending." } };
  }

  async verifyBankWebhook(rawBody: string, headers: Record<string, string>): Promise<BankWebhookResult> {
    // TODO: Kotak webhook signature verification
    console.warn("[kotak] verifyBankWebhook: TODO — implement Kotak webhook verification.");
    return { valid: false };
  }

  async refundPayment(providerPaymentId: string, amountPaise: number): Promise<RefundResult> {
    console.warn("[kotak] refundPayment: TODO — implement Kotak refund API.");
    return { ok: false, error: "Kotak Bank refund API not yet implemented. Process manually." };
  }
}
