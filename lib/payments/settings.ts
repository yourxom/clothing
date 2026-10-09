// Admin-configured payment settings — singleton row in PaymentSettings.
// Sensitive fields (API key/secret, webhook secret) are encrypted at rest and
// are NEVER returned to the frontend in decrypted form.
import { db } from "@/lib/db";
import type { PaymentMethod } from "@prisma/client";
import { encryptSecret, decryptSecret, maskSecret } from "@/lib/payments/crypto";

export type MerchantUpiSettings = {
  provider:        string;  // "razorpay" | "cashfree" | "bank_upi" | ...
  name:            string;  // display name
  merchantId:      string;
  vpa:             string;
  environment:     "test" | "production";
  autoVerify:       boolean;
  hasApiKey:        boolean;
  hasApiSecret:     boolean;
  hasWebhookSecret: boolean;
  apiKeyMasked:        string;
  apiSecretMasked:     string;
  webhookSecretMasked: string;
};

export type PersonalUpiSettings = {
  accountName:   string;
  upiId:         string;
  qrImageUrl:    string;
  bankName:      string;
  instructions:  string;
  useDynamicQr:  boolean;
};

export type PaymentSettingsPublic = {
  merchantUpiEnabled: boolean;
  personalUpiEnabled: boolean;
  defaultMethod:      PaymentMethod;
  merchant: MerchantUpiSettings;
  personal: PersonalUpiSettings;
};

export type PaymentSettingsInternal = PaymentSettingsPublic & {
  merchantApiKey:        string;
  merchantApiSecret:     string;
  merchantWebhookSecret: string;
};

const EMPTY_MERCHANT: MerchantUpiSettings = {
  provider: "", name: "", merchantId: "", vpa: "", environment: "test",
  autoVerify: true, hasApiKey: false, hasApiSecret: false, hasWebhookSecret: false,
  apiKeyMasked: "", apiSecretMasked: "", webhookSecretMasked: "",
};
const EMPTY_PERSONAL: PersonalUpiSettings = {
  accountName: "", upiId: "", qrImageUrl: "", bankName: "", instructions: "", useDynamicQr: true,
};

/** Returns the singleton settings row, creating a default one if none exists. */
async function getOrCreateRow() {
  const existing = await db.paymentSettings.findFirst();
  if (existing) return existing;
  return db.paymentSettings.create({ data: {} });
}

/** Public config — safe to return to the admin UI and to checkout. No secrets. */
export async function getPaymentSettings(): Promise<PaymentSettingsPublic> {
  const row = await getOrCreateRow();
  const apiKey        = decryptSecret(row.merchantApiKeyEnc);
  const apiSecret      = decryptSecret(row.merchantApiSecretEnc);
  const webhookSecret  = decryptSecret(row.merchantWebhookSecretEnc);
  return {
    merchantUpiEnabled: row.merchantUpiEnabled,
    personalUpiEnabled: row.personalUpiEnabled,
    defaultMethod:      row.defaultMethod,
    merchant: {
      provider:    row.merchantProvider ?? "",
      name:        row.merchantName ?? "",
      merchantId:  row.merchantMerchantId ?? "",
      vpa:         row.merchantVpa ?? "",
      environment: (row.merchantEnvironment === "production" ? "production" : "test"),
      autoVerify:  row.merchantAutoVerify,
      hasApiKey:        Boolean(apiKey),
      hasApiSecret:     Boolean(apiSecret),
      hasWebhookSecret: Boolean(webhookSecret),
      apiKeyMasked:        maskSecret(apiKey),
      apiSecretMasked:     maskSecret(apiSecret),
      webhookSecretMasked: maskSecret(webhookSecret),
    },
    personal: {
      accountName:  row.personalAccountName ?? "",
      upiId:        row.personalUpiId ?? "",
      qrImageUrl:   row.personalQrImageUrl ?? "",
      bankName:     row.personalBankName ?? "",
      instructions: row.personalInstructions ?? "",
      useDynamicQr: row.personalUseDynamicQr,
    },
  };
}

/**
 * Internal config WITH decrypted secrets. Only call this from server-side
 * provider code (lib/payments/providers/*) — never expose the result to any
 * API response.
 */
export async function getPaymentSettingsInternal(): Promise<PaymentSettingsInternal> {
  const row = await getOrCreateRow();
  const pub = await getPaymentSettings();
  return {
    ...pub,
    merchantApiKey:        decryptSecret(row.merchantApiKeyEnc),
    merchantApiSecret:     decryptSecret(row.merchantApiSecretEnc),
    merchantWebhookSecret: decryptSecret(row.merchantWebhookSecretEnc),
  };
}

export type PaymentSettingsUpdateInput = Partial<{
  merchantUpiEnabled: boolean;
  personalUpiEnabled: boolean;
  defaultMethod:      PaymentMethod;

  merchantProvider:   string;
  merchantName:       string;
  merchantMerchantId: string;
  merchantVpa:        string;
  merchantEnvironment: "test" | "production";
  merchantAutoVerify:  boolean;
  // Only provided when the admin is setting/replacing a secret. Omitted (not
  // present on the object) means "leave unchanged". Empty string clears it.
  merchantApiKey:        string;
  merchantApiSecret:     string;
  merchantWebhookSecret: string;

  personalAccountName:  string;
  personalUpiId:        string;
  personalQrImageUrl:   string;
  personalBankName:     string;
  personalInstructions: string;
  personalUseDynamicQr: boolean;
}>;

/** Applies a partial update to the singleton settings row. Admin-only — caller must enforce auth. */
export async function updatePaymentSettings(input: PaymentSettingsUpdateInput) {
  const row = await getOrCreateRow();

  const data: Record<string, unknown> = {};
  if (input.merchantUpiEnabled !== undefined) data.merchantUpiEnabled = input.merchantUpiEnabled;
  if (input.personalUpiEnabled !== undefined) data.personalUpiEnabled = input.personalUpiEnabled;
  if (input.defaultMethod !== undefined) data.defaultMethod = input.defaultMethod;

  if (input.merchantProvider !== undefined) data.merchantProvider = input.merchantProvider.trim().slice(0, 60) || null;
  if (input.merchantName !== undefined) data.merchantName = input.merchantName.trim().slice(0, 100) || null;
  if (input.merchantMerchantId !== undefined) data.merchantMerchantId = input.merchantMerchantId.trim().slice(0, 100) || null;
  if (input.merchantVpa !== undefined) data.merchantVpa = input.merchantVpa.trim().slice(0, 100) || null;
  if (input.merchantEnvironment !== undefined) data.merchantEnvironment = input.merchantEnvironment === "production" ? "production" : "test";
  if (input.merchantAutoVerify !== undefined) data.merchantAutoVerify = input.merchantAutoVerify;

  // Secrets: only re-encrypt when a real (non-empty, non-masked) value is sent.
  if (typeof input.merchantApiKey === "string" && !input.merchantApiKey.includes("••")) {
    data.merchantApiKeyEnc = input.merchantApiKey ? encryptSecret(input.merchantApiKey.trim()) : null;
  }
  if (typeof input.merchantApiSecret === "string" && !input.merchantApiSecret.includes("••")) {
    data.merchantApiSecretEnc = input.merchantApiSecret ? encryptSecret(input.merchantApiSecret.trim()) : null;
  }
  if (typeof input.merchantWebhookSecret === "string" && !input.merchantWebhookSecret.includes("••")) {
    data.merchantWebhookSecretEnc = input.merchantWebhookSecret ? encryptSecret(input.merchantWebhookSecret.trim()) : null;
  }

  if (input.personalAccountName !== undefined) data.personalAccountName = input.personalAccountName.trim().slice(0, 100) || null;
  if (input.personalUpiId !== undefined) data.personalUpiId = input.personalUpiId.trim().slice(0, 100) || null;
  if (input.personalQrImageUrl !== undefined) data.personalQrImageUrl = input.personalQrImageUrl.trim().slice(0, 500) || null;
  if (input.personalBankName !== undefined) data.personalBankName = input.personalBankName.trim().slice(0, 100) || null;
  if (input.personalInstructions !== undefined) data.personalInstructions = input.personalInstructions.trim().slice(0, 1000) || null;
  if (input.personalUseDynamicQr !== undefined) data.personalUseDynamicQr = input.personalUseDynamicQr;

  await db.paymentSettings.update({ where: { id: row.id }, data });
  return getPaymentSettings();
}

/** Methods enabled for checkout, in the exact shape the frontend contract expects (no secrets). */
export async function getEnabledPaymentMethods() {
  const settings = await getPaymentSettings();
  // Merchant UPI is only genuinely "enabled" when both the admin toggle AND
  // real credentials exist — otherwise automatic payments can't actually work.
  const merchantReady = settings.merchantUpiEnabled && settings.merchant.hasApiKey && settings.merchant.hasApiSecret;
  const personalReady = settings.personalUpiEnabled && Boolean(settings.personal.upiId);

  return {
    merchant_upi: {
      enabled: merchantReady,
      name:    settings.merchant.name || "UPI — Instant Confirmation",
    },
    personal_upi: {
      enabled: personalReady,
      name:    "Direct UPI",
    },
    defaultMethod: settings.defaultMethod,
  };
}
