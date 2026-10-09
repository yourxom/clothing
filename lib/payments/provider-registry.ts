// Resolves the currently-configured Merchant UPI provider instance.
// Adding a new provider later = write a new providers/<x>-provider.ts
// implementing PaymentProvider, then add one case below. Checkout/webhook
// code never needs to change.
import type { PaymentProvider } from "@/lib/payments/provider";
import type { BankUpiProvider, BankAccountConfig } from "@/lib/payments/bank-provider";
import { RazorpayProvider } from "@/lib/payments/providers/razorpay-provider";
import { AxisProvider }     from "@/lib/payments/providers/axis-provider";
import { IciciProvider }    from "@/lib/payments/providers/icici-provider";
import { HdfcProvider }     from "@/lib/payments/providers/hdfc-provider";
import { KotakProvider }    from "@/lib/payments/providers/kotak-provider";
import { BobProvider }      from "@/lib/payments/providers/bob-provider";
import { getPaymentSettingsInternal } from "@/lib/payments/settings";
import { getBankAccountCredentials, getDefaultBankAccount } from "@/lib/payments/bank-account-service";

/**
 * Returns the active merchant provider instance, or null if none is
 * configured/selected.
 *
 * Resolution order:
 *  1. If a BankPaymentAccount ID is provided — use that specific account.
 *  2. If a bankProvider string is provided — use the default active account for that bank.
 *  3. Fallback: check PaymentSettings.merchantProvider for legacy Razorpay config.
 */
export async function getMerchantProvider(
  bankAccountId?: string | null,
  bankProviderOverride?: string | null
): Promise<PaymentProvider | null> {
  // Path 1: Specific bank account ID supplied (from a Payment row's bankAccountId)
  if (bankAccountId) {
    const config = await getBankAccountCredentials(bankAccountId);
    if (!config) return null;
    return instantiateProvider(config.provider, config);
  }

  // Path 2: Provider name supplied — find the default active account for that bank
  if (bankProviderOverride) {
    const providerName = bankProviderOverride.toLowerCase();
    if (["axis","icici","hdfc","kotak","bob"].includes(providerName)) {
      const account = await getDefaultBankAccount(providerName.toUpperCase());
      if (!account) return null;
      const config = await getBankAccountCredentials(account.id);
      if (!config) return null;
      return instantiateProvider(providerName, config);
    }
  }

  // Path 3: Legacy — read from PaymentSettings (Razorpay / any provider stored there)
  const settings = await getPaymentSettingsInternal();
  const providerName = (settings.merchant.provider || "razorpay").toLowerCase();

  // If it's a bank slug, look up default account
  if (["axis","icici","hdfc","kotak","bob"].includes(providerName)) {
    const account = await getDefaultBankAccount(providerName.toUpperCase());
    if (!account) return null;
    const config = await getBankAccountCredentials(account.id);
    if (!config) return null;
    return instantiateProvider(providerName, config);
  }

  // Razorpay legacy path — credentials from env or PaymentSettings
  const apiKey       = settings.merchantApiKey       || process.env.RAZORPAY_KEY_ID     || "";
  const apiSecret    = settings.merchantApiSecret    || process.env.RAZORPAY_KEY_SECRET  || "";
  const webhookSec   = settings.merchantWebhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || "";
  if (!apiKey || !apiSecret) return null;
  const provider = new RazorpayProvider(apiKey, apiSecret, webhookSec);
  return provider.isConfigured() ? provider : null;
}

function instantiateProvider(name: string, config: BankAccountConfig): BankUpiProvider | null {
  switch (name) {
    case "axis":  return new AxisProvider(config);
    case "icici": return new IciciProvider(config);
    case "hdfc":  return new HdfcProvider(config);
    case "kotak": return new KotakProvider(config);
    case "bob":   return new BobProvider(config);
    default: return null;
  }
}

/** True only when Merchant UPI is admin-enabled AND a provider is genuinely configured. */
export async function isMerchantUpiReady(): Promise<boolean> {
  const settings = await getPaymentSettingsInternal();
  if (!settings.merchantUpiEnabled) return false;
  const provider = await getMerchantProvider();
  return Boolean(provider);
}

