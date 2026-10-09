// Extended PaymentProvider interface for direct bank UPI integrations.
// Extends the base PaymentProvider with bank-UPI-specific operations.
// Each bank's implementation lives in providers/<bank>-provider.ts.
//
// IMPORTANT: Bank APIs are not public. Every bank (Axis, ICICI, HDFC, Kotak,
// Bank of Baroda) requires a signed merchant agreement and separate onboarding
// before granting API access. The actual endpoint URLs, authentication schemes,
// request/response shapes, and webhook signature methods differ per bank and
// are shared under NDA post-onboarding. The method bodies below are correctly
// architected stubs — fill in the bank-specific calls once you receive official
// API documentation from each bank.
import type { PaymentProvider } from "@/lib/payments/provider";

// Credentials resolved from a BankPaymentAccount row (decrypted server-side).
// Field names are generic so the interface works across all banks; each
// provider implementation maps these to its bank's own terminology.
export type BankCredentials = {
  apiKey:          string;   // Axis: client_id | ICICI: api_key | HDFC: merchant_key | etc.
  apiSecret:       string;   // Axis: client_secret | ICICI: api_secret | HDFC: secret_key | etc.
  webhookSecret:   string;   // HMAC/signing secret for webhook verification
  merchantId:      string;   // MID / merchant code required by the bank
  additionalCreds: Record<string, string>; // bank-specific extras (parsed from additionalCredsEnc)
};

export type BankAccountConfig = {
  id:           string;   // BankPaymentAccount.id
  provider:     string;   // "axis" | "icici" | "hdfc" | "kotak" | "bob"
  merchantVpa:  string;   // our UPI ID registered with this bank, e.g. aurelia@axis
  merchantName: string;   // payee name shown in UPI app
  environment:  "test" | "production";
  credentials:  BankCredentials;
};

// Status returned by the bank's transaction-status inquiry API.
export type BankTransactionStatus = {
  found:               boolean;
  status:              "SUCCESS" | "FAILURE" | "PENDING" | "INITIATED" | "UNKNOWN";
  providerTransactionId?: string;  // bank's own txn ID
  rrn?:                string;     // Retrieval Reference Number
  utr?:                string;     // UPI Transaction Reference
  payerVpa?:           string;     // customer's UPI ID
  payeeVpa?:           string;     // our merchant VPA
  amountPaise?:        number;
  currency?:           string;
  timestamp?:          Date;
  rawResponse?:        unknown;    // bank's full response (for audit log only)
};

// What a bank webhook payload resolves to after verification + parsing.
export type BankWebhookResult = {
  valid:               boolean;
  eventId?:            string;     // bank's unique event ID for idempotency
  eventType?:          string;
  status?:             "SUCCESS" | "FAILURE" | "PENDING";
  providerTransactionId?: string;
  rrn?:                string;
  utr?:                string;
  payerVpa?:           string;
  payeeVpa?:           string;
  amountPaise?:        number;
  currency?:           string;
  merchantReference?:  string;     // our reference we sent to the bank
  timestamp?:          Date;
  rawPayload?:         unknown;
};

// Every bank UPI provider must implement this interface.
// It extends the base PaymentProvider and adds direct-bank-specific methods.
export interface BankUpiProvider extends PaymentProvider {
  readonly bankCode: string; // "axis" | "icici" | "hdfc" | "kotak" | "bob"

  /** True only when valid credentials are configured for this account. */
  isConfigured(): boolean;

  /**
   * Queries the bank's transaction-status API for a given payment session.
   * Called by the backend when a webhook hasn't arrived yet (polling fallback).
   * NEVER called from the frontend.
   *
   * @param merchantReference  Our own reference we sent to the bank (PAY-ORD...)
   * @param providerOrderId    The bank's own order ID if one was created
   */
  queryTransactionStatus(
    merchantReference: string,
    providerOrderId?: string
  ): Promise<BankTransactionStatus>;

  /**
   * Verifies a webhook/callback from this bank.
   * Each bank uses a different signature scheme — the implementation handles
   * the bank's specific authentication method.
   */
  verifyBankWebhook(
    rawBody: string,
    headers: Record<string, string>
  ): Promise<BankWebhookResult>;

  /**
   * Validates ALL required fields of a bank transaction before marking PAID:
   * - status == SUCCESS
   * - amount exactly equals expected
   * - currency == INR
   * - payee VPA matches our merchant VPA
   * - merchant reference matches our record
   * - transaction not already processed
   */
  validateTransaction(
    transaction: BankTransactionStatus | BankWebhookResult,
    expectedAmountPaise: number,
    merchantReference: string
  ): { valid: boolean; reason?: string };
}
