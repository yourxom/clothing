import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { validateEmail } from "@/lib/email-guard";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { consumeVerifiedOtp, normalizeIdentifier, validateIdentifier, type Channel } from "@/lib/otp";
import { sendWelcomeEmail } from "@/lib/email";

// Registration with email OR phone. The identifier must have a freshly verified
// OTP (see /api/auth/otp) before the account is created.
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Please try again in ${rl.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { name, identifier, channel, password, referralCode } =
    (body as { name?: string; identifier?: string; channel?: string; password?: string; referralCode?: string }) ?? {};

  if (channel === "phone") {
    return NextResponse.json(
      { error: "Phone registration is temporarily disabled. Please register using your email address." },
      { status: 400 }
    );
  }

  const chan: Channel = "email";
  const cleanId   = normalizeIdentifier(String(identifier ?? ""), chan);
  const cleanName = String(name ?? "").trim().slice(0, 100);
  const cleanPass = String(password ?? "");

  // Validate identifier for its channel
  const formatError = validateIdentifier(cleanId, chan);
  if (formatError) return NextResponse.json({ error: formatError }, { status: 422 });
  if (chan === "email") {
    const emailCheck = validateEmail(cleanId);
    if (!emailCheck.valid) return NextResponse.json({ error: emailCheck.error }, { status: 422 });
  }

  if (!cleanPass || cleanPass.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 422 });
  }
  if (cleanPass.length > 72) {
    return NextResponse.json({ error: "Password must be 72 characters or fewer." }, { status: 422 });
  }

  // Require a freshly verified OTP for this identifier before creating the account.
  const verified = await consumeVerifiedOtp(cleanId, chan);
  if (!verified) {
    return NextResponse.json(
      { error: `Please verify your ${chan === "email" ? "email" : "phone number"} first.` },
      { status: 403 }
    );
  }

  // Uniqueness check for the chosen channel
  const where = chan === "email" ? { email: cleanId } : { phone: cleanId };
  const existing = await db.user.findFirst({ where, select: { id: true } });
  if (existing) {
    return NextResponse.json(
      { error: `An account with this ${chan === "email" ? "email" : "phone number"} already exists.` },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(cleanPass, 12);

  const user = await db.user.create({
    data: {
      email:         cleanId,
      phone:         null,
      name:          cleanName || null,
      passwordHash,
      role:          "customer",
      // Email is freshly OTP-verified at this point.
      emailVerified: new Date(),
      phoneVerified: null,
    },
    select: { id: true, email: true, phone: true, name: true },
  });

  // Grant the Rs 100 welcome coupon (non-blocking — never fail signup over it).
  {
    const { grantWelcomeCoupon } = await import("@/lib/welcome-coupon");
    grantWelcomeCoupon(user.id).catch(console.error);
  }

  // Referral: assign this user their own code, and record who referred them
  // (if a valid, non-self code was supplied). Non-blocking.
  {
    const { ensureReferralCode, resolveReferrer } = await import("@/lib/referral");
    ensureReferralCode(user.id).catch(console.error);
    const ref = String(referralCode ?? "").trim();
    if (ref) {
      resolveReferrer(ref, user.id)
        .then(referrerId => {
          if (referrerId) return db.user.update({ where: { id: user.id }, data: { referredById: referrerId } });
        })
        .catch(console.error);
    }
  }

  // Welcome email only for email registrations.
  if (chan === "email") {
    await sendWelcomeEmail(cleanId, cleanName || null).catch(err => {
      console.error("[register] Welcome email delivery failed:", err);
    });
  }

  return NextResponse.json({ ok: true, user }, { status: 201 });
}
