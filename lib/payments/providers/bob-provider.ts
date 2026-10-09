// Bank of Baroda Direct UPI Merchant Provider
//
// INTEGRATION REQUIREMENTS:
// - Bank of Baroda business/current account with BoB Merchant UPI services
// - Onboarding via Bank of Baroda merchant portal or API banking team
// - BoB API Banking access (developer.bankofbaroda.in)
//
// CREDENTIALS NEEDED:
//   apiKey        → BoB API key / client ID
//   apiSecret     → BoB API secret / client secret
//   webhookSecret → Webhook signing secret
//   merchantId    → BoB merchant ID / MID
//
// TODO: Replace all placeholder API calls after onboarding.

import { buildUpiPaymentUri, generateUpiQrDataUrl } from "@/lib/payments/upi-qr";
import { BaseBankUpiProvider } from "@/lib/payments/providers/base-bank-provider";
import type { BankAccountConfig, BankTransactionStatus, BankWebhookResult } from "@/lib/payments/bank-provider";
import type { CreatePaymentInput, CreatePaymentResult, RefundResult } from "@/lib/payments/provider";

const BOB_API_BASE = {
  test:       "https://apiuat.bankofbaroda.in",
  production: "https://api.bankofbaroda.in",
} as const;

export class BobProvider extends BaseBankUpiProvider {
  readonly name     = "Bank of Baroda UPI";
  readonly bankCode = "bob";

  constructor(config: BankAccountConfig) { super(config); }

  private get baseUrl() { return BOB_API_BASE[this.config.environment]; }

  private authHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "client_id":    this.config.credentials.apiKey,
      "client_secret": this.config.credentials.apiSecret,
      // TODO: BoB may require OAuth2 or HMAC request signing — verify with BoB docs.
    };
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (!this.isConfigured()) throw new Error("Bank of Baroda UPI is not configured.");
    const upiUri = buildUpiPaymentUri({
      payeeVpa: this.config.merchantVpa, payeeName: this.config.merchantName,
      amountPaise: input.amountPaise, orderNumber: input.orderNumber,
    });
    const qrDataUrl = await generateUpiQrDataUrl(upiUri);
    // TODO: BoB merchant UPI payment creation API
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    return {
      providerOrderId: `BOB-${input.orderNumber}-${Date.now()}`,
      clientConfig: { provider: "bob", upiUri, qrDataUrl, upiId: this.config.merchantVpa, accountName: this.config.merchantName },
      expiresAt,
    };
  }

  async queryTransactionStatus(merchantReference: string): Promise<BankTransactionStatus> {
    if (!this.isConfigured()) return { found: false, status: "UNKNOWN" };
    // TODO: BoB transaction status inquiry API
    console.warn("[bob] queryTransactionStatus: TODO — implement BoB status inquiry.");
    return { found: false, status: "UNKNOWN", rawResponse: { message: "Bank of Baroda API integration pending." } };
  }

  async verifyBankWebhook(rawBody: string, headers: Record<string, string>): Promise<BankWebhookResult> {
    // TODO: BoB webhook signature verification
    console.warn("[bob] verifyBankWebhook: TODO — implement BoB webhook verification.");
    return { valid: false };
  }

  async refundPayment(providerPaymentId: string, amountPaise: number): Promise<RefundResult> {
    console.warn("[bob] refundPayment: TODO — implement BoB refund API.");
    return { ok: false, error: "Bank of Baroda refund API not yet implemented. Process manually." };
  }
}
