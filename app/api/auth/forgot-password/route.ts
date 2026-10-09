import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getSiteConfig } from "@/lib/settings";

export async function POST(request: NextRequest) {
  // Rate limit: 3 reset requests per IP per 15 minutes
  const ip = getClientIp(request);
  const rl = rateLimit(`forgot:${ip}`, 3, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please try again in ${rl.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const email = String((body as Record<string, unknown>)?.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required." }, { status: 422 });
  }

  // Always return success to prevent user enumeration
  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (user) {
    const token    = crypto.randomBytes(48).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.passwordResetToken.create({ data: { email, token, expiresAt } });

    const { siteUrl } = await getSiteConfig();
    const resetUrl = `${siteUrl}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetUrl).catch(console.error);
  }

  return NextResponse.json({
    ok: true,
    message: "If an account exists for that email, a reset link has been sent.",
  });
}
