// SMS sending. Configuration comes from admin settings (DB) first, falling back
// to .env. When no provider is configured, codes are logged to the console in
// dev so phone verification can be tested without a paid SMS account.
//
// Supported providers:
//   "smshorizon" — SMS Horizon India (https://smshorizon.in) — RECOMMENDED for India
//   "msg91"      — MSG91 (https://msg91.com)
//   "twilio"     — Twilio (https://twilio.com)
import { getSmsConfig } from "@/lib/settings";

type SmsResult = { ok: boolean; dev?: boolean; error?: unknown };

/** Normalises an Indian 10-digit number to E.164 (+91...). Leaves already-prefixed numbers alone. */
function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (phone.startsWith("+")) return `+${digits}`;
  return `+${digits}`;
}

/** Strips +/country code, returns 10-digit number for Indian-specific APIs. */
function toTenDigit(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 10) return digits;
  return digits.slice(-10);
}

/** Sends a raw SMS message to a phone number. */
export async function sendSms(phone: string, message: string): Promise<SmsResult> {
  const cfg = await getSmsConfig().catch(() => null);

  if (!cfg || !cfg.enabled || !cfg.apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[sms dev] TO: ${phone} | ${message}`);
    }
    return { ok: true, dev: true };
  }

  try {
    // ── SMS Horizon (recommended for India) ───────────────────────────────────
    // Docs: https://smshorizon.in/sms-api
    // Auth: Bearer token in Authorization header
    // Endpoint: POST https://smshorizon.co.in/api/v2/sendsms.php
    // Required DLT: sender ID (6-char header) + DLT template ID (tid) registered on TRAI DLT portal
    if (cfg.provider === "smshorizon") {
      const mobile = toTenDigit(phone);
      const body = new URLSearchParams({
        user: cfg.user || "aureliain",
        number: mobile,
        mobile,
        senderid: cfg.senderId || "AURELIA",
        message,
        type: /[^\x00-\x7F]/.test(message) ? "uni" : "txt", // auto-detect unicode
        ...(cfg.dltTemplateId ? { tid: cfg.dltTemplateId } : { tid: "1607100000000323238" }),
        prettyprint: "1",
      });

      // Primary endpoint from SMS Horizon dashboard: https://smshorizon.com/api/v2/sendsms
      const endpoint = "https://smshorizon.com/api/v2/sendsms";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cfg.apiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const text = await res.text();
      let parsed: Record<string, unknown> = {};
      try { parsed = JSON.parse(text); } catch { /* non-JSON response */ }

      if (!res.ok || (parsed.status && parsed.status === "error") || parsed.error) {
        throw new Error(`SMS Horizon error ${res.status}: ${text.slice(0, 200)}`);
      }
      return { ok: true };
    }

    // ── Twilio ─────────────────────────────────────────────────────────────────
    if (cfg.provider === "twilio") {
      const [sid, token] = cfg.apiKey.split(":");
      const auth = Buffer.from(`${sid}:${token}`).toString("base64");
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: toE164(phone), From: cfg.senderId, Body: message }),
      });
      if (!res.ok) throw new Error(`Twilio ${res.status}: ${await res.text()}`);
      return { ok: true };
    }

    // ── MSG91 (default fallback) ───────────────────────────────────────────────
    // Default: MSG91 (popular in India). Uses the flow/SMS endpoint.
    const digits  = phone.replace(/\D/g, "");
    const mobile  = digits.length === 10 ? `91${digits}` : digits;
    const res = await fetch("https://api.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        authkey: cfg.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender:  cfg.senderId,
        mobiles: mobile,
        message,
      }),
    });
    if (!res.ok) throw new Error(`MSG91 ${res.status}: ${await res.text()}`);
    return { ok: true };

  } catch (err) {
    console.error("[sms] Send failed:", err);
    return { ok: false, error: err };
  }
}

/** Sends an OTP code via SMS using the admin-configured template ({code} / {#var#} placeholder). */
export async function sendOtpSms(phone: string, code: string): Promise<SmsResult> {
  const cleanPhone = phone.replace(/\D/g, "").slice(-10);

  // ── Show OTP in Terminal for verification ──────────────────────────────
  console.log(`
┌────────────────────────────────────────────────────────┐
│  📱 [PHONE VERIFICATION OTP]                           │
│  Phone:    ${cleanPhone.padEnd(42, " ")}│
│  OTP Code: ${code.padEnd(42, " ")}│
│  (Valid for 10 minutes)                                │
└────────────────────────────────────────────────────────┘
`);

  // Bypass SMS Horizon gateway temporarily while support activates the route.
  // Set SMS_SIMULATE="false" in .env once live delivery is ready.
  const simulateInTerminal = process.env.SMS_SIMULATE !== "false";
  if (simulateInTerminal) {
    return { ok: true, dev: true };
  }

  const cfg = await getSmsConfig().catch(() => null);
  if (!cfg || !cfg.enabled || !cfg.apiKey) {
    return { ok: true, dev: true };
  }

  const template = cfg?.authTemplate || "OTP for your new user account registration is: {code}\n\n-Aurelia";
  let message = template;
  if (message.includes("{code}")) {
    message = message.replaceAll("{code}", code);
  } else if (message.includes("{#var#}")) {
    message = message.replaceAll("{#var#}", code);
  } else {
    message = `${message} ${code}`.trim();
  }
  return sendSms(phone, message);
}
