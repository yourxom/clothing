import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const { identifier, channel, code } = (body as Record<string, unknown>) ?? {};
  const chan = channel === "phone" ? "phone" : "email";
  const cleanId = chan === "email"
    ? String(identifier ?? "").trim().toLowerCase()
    : String(identifier ?? "").replace(/\s/g, "");
  const cleanCode = String(code ?? "").trim();

  if (!cleanId || !/^\d{6}$/.test(cleanCode)) {
    return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 422 });
  }

  const otp = await db.checkoutOtp.findFirst({
    where:   { identifier: cleanId, channel: chan, verifiedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otp)                          return NextResponse.json({ error: "No code found. Please request a new one." }, { status: 404 });
  if (otp.expiresAt < new Date())    return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 400 });
  if (otp.attempts >= 5)             return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 429 });

  const valid = await bcrypt.compare(cleanCode, otp.codeHash);
  if (!valid) {
    await db.checkoutOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
  }

  await db.checkoutOtp.update({ where: { id: otp.id }, data: { verifiedAt: new Date() } });
  return NextResponse.json({ ok: true, verified: true });
}
