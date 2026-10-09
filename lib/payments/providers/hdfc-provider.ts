// HDFC Bank Direct UPI Merchant Provider
//
// INTEGRATION REQUIREMENTS:
// - HDFC Bank merchant account with SmartHub / UPI merchant services
// - Onboarding through HDFC Bank merchant portal or corporate banking RM
// - HDFC Bank Developer Portal access (developer.hdfcbank.com)
//
// CREDENTIALS NEEDED:
//   apiKey        → HDFC merchant key / API key
//   apiSecret     → HDFC API secret / access token
//   webhookSecret → Webhook callback secret
//   merchantId    → HDFC merchant ID
//
// TODO: Replace all placeholder API calls with real HDFC API calls after onboarding.

import { buildUpiPaymentUri, generateUpiQrDataUrl } from "@/lib/payments/upi-qr";
import { BaseBankUpiProvider } from "@/lib/payments/providers/base-bank-provider";
import type { BankAccountConfig, BankTransactionStatus, BankWebhookResult } from "@/lib/payments/bank-provider";
import type { CreatePaymentInput, CreatePaymentResult, RefundResult } from "@/lib/payments/provider";

const HDFC_API_BASE = {
  test:       "https://uat.hdfcbank.com/api",
  production: "https://api.hdfcbank.com",
} as const;

export class HdfcProvider extends BaseBankUpiProvider {
  readonly name     = "HDFC Bank UPI";
  readonly bankCode = "hdfc";

  constructor(config: BankAccountConfig) {
    super(config);
  }

  private get baseUrl(): string {
    return HDFC_API_BASE[this.config.environment];
  }

  private authHeaders(): Record<string, string> {
    return {
      "Content-Type":  "application/json",
      "merchant_key":  this.config.credentials.apiKey,
      // TODO: HDFC may use RSA-signed requests or mutual TLS — verify with HDFC docs.
    };
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (!this.isConfigured()) throw new Error("HDFC Bank UPI is not configured.");

    const upiUri = buildUpiPaymentUri({
      payeeVpa:    this.config.merchantVpa,
      payeeName:   this.config.merchantName,
      amountPaise: input.amountPaise,
      orderNumber: input.orderNumber,
    });
    const qrDataUrl = await generateUpiQrDataUrl(upiUri);

    // TODO: HDFC SmartHub / UPI merchant payment request API
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    return {
      providerOrderId: `HDFC-${input.orderNumber}-${Date.now()}`,
      clientConfig: { provider: "hdfc", upiUri, qrDataUrl, upiId: this.config.merchantVpa, accountName: this.config.merchantName },
      expiresAt,
    };
  }

  async queryTransactionStatus(merchantReference: string): Promise<BankTransactionStatus> {
    if (!this.isConfigured()) return { found: false, status: "UNKNOWN" };
    // TODO: HDFC transaction status inquiry API
    console.warn("[hdfc] queryTransactionStatus: TODO — implement HDFC status inquiry.");
    return { found: false, status: "UNKNOWN", rawResponse: { message: "HDFC Bank API integration pending." } };
  }

  async verifyBankWebhook(rawBody: string, headers: Record<string, string>): Promise<BankWebhookResult> {
    // TODO: HDFC webhook verification
    console.warn("[hdfc] verifyBankWebhook: TODO — implement HDFC webhook verification.");
    return { valid: false };
  }

  async refundPayment(providerPaymentId: string, amountPaise: number): Promise<RefundResult> {
    console.warn("[hdfc] refundPayment: TODO — implement HDFC refund API.");
    return { ok: false, error: "HDFC Bank refund API not yet implemented. Process manually." };
  }
}
