import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { token, password } = (body as Record<string, unknown>) ?? {};
  const cleanToken = String(token    ?? "").trim();
  const cleanPass  = String(password ?? "").trim();

  if (!cleanToken)          return NextResponse.json({ error: "Token is required."                      }, { status: 422 });
  if (cleanPass.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters."}, { status: 422 });

  const record = await db.passwordResetToken.findUnique({ where: { token: cleanToken } });

  if (!record)                          return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
  if (record.usedAt)                    return NextResponse.json({ error: "This reset link has already been used." }, { status: 400 });
  if (record.expiresAt < new Date())    return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });

  const passwordHash = await bcrypt.hash(cleanPass, 12);

  await db.$transaction([
    db.user.update({ where: { email: record.email }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return NextResponse.json({ ok: true, message: "Password updated. You can now sign in." });
}
