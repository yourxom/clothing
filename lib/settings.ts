import { db } from "@/lib/db";

// Central key-value settings store, admin-editable via /admin/settings.

export const SETTING_KEYS = {
  // Brand & domain — set once the real domain is purchased.
  siteUrl:         "site_url",          // canonical site origin, e.g. https://aurelia.in
  contactEmail:    "contact_email",     // primary contact address, e.g. hello@aurelia.in

  whatsappNumber:  "whatsapp_number",   // digits only, incl. country code e.g. 919812345678
  whatsappMessage: "whatsapp_message",  // default prefilled message
  whatsappEnabled: "whatsapp_enabled",  // "true" | "false"
  deliveryMinDays: "delivery_min_days", // earliest expected delivery (business days)
  deliveryMaxDays: "delivery_max_days", // latest expected delivery (business days)

  // Email provider (Resend). DB values override .env when present.
  emailEnabled:    "email_enabled",     // "true" | "false" — master switch
  emailApiKey:     "email_api_key",     // Resend API key
  emailFrom:       "email_from",        // e.g. "AURELIA <hello@aurelia.in>"

  // SMS provider (MSG91 / Twilio / SMS Horizon). DB values override .env when present.
  smsEnabled:      "sms_enabled",          // "true" | "false"
  smsProvider:     "sms_provider",         // "smshorizon" | "msg91" | "twilio"
  smsUser:         "sms_user",             // SMS Horizon account username (e.g. aureliain)
  smsApiKey:       "sms_api_key",          // provider auth key / token
  smsSenderId:     "sms_sender_id",        // 6-char DLT sender header, e.g. HORIZN
  smsDltTemplateId:"sms_dlt_template_id",  // DLT template ID (required in India since Oct 2020)
  smsAuthTemplate: "sms_auth_template",    // OTP template text; {code} is replaced

  // Referral & points program
  referralEnabled:     "referral_enabled",      // "true" | "false"
  referralFixedRupees: "referral_fixed_rupees", // flat points (in ₹) awarded to referrer
  referralPercentRate: "referral_percent_rate", // % of referred order awarded as points
} as const;

export type WhatsappConfig = {
  number: string;
  message: string;
  enabled: boolean;
};

export type DeliveryConfig = {
  minDays: number;
  maxDays: number;
};

const DEFAULTS: WhatsappConfig = {
  number: "",
  message: "Hi AURELIA, I have a question about my order/products.",
  enabled: false,
};

const DELIVERY_DEFAULTS: DeliveryConfig = { minDays: 4, maxDays: 7 };

/** Reads all settings as a map. Safe if the table is empty. */
async function getSettingsMap(): Promise<Record<string, string>> {
  try {
    const rows = await db.siteSetting.findMany();
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  } catch {
    return {};
  }
}

/** Returns the WhatsApp config for the storefront floating button. */
export async function getWhatsappConfig(): Promise<WhatsappConfig> {
  const map = await getSettingsMap();
  const number  = (map[SETTING_KEYS.whatsappNumber] ?? DEFAULTS.number).replace(/\D/g, "");
  const message = map[SETTING_KEYS.whatsappMessage] ?? DEFAULTS.message;
  const enabled = (map[SETTING_KEYS.whatsappEnabled] ?? "false") === "true" && number.length >= 10;
  return { number, message, enabled };
}

/** Returns the delivery-estimate window (business days). */
export async function getDeliveryConfig(): Promise<DeliveryConfig> {
  const map = await getSettingsMap();
  const min = parseInt(map[SETTING_KEYS.deliveryMinDays] ?? "") || DELIVERY_DEFAULTS.minDays;
  const max = parseInt(map[SETTING_KEYS.deliveryMaxDays] ?? "") || DELIVERY_DEFAULTS.maxDays;
  return {
    minDays: Math.max(1, min),
    maxDays: Math.max(min, max),
  };
}

/**
 * Advances `date` forward by `businessDays`, skipping Sundays (day 0).
 * Couriers don't deliver on Sundays, so we don't count them toward the estimate.
 */
function addBusinessDays(date: Date, businessDays: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < businessDays) {
    result.setDate(result.getDate() + 1);
    if (result.getDay() !== 0) added++; // skip Sunday
  }
  return result;
}

/**
 * Given a delivery window (in business days), returns a human-readable expected
 * date range starting from today, skipping Sundays.
 */
export function estimateDeliveryRange(min: number, max: number): { from: string; to: string } {
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const today = new Date();
  const from = addBusinessDays(today, min);
  const to   = addBusinessDays(today, max);
  return { from: fmt(from), to: fmt(to) };
}

export type SiteConfig = {
  siteUrl: string;       // canonical origin, no trailing slash, e.g. https://aurelia.in
  contactEmail: string;  // e.g. hello@aurelia.in
  domain: string;        // host only, e.g. aurelia.in (derived from siteUrl)
};

// Placeholder values used until a real domain is purchased and set in admin.
// Kept obviously-fake so they're easy to spot before launch.
const SITE_DEFAULTS = {
  siteUrl: "https://your-domain.example",
  contactEmail: "hello@your-domain.example",
};

/** Strip a trailing slash and any accidental whitespace from a URL. */
function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/** Derive the bare host (e.g. "aurelia.in") from a site URL, for display. */
function hostFromUrl(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  }
}

/**
 * Brand/domain config, admin-editable. Resolution order:
 *   1. DB setting (admin panel)
 *   2. environment variable (NEXT_PUBLIC_SITE_URL / CONTACT_EMAIL)
 *   3. obvious placeholder (pre-launch)
 * Safe to call from any server component / route.
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  const map = await getSettingsMap();
  const siteUrl = normalizeUrl(
    map[SETTING_KEYS.siteUrl] || process.env.NEXT_PUBLIC_SITE_URL || SITE_DEFAULTS.siteUrl
  );
  const contactEmail = (
    map[SETTING_KEYS.contactEmail] || process.env.CONTACT_EMAIL || SITE_DEFAULTS.contactEmail
  ).trim();
  return { siteUrl, contactEmail, domain: hostFromUrl(siteUrl) };
}

export type EmailConfig = {
  enabled: boolean;
  apiKey: string;   // resolved: DB value or env fallback
  from: string;
};

export type SmsConfig = {
  enabled: boolean;
  provider: string; // "smshorizon" | "msg91" | "twilio"
  user: string;     // SMS Horizon account username (e.g. "aureliain")
  apiKey: string;
  senderId: string;
  dltTemplateId: string; // DLT template ID — required by TRAI for all Indian SMS since Oct 2020
  authTemplate: string;
};

// Registered TRAI DLT template text for SMS Horizon tid 1607100000000323238
const SMS_TEMPLATE_DEFAULT = "OTP for your new user account registration is: {code}\n\n-Aurelia";

/**
 * Email config: DB settings take precedence, falling back to .env.
 * `enabled` is true only when a switch is on AND an API key exists.
 */
export async function getEmailConfig(): Promise<EmailConfig> {
  const map = await getSettingsMap();
  const apiKey = (
    map[SETTING_KEYS.emailApiKey] ||
    process.env.BREVO_API_KEY ||
    process.env.RESEND_API_KEY ||
    ""
  ).trim();
  const from = (
    map[SETTING_KEYS.emailFrom] ||
    process.env.EMAIL_FROM ||
    "AURELIA <inaureliaa@gmail.com>"
  ).trim();
  const hasProvider = Boolean(apiKey) || Boolean(process.env.EMAIL_GMAIL_USER);
  const rawEnabled = map[SETTING_KEYS.emailEnabled];
  const enabled = (rawEnabled === undefined ? true : rawEnabled === "true") && hasProvider;
  return { enabled, apiKey, from };
}

/**
 * SMS config: DB settings take precedence, falling back to .env.
 * Automatically enabled when an API key is provided and not explicitly turned off in DB.
 */
export async function getSmsConfig(): Promise<SmsConfig> {
  const map = await getSettingsMap();
  const apiKey       = (map[SETTING_KEYS.smsApiKey]        || process.env.SMS_API_KEY           || process.env.SMS_HORIZON_API_KEY || "").trim();
  const user         = (map[SETTING_KEYS.smsUser]          || process.env.SMS_USER              || process.env.SMS_HORIZON_USERNAME || "aureliain").trim();
  const provider     = (map[SETTING_KEYS.smsProvider]      || process.env.SMS_PROVIDER          || "smshorizon").trim();
  const senderId     = (map[SETTING_KEYS.smsSenderId]      || process.env.SMS_SENDER_ID         || process.env.SMS_HORIZON_SENDER_ID || "AURELIA").trim();
  const dltTemplateId= (map[SETTING_KEYS.smsDltTemplateId] || process.env.SMS_DLT_TEMPLATE_ID    || process.env.SMS_HORIZON_DLT_TEMPLATE_ID || "1607100000000323238").trim();
  const authTemplate = map[SETTING_KEYS.smsAuthTemplate]   || process.env.SMS_AUTH_TEMPLATE     || SMS_TEMPLATE_DEFAULT;
  const rawEnabled   = map[SETTING_KEYS.smsEnabled];
  const envEnabled   = process.env.SMS_ENABLED !== undefined ? process.env.SMS_ENABLED === "true" : Boolean(apiKey);
  const enabled      = (rawEnabled === undefined ? envEnabled : rawEnabled === "true") && Boolean(apiKey);
  return { enabled, provider, user, apiKey, senderId, dltTemplateId, authTemplate };
}

export type ReferralConfig = {
  enabled: boolean;
  fixedPaise: number;   // flat reward to the referrer, in paise
  fixedRupees: number;  // same, in rupees (for admin display)
  percentRate: number;  // % of the referred user's first order
};

const REFERRAL_DEFAULTS: ReferralConfig = {
  enabled: false,
  fixedPaise: 0,
  fixedRupees: 0,
  percentRate: 10,
};

/**
 * Referral/points program config, admin-editable. `enabled` gates the whole
 * program. `fixedPaise` + `percentRate` define the referrer's reward when a
 * referred user makes their first purchase.
 */
export async function getReferralConfig(): Promise<ReferralConfig> {
  const map = await getSettingsMap();
  const enabled = (map[SETTING_KEYS.referralEnabled] ?? "false") === "true";
  const fixedRupees = Math.max(0, parseInt(map[SETTING_KEYS.referralFixedRupees] ?? "") || REFERRAL_DEFAULTS.fixedRupees);
  const percentRaw = parseFloat(map[SETTING_KEYS.referralPercentRate] ?? "");
  const percentRate = Number.isFinite(percentRaw)
    ? Math.max(0, Math.min(100, percentRaw))
    : REFERRAL_DEFAULTS.percentRate;
  return { enabled, fixedPaise: fixedRupees * 100, fixedRupees, percentRate };
}

/** Upsert a single setting (admin only — enforce auth in the calling route). */
export async function setSetting(key: string, value: string) {
  return db.siteSetting.upsert({
    where:  { key },
    update: { value },
    create: { key, value },
  });
}
