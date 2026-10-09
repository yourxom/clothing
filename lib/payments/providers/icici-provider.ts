// ICICI Bank Direct UPI Merchant Provider
//
// INTEGRATION REQUIREMENTS:
// - ICICI Bank merchant/corporate account with UPI merchant services enabled
// - Approved through ICICI Bank's merchant onboarding (Instapay / iMobile Pay business)
// - Digital onboarding via ICICI API Banking portal (apibanking.icicibank.com)
//
// CREDENTIALS NEEDED:
//   apiKey        → ICICI API key (from ICICI API banking portal)
//   apiSecret     → ICICI API secret
//   webhookSecret → Webhook validation key
//   merchantId    → ICICI merchant ID / MID
//
// TODO: Replace all placeholder API calls with real ICICI API calls after onboarding.

import { buildUpiPaymentUri, generateUpiQrDataUrl } from "@/lib/payments/upi-qr";
import { BaseBankUpiProvider } from "@/lib/payments/providers/base-bank-provider";
import type { BankAccountConfig, BankTransactionStatus, BankWebhookResult } from "@/lib/payments/bank-provider";
import type { CreatePaymentInput, CreatePaymentResult, RefundResult } from "@/lib/payments/provider";

const ICICI_API_BASE = {
  test:       "https://apitest.icicibank.com",
  production: "https://api.icicibank.com",
} as const;

export class IciciProvider extends BaseBankUpiProvider {
  readonly name     = "ICICI Bank UPI";
  readonly bankCode = "icici";

  constructor(config: BankAccountConfig) {
    super(config);
  }

  private get baseUrl(): string {
    return ICICI_API_BASE[this.config.environment];
  }

  private authHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "apikey":        this.config.credentials.apiKey,
      // TODO: ICICI may use HMAC request signing or OAuth2. Verify with API docs.
    };
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (!this.isConfigured()) throw new Error("ICICI Bank UPI is not configured.");

    const upiUri = buildUpiPaymentUri({
      payeeVpa:    this.config.merchantVpa,
      payeeName:   this.config.merchantName,
      amountPaise: input.amountPaise,
      orderNumber: input.orderNumber,
    });
    const qrDataUrl = await generateUpiQrDataUrl(upiUri);

    // TODO: ICICI merchant UPI payment request API
    // const res = await fetch(`${this.baseUrl}/upi/payments`, {
    //   method: "POST",
    //   headers: this.authHeaders(),
    //   body: JSON.stringify({ ... }),
    // });

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    return {
      providerOrderId: `ICICI-${input.orderNumber}-${Date.now()}`,
      clientConfig: { provider: "icici", upiUri, qrDataUrl, upiId: this.config.merchantVpa, accountName: this.config.merchantName },
      expiresAt,
    };
  }

  async queryTransactionStatus(merchantReference: string): Promise<BankTransactionStatus> {
    if (!this.isConfigured()) return { found: false, status: "UNKNOWN" };
    // TODO: ICICI transaction status API
    // const res = await fetch(`${this.baseUrl}/upi/payments/status`, { ... });
    console.warn("[icici] queryTransactionStatus: TODO — implement ICICI status inquiry.");
    return { found: false, status: "UNKNOWN", rawResponse: { message: "ICICI Bank API integration pending." } };
  }

  async verifyBankWebhook(rawBody: string, headers: Record<string, string>): Promise<BankWebhookResult> {
    // TODO: ICICI webhook verification (signature header + scheme from ICICI docs)
    console.warn("[icici] verifyBankWebhook: TODO — implement ICICI webhook verification.");
    return { valid: false };
  }

  async refundPayment(providerPaymentId: string, amountPaise: number): Promise<RefundResult> {
    // TODO: ICICI refund API
    console.warn("[icici] refundPayment: TODO — implement ICICI refund API.");
    return { ok: false, error: "ICICI Bank refund API not yet implemented. Process manually." };
  }
}
