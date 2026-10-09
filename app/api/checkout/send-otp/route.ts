import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { validateEmail } from "@/lib/email-guard";

// Generates a 6-digit code, stores its hash, and "sends" it.
// Email codes go via Resend (or console in dev). Phone codes log to console
// until an SMS provider (e.g. Twilio/MSG91) is configured.
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`otp:${ip}`, 6, 10 * 60 * 1000); // 6 sends / 10 min / IP
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rl.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const { identifier, channel } = (body as Record<string, unknown>) ?? {};
  const chan = channel === "phone" ? "phone" : "email";
  const id   = String(identifier ?? "").trim();

  // Phone OTP verification is currently disabled
  if (chan === "phone") {
    return NextResponse.json(
      { error: "Phone verification is currently disabled. Please verify using your email address." },
      { status: 400 }
    );
  }

  // Validate the email identifier
  const check = validateEmail(id.toLowerCase());
  if (!check.valid) return NextResponse.json({ error: check.error }, { status: 422 });

  const cleanId  = chan === "email" ? id.toLowerCase() : id.replace(/\s/g, "");
  const code     = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Remove any prior unverified codes for this identifier+channel
  await db.checkoutOtp.deleteMany({ where: { identifier: cleanId, channel: chan, verifiedAt: null } });
  await db.checkoutOtp.create({ data: { identifier: cleanId, channel: chan, codeHash, expiresAt } });

  // Deliver the code
  if (chan === "email") {
    try {
      const { sendOtpEmail } = await import("@/lib/email");
      await sendOtpEmail(cleanId, code);
    } catch (e) { console.error("[otp email] failed:", e); }
  } else {
    try {
      const { sendOtpSms } = await import("@/lib/sms");
      await sendOtpSms(cleanId, code);
    } catch (e) { console.error("[otp sms] failed:", e); }
  }
  return NextResponse.json({
    ok: true,
    message: `Verification code sent to your ${chan === "email" ? "email" : "phone"}.`,
  });
}
