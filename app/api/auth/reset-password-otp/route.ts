import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { consumeVerifiedOtp, normalizeIdentifier, validateIdentifier, type Channel } from "@/lib/otp";

// Code-based password reset. The identifier (email or phone) must have a freshly
// verified OTP (see /api/auth/otp). Used mainly for phone resets, which can't use
// an email link — but works for email too.
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`resetotp:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: `Too many attempts. Try again in ${rl.retryAfterSeconds}s.` }, { status: 429 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const { identifier, channel, password } = (body as Record<string, unknown>) ?? {};
  if (channel === "phone") {
    return NextResponse.json(
      { error: "Phone reset is temporarily disabled. Please use the email reset link." },
      { status: 400 }
    );
  }
  const chan: Channel = "email";
  const cleanId   = normalizeIdentifier(String(identifier ?? ""), chan);
  const cleanPass = String(password ?? "").trim();

  const formatError = validateIdentifier(cleanId, chan);
  if (formatError) return NextResponse.json({ error: formatError }, { status: 422 });
  if (cleanPass.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 422 });
  }

  // Must have a freshly verified OTP for this identifier.
  const verified = await consumeVerifiedOtp(cleanId, chan);
  if (!verified) {
    return NextResponse.json({ error: "Please verify the code first." }, { status: 403 });
  }

  const where = chan === "email" ? { email: cleanId } : { phone: cleanId };
  const user = await db.user.findFirst({ where, select: { id: true } });
  if (!user) {
    // Verified OTP but no account — shouldn't happen (otp/send blocks this), stay generic.
    return NextResponse.json({ error: "Could not reset password. Please try again." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(cleanPass, 12);
  await db.user.update({ where: { id: user.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true, message: "Password updated. You can now sign in." });
}
