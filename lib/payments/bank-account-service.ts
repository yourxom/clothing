// CRUD service for BankPaymentAccount — admin-managed bank credentials.
// All secrets are encrypted at rest (AES-256-GCM). Never return decrypted
// credentials to any API response.
import { db } from "@/lib/db";
import { encryptSecret, decryptSecret, maskSecret } from "@/lib/payments/crypto";
import type { BankAccountConfig, BankCredentials } from "@/lib/payments/bank-provider";

// Use string instead of Prisma's enum so client components don't need to import from @prisma/client
export type BankProviderSlug = "AXIS" | "ICICI" | "HDFC" | "KOTAK" | "BOB";

export type BankAccountPublic = {
  id:           string;
  provider:     BankProviderSlug;
  displayName:  string;
  merchantVpa:  string;
  merchantName: string;
  currency:     string;
  environment:  "test" | "production";
  isActive:     boolean;
  isDefault:    boolean;
  status:       string;
  callbackUrl:  string | null;
  webhookUrl:   string | null;
  notes:        string | null;
  lastTestedAt: Date | null;
  lastTestResult: string | null;
  createdAt:    Date;
  updatedAt:    Date;
  // Masked credential status — never send real values
  hasApiKey:         boolean;
  hasApiSecret:      boolean;
  hasWebhookSecret:  boolean;
  hasMerchantId:     boolean;
  hasAdditional:     boolean;
  apiKeyMasked:      string;
  apiSecretMasked:   string;
  webhookSecretMasked: string;
  merchantIdMasked:  string;
};

export type CreateBankAccountInput = {
  provider:     BankProviderSlug;
  displayName:  string;
  merchantVpa:  string;
  merchantName: string;
  environment:  "test" | "production";
  isActive?:    boolean;
  isDefault?:   boolean;
  callbackUrl?: string;
  webhookUrl?:  string;
  notes?:       string;
  // Credentials (plain text in — encrypted before storage)
  apiKey?:         string;
  apiSecret?:      string;
  webhookSecret?:  string;
  merchantId?:     string;
  additionalCreds?: Record<string, string>;
};

export type UpdateBankAccountInput = Partial<CreateBankAccountInput> & { id: string };

function toPublic(row: {
  id: string; provider: string; displayName: string; merchantVpa: string;
  merchantName: string; currency: string; environment: string; isActive: boolean;
  isDefault: boolean; status: string; callbackUrl: string | null; webhookUrl: string | null;
  notes: string | null; lastTestedAt: Date | null; lastTestResult: string | null;
  createdAt: Date; updatedAt: Date;
  apiKeyEnc: string | null; apiSecretEnc: string | null; webhookSecretEnc: string | null;
  merchantIdEnc: string | null; additionalCredsEnc: string | null;
}): BankAccountPublic {
  const apiKey        = decryptSecret(row.apiKeyEnc);
  const apiSecret     = decryptSecret(row.apiSecretEnc);
  const webhookSecret = decryptSecret(row.webhookSecretEnc);
  const merchantId    = decryptSecret(row.merchantIdEnc);
  const additional    = decryptSecret(row.additionalCredsEnc);
  return {
    id: row.id, provider: row.provider as BankProviderSlug, displayName: row.displayName,
    merchantVpa: row.merchantVpa, merchantName: row.merchantName,
    currency: row.currency, environment: row.environment as "test" | "production",
    isActive: row.isActive, isDefault: row.isDefault, status: row.status,
    callbackUrl: row.callbackUrl, webhookUrl: row.webhookUrl, notes: row.notes,
    lastTestedAt: row.lastTestedAt, lastTestResult: row.lastTestResult,
    createdAt: row.createdAt, updatedAt: row.updatedAt,
    hasApiKey:        Boolean(apiKey),
    hasApiSecret:     Boolean(apiSecret),
    hasWebhookSecret: Boolean(webhookSecret),
    hasMerchantId:    Boolean(merchantId),
    hasAdditional:    Boolean(additional),
    apiKeyMasked:        maskSecret(apiKey),
    apiSecretMasked:     maskSecret(apiSecret),
    webhookSecretMasked: maskSecret(webhookSecret),
    merchantIdMasked:    maskSecret(merchantId),
  };
}

export async function listBankAccounts(): Promise<BankAccountPublic[]> {
  const rows = await db.bankPaymentAccount.findMany({ orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
  return rows.map(toPublic);
}

export async function getBankAccount(id: string): Promise<BankAccountPublic | null> {
  const row = await db.bankPaymentAccount.findUnique({ where: { id } });
  return row ? toPublic(row) : null;
}

/** Returns decrypted credentials — ONLY for server-side provider instantiation. Never expose. */
export async function getBankAccountCredentials(id: string): Promise<BankAccountConfig | null> {
  const row = await db.bankPaymentAccount.findUnique({ where: { id } });
  if (!row || !row.isActive) return null;

  const additionalRaw = decryptSecret(row.additionalCredsEnc);
  let additionalCreds: Record<string, string> = {};
  try { if (additionalRaw) additionalCreds = JSON.parse(additionalRaw); } catch { /* ignore */ }

  const credentials: BankCredentials = {
    apiKey:          decryptSecret(row.apiKeyEnc),
    apiSecret:       decryptSecret(row.apiSecretEnc),
    webhookSecret:   decryptSecret(row.webhookSecretEnc),
    merchantId:      decryptSecret(row.merchantIdEnc),
    additionalCreds,
  };
  return {
    id:           row.id,
    provider:     row.provider.toLowerCase() as BankAccountConfig["provider"],
    merchantVpa:  row.merchantVpa,
    merchantName: row.merchantName,
    environment:  row.environment === "production" ? "production" : "test",
    credentials,
  };
}

export async function createBankAccount(input: CreateBankAccountInput, adminId: string): Promise<BankAccountPublic> {
  // If this will be default, unset any existing default for the same provider.
  if (input.isDefault) {
    await db.bankPaymentAccount.updateMany({
      where: { provider: input.provider as never, isDefault: true },
      data:  { isDefault: false },
    });
  }

  const row = await db.bankPaymentAccount.create({
    data: {
      provider:      input.provider as never,
      displayName:   input.displayName.trim().slice(0, 120),
      merchantVpa:   input.merchantVpa.trim().slice(0, 100),
      merchantName:  input.merchantName.trim().slice(0, 100),
      environment:   input.environment === "production" ? "production" : "test",
      isActive:      input.isActive ?? false,
      isDefault:     input.isDefault ?? false,
      callbackUrl:   input.callbackUrl?.trim().slice(0, 500) ?? null,
      webhookUrl:    input.webhookUrl?.trim().slice(0, 500) ?? null,
      notes:         input.notes?.trim().slice(0, 1000) ?? null,
      createdBy:     adminId,
      updatedBy:     adminId,
      apiKeyEnc:          input.apiKey       ? encryptSecret(input.apiKey.trim())       : null,
      apiSecretEnc:       input.apiSecret    ? encryptSecret(input.apiSecret.trim())    : null,
      webhookSecretEnc:   input.webhookSecret ? encryptSecret(input.webhookSecret.trim()) : null,
      merchantIdEnc:      input.merchantId   ? encryptSecret(input.merchantId.trim())   : null,
      additionalCredsEnc: input.additionalCreds
        ? encryptSecret(JSON.stringify(input.additionalCreds))
        : null,
    },
  });
  return toPublic(row);
}

export async function updateBankAccount(input: UpdateBankAccountInput, adminId: string): Promise<BankAccountPublic> {
  const existing = await db.bankPaymentAccount.findUnique({ where: { id: input.id } });
  if (!existing) throw new Error("Bank account not found.");

  if (input.isDefault) {
    await db.bankPaymentAccount.updateMany({
      where: { provider: existing.provider as never, isDefault: true, id: { not: input.id } },
      data:  { isDefault: false },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = { updatedBy: adminId };
  if (input.displayName  !== undefined) data.displayName  = input.displayName.trim().slice(0, 120);
  if (input.merchantVpa  !== undefined) data.merchantVpa  = input.merchantVpa.trim().slice(0, 100);
  if (input.merchantName !== undefined) data.merchantName = input.merchantName.trim().slice(0, 100);
  if (input.environment  !== undefined) data.environment  = input.environment === "production" ? "production" : "test";
  if (input.isActive     !== undefined) data.isActive     = input.isActive;
  if (input.isDefault    !== undefined) data.isDefault    = input.isDefault;
  if (input.callbackUrl  !== undefined) data.callbackUrl  = input.callbackUrl?.trim().slice(0, 500) ?? null;
  if (input.webhookUrl   !== undefined) data.webhookUrl   = input.webhookUrl?.trim().slice(0, 500) ?? null;
  if (input.notes        !== undefined) data.notes        = input.notes?.trim().slice(0, 1000) ?? null;

  // Only re-encrypt when a real (non-masked) value is provided
  if (typeof input.apiKey === "string" && !input.apiKey.includes("••"))
    data.apiKeyEnc = input.apiKey ? encryptSecret(input.apiKey.trim()) : null;
  if (typeof input.apiSecret === "string" && !input.apiSecret.includes("••"))
    data.apiSecretEnc = input.apiSecret ? encryptSecret(input.apiSecret.trim()) : null;
  if (typeof input.webhookSecret === "string" && !input.webhookSecret.includes("••"))
    data.webhookSecretEnc = input.webhookSecret ? encryptSecret(input.webhookSecret.trim()) : null;
  if (typeof input.merchantId === "string" && !input.merchantId.includes("••"))
    data.merchantIdEnc = input.merchantId ? encryptSecret(input.merchantId.trim()) : null;
  if (input.additionalCreds !== undefined)
    data.additionalCredsEnc = Object.keys(input.additionalCreds || {}).length
      ? encryptSecret(JSON.stringify(input.additionalCreds))
      : null;

  const row = await db.bankPaymentAccount.update({ where: { id: input.id }, data });
  return toPublic(row);
}

export async function deleteBankAccount(id: string): Promise<void> {
  // Soft approach: deactivate rather than hard-delete so payment history is preserved.
  await db.bankPaymentAccount.update({ where: { id }, data: { isActive: false, isDefault: false } });
}

export async function setDefaultBankAccount(id: string, adminId: string): Promise<void> {
  const row = await db.bankPaymentAccount.findUnique({ where: { id }, select: { provider: true } });
  if (!row) throw new Error("Bank account not found.");
  await db.bankPaymentAccount.updateMany({
    where: { provider: row.provider as never, isDefault: true },
    data:  { isDefault: false },
  });
  await db.bankPaymentAccount.update({ where: { id }, data: { isDefault: true, updatedBy: adminId } });
}

export async function recordTestResult(id: string, ok: boolean, message: string): Promise<void> {
  await db.bankPaymentAccount.update({
    where: { id },
    data:  { lastTestedAt: new Date(), lastTestResult: ok ? "ok" : message.slice(0, 500) },
  });
}

/** Returns the active default account for the given provider (or any provider if none). */
export async function getDefaultBankAccount(provider?: string): Promise<BankAccountPublic | null> {
  const where = provider
    ? { provider: provider as never, isActive: true, isDefault: true }
    : { isActive: true, isDefault: true };
  const row = await db.bankPaymentAccount.findFirst({ where });
  if (row) return toPublic(row);
  const fallback = await db.bankPaymentAccount.findFirst({
    where: provider ? { provider: provider as never, isActive: true } : { isActive: true },
  });
  return fallback ? toPublic(fallback) : null;
}
