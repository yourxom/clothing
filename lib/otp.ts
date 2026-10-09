// Shared one-time-code (OTP) helpers, reused across checkout, registration,
// and password reset. Codes are 6 digits, bcrypt-hashed, stored in the generic
// CheckoutOtp table (identifier + channel), expire in 10 minutes, capped at 5
// verify attempts. Delivery goes via email (Resend) or SMS depending on channel.
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export type Channel = "email" | "phone";

/** Normalises an identifier for its channel (lowercase email, digits-only phone). */
export function normalizeIdentifier(identifier: string, channel: Channel): string {
  return channel === "email"
    ? identifier.trim().toLowerCase()
    : identifier.replace(/\D/g, "");
}

/** Basic per-channel format validation. Returns an error string or null. */
export function validateIdentifier(identifier: string, channel: Channel): string | null {
  if (channel === "email") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier) ? null : "Enter a valid email address.";
  }
  return /^\d{10}$/.test(identifier) ? null : "Enter a valid 10-digit phone number.";
}

/**
 * Generates a code, stores its hash (replacing any prior unverified code), and
 * delivers it via the appropriate channel (email/SMS). The plain code is never
 * returned to the client — delivery is the only way a user receives it.
 */
export async function issueOtp(identifier: string, channel: Channel): Promise<void> {
  const code     = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.checkoutOtp.deleteMany({ where: { identifier, channel, verifiedAt: null } });
  await db.checkoutOtp.create({ data: { identifier, channel, codeHash, expiresAt } });

  if (channel === "email") {
    try {
      const { sendOtpEmail } = await import("@/lib/email");
      await sendOtpEmail(identifier, code);
    } catch (e) { console.error("[otp email] failed:", e); }
  } else {
    try {
      const { sendOtpSms } = await import("@/lib/sms");
      await sendOtpSms(identifier, code);
    } catch (e) { console.error("[otp sms] failed:", e); }
  }
}

export type VerifyResult = { ok: true } | { ok: false; status: number; error: string };

/** Checks a submitted code against the latest unverified OTP. Marks it verified on success. */
export async function verifyOtp(identifier: string, channel: Channel, code: string): Promise<VerifyResult> {
  const clean = String(code ?? "").trim();
  if (!/^\d{6}$/.test(clean)) return { ok: false, status: 422, error: "Enter the 6-digit code." };

  const otp = await db.checkoutOtp.findFirst({
    where:   { identifier, channel, verifiedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otp)                       return { ok: false, status: 404, error: "No code found. Please request a new one." };
  if (otp.expiresAt < new Date()) return { ok: false, status: 400, error: "Code expired. Request a new one." };
  if (otp.attempts >= 5)          return { ok: false, status: 429, error: "Too many attempts. Request a new code." };

  const valid = await bcrypt.compare(clean, otp.codeHash);
  if (!valid) {
    await db.checkoutOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, status: 400, error: "Incorrect code. Please try again." };
  }

  await db.checkoutOtp.update({ where: { id: otp.id }, data: { verifiedAt: new Date() } });
  return { ok: true };
}

/**
 * Confirms there is a RECENTLY verified OTP for this identifier+channel (within
 * `maxAgeMs`). Used by register/reset routes to ensure the code was verified
 * just before the sensitive action. Consumes (deletes) it so it can't be reused.
 */
export async function consumeVerifiedOtp(
  identifier: string,
  channel: Channel,
  maxAgeMs = 15 * 60 * 1000
): Promise<boolean> {
  const otp = await db.checkoutOtp.findFirst({
    where:   { identifier, channel, verifiedAt: { not: null } },
    orderBy: { verifiedAt: "desc" },
  });
  if (!otp?.verifiedAt) return false;
  if (Date.now() - otp.verifiedAt.getTime() > maxAgeMs) return false;
  await db.checkoutOtp.deleteMany({ where: { identifier, channel } });
  return true;
}
