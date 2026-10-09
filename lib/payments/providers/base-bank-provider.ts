// Base class for all direct bank UPI providers.
// Implements the common validation logic; bank-specific API calls are abstract
// and must be implemented by each subclass (AxisProvider, IciciProvider, etc.).
import crypto from "crypto";
import type { BankUpiProvider, BankAccountConfig, BankTransactionStatus, BankWebhookResult } from "@/lib/payments/bank-provider";
import type {
  CreatePaymentInput, CreatePaymentResult,
  PaymentStatusResult, WebhookVerifyInput, WebhookVerifyResult, RefundResult,
} from "@/lib/payments/provider";

export abstract class BaseBankUpiProvider implements BankUpiProvider {
  abstract readonly name: string;
  abstract readonly bankCode: string;

  constructor(protected readonly config: BankAccountConfig) {}

  isConfigured(): boolean {
    const { apiKey, apiSecret, merchantId } = this.config.credentials;
    return Boolean(apiKey && apiSecret && merchantId && this.config.merchantVpa);
  }

  // ── Common validation — identical across all banks ───────────────────────

  validateTransaction(
    tx: BankTransactionStatus | BankWebhookResult,
    expectedAmountPaise: number,
    merchantReference: string
  ): { valid: boolean; reason?: string } {
    if (!tx) return { valid: false, reason: "No transaction data." };

    // 1. Status must be SUCCESS
    if (tx.status !== "SUCCESS") {
      return { valid: false, reason: `Transaction status is ${tx.status ?? "unknown"}, expected SUCCESS.` };
    }

    // 2. Amount must exactly match server-calculated order total
    if (typeof tx.amountPaise === "number" && tx.amountPaise !== expectedAmountPaise) {
      return {
        valid: false,
        reason: `Amount mismatch: bank reported ${tx.amountPaise} paise, expected ${expectedAmountPaise} paise.`,
      };
    }

    // 3. Currency must be INR
    if (tx.currency && tx.currency.toUpperCase() !== "INR") {
      return { valid: false, reason: `Currency mismatch: ${tx.currency}, expected INR.` };
    }

    // 4. Payee VPA must match our merchant VPA (when bank provides it)
    if (tx.payeeVpa && tx.payeeVpa.toLowerCase() !== this.config.merchantVpa.toLowerCase()) {
      return {
        valid: false,
        reason: `Payee VPA mismatch: ${tx.payeeVpa}, expected ${this.config.merchantVpa}.`,
      };
    }

    // 5. Merchant reference must match (when bank echoes it back)
    if ((tx as BankWebhookResult).merchantReference) {
      const ref = (tx as BankWebhookResult).merchantReference!;
      if (ref && ref !== merchantReference) {
        return {
          valid: false,
          reason: `Merchant reference mismatch: ${ref}, expected ${merchantReference}.`,
        };
      }
    }

    return { valid: true };
  }

  // ── Convenience: HMAC-SHA256 with constant-time comparison ───────────────
  // Banks that use this scheme (most do) can call it from their verifyBankWebhook.
  protected verifyHmacSha256(
    payload: string,
    secret: string,
    receivedSignature: string,
    encoding: "hex" | "base64" = "hex"
  ): boolean {
    try {
      const expected = crypto.createHmac("sha256", secret).update(payload).digest(encoding);
      if (expected.length !== receivedSignature.length) return false;
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(receivedSignature));
    } catch {
      return false;
    }
  }

  // ── Bridge: base PaymentProvider methods ─────────────────────────────────
  // These wrap the bank-UPI-specific methods to satisfy the base PaymentProvider
  // interface used by the existing payment-service.ts and checkout flow.

  async getPaymentStatus(providerPaymentId: string): Promise<PaymentStatusResult> {
    try {
      const result = await this.queryTransactionStatus(providerPaymentId);
      const statusMap: Record<string, PaymentStatusResult["status"]> = {
        SUCCESS: "paid", FAILURE: "failed", PENDING: "pending",
        INITIATED: "pending", UNKNOWN: "pending",
      };
      return {
        status: statusMap[result.status] ?? "pending",
        providerPaymentId: result.providerTransactionId,
        receivedAmountPaise: result.amountPaise,
        currency: result.currency ?? "INR",
        utr: result.utr ?? result.rrn,
        raw: result.rawResponse,
      };
    } catch (err) {
      console.error(`[${this.bankCode}] getPaymentStatus error:`, err);
      return { status: "pending" };
    }
  }

  async verifyWebhook(input: WebhookVerifyInput): Promise<WebhookVerifyResult> {
    const result = await this.verifyBankWebhook(input.rawBody, input.headers ?? {});
    return {
      valid: result.valid,
      eventId: result.eventId,
      eventType: result.eventType,
      providerPaymentId: result.providerTransactionId,
      status: result.status === "SUCCESS" ? "paid"
             : result.status === "FAILURE" ? "failed"
             : "pending",
      receivedAmountPaise: result.amountPaise,
      currency: result.currency,
      utr: result.utr ?? result.rrn,
      raw: result.rawPayload,
    };
  }

  // Abstract methods — each bank implements these with its own API calls
  abstract createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  abstract queryTransactionStatus(merchantReference: string, providerOrderId?: string): Promise<BankTransactionStatus>;
  abstract verifyBankWebhook(rawBody: string, headers: Record<string, string>): Promise<BankWebhookResult>;
  abstract refundPayment(providerPaymentId: string, amountPaise: number): Promise<RefundResult>;
}
