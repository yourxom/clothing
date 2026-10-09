import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { getSiteConfig } from "@/lib/settings";

export async function POST(request: NextRequest) {
  // Allow both authenticated users and a provided email (for post-register flow)
  const session = await auth();
  let body: unknown;
  try { body = await request.json().catch(() => ({})); } catch { body = {}; }

  const email = session?.user?.email
    ?? String((body as Record<string, unknown>)?.email ?? "").trim().toLowerCase();

  if (!email) return NextResponse.json({ error: "Email required." }, { status: 422 });

  const user = await db.user.findUnique({ where: { email }, select: { id: true, emailVerified: true } });
  if (!user) return NextResponse.json({ ok: true }); // Don't reveal user existence

  if (user.emailVerified) {
    return NextResponse.json({ ok: true, message: "Email already verified." });
  }

  const token     = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.emailVerifyToken.create({ data: { email, token, expiresAt } });

  const { siteUrl } = await getSiteConfig();
  const verifyUrl = `${siteUrl}/verify-email?token=${token}`;
  await sendVerificationEmail(email, verifyUrl).catch(console.error);

  return NextResponse.json({ ok: true, message: "Verification email sent." });
}
