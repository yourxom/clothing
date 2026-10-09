import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { validateEmail } from "@/lib/email-guard";
import { issueOtp, normalizeIdentifier, validateIdentifier, type Channel } from "@/lib/otp";

// Sends a verification code for an auth flow.
// purpose "register" → identifier must NOT already exist (block duplicates early)
// purpose "reset"    → identifier MUST exist (but we don't reveal which, to avoid enumeration)
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`authotp:${ip}`, 6, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: `Too many requests. Try again in ${rl.retryAfterSeconds}s.` }, { status: 429 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const { identifier, channel, purpose } = (body as Record<string, unknown>) ?? {};
  const chan: Channel = channel === "phone" ? "phone" : "email";

  // Phone OTP verification is currently disabled
  if (chan === "phone") {
    return NextResponse.json(
      { error: "Phone verification is currently disabled. Please verify using your email address." },
      { status: 400 }
    );
  }

  const raw = String(identifier ?? "");
  const cleanId = normalizeIdentifier(raw, chan);

  // Format validation (+ disposable-email block for email registration)
  const formatError = validateIdentifier(cleanId, chan);
  if (formatError) return NextResponse.json({ error: formatError }, { status: 422 });
  if (chan === "email") {
    const check = validateEmail(cleanId);
    if (!check.valid) return NextResponse.json({ error: check.error }, { status: 422 });
  }

  const purposeStr = purpose === "reset" ? "reset" : "register";
  const where = chan === "email" ? { email: cleanId } : { phone: cleanId };
  const existing = await db.user.findFirst({ where, select: { id: true } });

  if (purposeStr === "register" && existing) {
    return NextResponse.json(
      { error: `An account with this ${chan === "email" ? "email" : "phone number"} already exists.` },
      { status: 409 }
    );
  }
  // For reset: if the account doesn't exist, pretend success (no enumeration) and don't send.
  if (purposeStr === "reset" && !existing) {
    return NextResponse.json({ ok: true, message: `If an account exists, a code has been sent.` });
  }

  await issueOtp(cleanId, chan);
  return NextResponse.json({
    ok: true,
    message: `Verification code sent to your ${chan === "email" ? "email" : "phone"}.`,
  });
}
