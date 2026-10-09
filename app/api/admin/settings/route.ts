import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import {
  getWhatsappConfig, getDeliveryConfig, getEmailConfig, getSmsConfig, getSiteConfig,
  getReferralConfig, setSetting, SETTING_KEYS,
} from "@/lib/settings";

// Never send secrets back to the browser in full — mask them.
function mask(secret: string): string {
  if (!secret) return "";
  if (secret.length <= 6) return "••••••";
  return `${secret.slice(0, 3)}••••${secret.slice(-3)}`;
}

// GET /api/admin/settings — current config for the admin form
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const [site, whatsapp, delivery, email, sms, referral] = await Promise.all([
    getSiteConfig(), getWhatsappConfig(), getDeliveryConfig(), getEmailConfig(), getSmsConfig(), getReferralConfig(),
  ]);
  return NextResponse.json({
    ok: true,
    site,
    whatsapp,
    delivery,
    email: { enabled: email.enabled, from: email.from, apiKeyMasked: mask(email.apiKey), hasApiKey: Boolean(email.apiKey) },
    sms:   { enabled: sms.enabled, provider: sms.provider, senderId: sms.senderId, dltTemplateId: sms.dltTemplateId, authTemplate: sms.authTemplate, apiKeyMasked: mask(sms.apiKey), hasApiKey: Boolean(sms.apiKey) },
    referral: { enabled: referral.enabled, fixedRupees: referral.fixedRupees, percentRate: referral.percentRate },
  });
}

// PATCH /api/admin/settings — update WhatsApp config
export async function PATCH(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const b = (body as Record<string, unknown>) ?? {};

  // ── Brand & domain ──────────────────────────────────────────────
  if (b.siteUrl !== undefined) {
    const raw = String(b.siteUrl).trim().replace(/\/+$/, "");
    if (raw) {
      try {
        const u = new URL(raw);
        if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("bad protocol");
      } catch {
        return NextResponse.json(
          { error: "Enter a valid site URL including https:// (e.g. https://aurelia.in)." },
          { status: 422 }
        );
      }
    }
    await setSetting(SETTING_KEYS.siteUrl, raw);
  }
  if (b.contactEmail !== undefined) {
    const email = String(b.contactEmail).trim().slice(0, 200);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid contact email (e.g. hello@aurelia.in)." },
        { status: 422 }
      );
    }
    await setSetting(SETTING_KEYS.contactEmail, email);
  }

  // WhatsApp number — digits only, must include country code (10–15 digits)
  if (b.whatsappNumber !== undefined) {
    const num = String(b.whatsappNumber).replace(/\D/g, "");
    if (num && (num.length < 10 || num.length > 15)) {
      return NextResponse.json(
        { error: "Enter a valid WhatsApp number with country code (e.g. 919812345678)." },
        { status: 422 }
      );
    }
    await setSetting(SETTING_KEYS.whatsappNumber, num);
  }

  if (b.whatsappMessage !== undefined) {
    await setSetting(SETTING_KEYS.whatsappMessage, String(b.whatsappMessage).slice(0, 500));
  }

  if (b.whatsappEnabled !== undefined) {
    await setSetting(SETTING_KEYS.whatsappEnabled, b.whatsappEnabled ? "true" : "false");
  }

  // Delivery estimate window
  if (b.deliveryMinDays !== undefined) {
    const min = Math.max(1, Math.min(60, Math.floor(Number(b.deliveryMinDays) || 4)));
    await setSetting(SETTING_KEYS.deliveryMinDays, String(min));
  }
  if (b.deliveryMaxDays !== undefined) {
    const max = Math.max(1, Math.min(90, Math.floor(Number(b.deliveryMaxDays) || 7)));
    await setSetting(SETTING_KEYS.deliveryMaxDays, String(max));
  }

  // ── Referral & points program ───────────────────────────────────
  if (b.referralEnabled !== undefined) {
    await setSetting(SETTING_KEYS.referralEnabled, b.referralEnabled ? "true" : "false");
  }
  if (b.referralFixedRupees !== undefined) {
    const fixed = Math.max(0, Math.min(100000, Math.floor(Number(b.referralFixedRupees) || 0)));
    await setSetting(SETTING_KEYS.referralFixedRupees, String(fixed));
  }
  if (b.referralPercentRate !== undefined) {
    const pct = Math.max(0, Math.min(100, Number(b.referralPercentRate) || 0));
    await setSetting(SETTING_KEYS.referralPercentRate, String(pct));
  }

  // ── Email (Resend) ──────────────────────────────────────────────
  if (b.emailEnabled !== undefined) {
    await setSetting(SETTING_KEYS.emailEnabled, b.emailEnabled ? "true" : "false");
  }
  if (b.emailFrom !== undefined) {
    await setSetting(SETTING_KEYS.emailFrom, String(b.emailFrom).slice(0, 200));
  }
  // Only overwrite the key when a non-empty, non-masked value is provided.
  if (typeof b.emailApiKey === "string" && b.emailApiKey.trim() && !b.emailApiKey.includes("••")) {
    await setSetting(SETTING_KEYS.emailApiKey, b.emailApiKey.trim());
  }

  // ── SMS provider ────────────────────────────────────────────────
  if (b.smsEnabled !== undefined) {
    await setSetting(SETTING_KEYS.smsEnabled, b.smsEnabled ? "true" : "false");
  }
  if (b.smsProvider !== undefined) {
    const allowed = ["smshorizon", "msg91", "twilio"];
    const p = allowed.includes(String(b.smsProvider)) ? String(b.smsProvider) : "smshorizon";
    await setSetting(SETTING_KEYS.smsProvider, p);
  }
  if (b.smsSenderId !== undefined) {
    await setSetting(SETTING_KEYS.smsSenderId, String(b.smsSenderId).slice(0, 20));
  }
  if (b.smsDltTemplateId !== undefined) {
    await setSetting(SETTING_KEYS.smsDltTemplateId, String(b.smsDltTemplateId).slice(0, 50));
  }
  if (b.smsAuthTemplate !== undefined) {
    await setSetting(SETTING_KEYS.smsAuthTemplate, String(b.smsAuthTemplate).slice(0, 300));
  }
  if (typeof b.smsApiKey === "string" && b.smsApiKey.trim() && !b.smsApiKey.includes("••")) {
    await setSetting(SETTING_KEYS.smsApiKey, b.smsApiKey.trim());
  }

  const [site, whatsapp, delivery, email, sms] = await Promise.all([
    getSiteConfig(), getWhatsappConfig(), getDeliveryConfig(), getEmailConfig(), getSmsConfig(),
  ]);
  return NextResponse.json({
    ok: true,
    site,
    whatsapp,
    delivery,
    email: { enabled: email.enabled, from: email.from, hasApiKey: Boolean(email.apiKey) },
    sms:   { enabled: sms.enabled, provider: sms.provider, senderId: sms.senderId, dltTemplateId: sms.dltTemplateId, authTemplate: sms.authTemplate, hasApiKey: Boolean(sms.apiKey) },
  });
}
