import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const token = String((body as Record<string, unknown>)?.token ?? "").trim();
  if (!token) return NextResponse.json({ error: "Token required." }, { status: 422 });

  const record = await db.emailVerifyToken.findUnique({ where: { token } });

  if (!record)             return NextResponse.json({ error: "Invalid or expired verification link." }, { status: 400 });
  if (record.usedAt)       return NextResponse.json({ error: "This verification link has already been used." }, { status: 400 });
  if (record.expiresAt < new Date()) return NextResponse.json({ error: "This link has expired. Please request a new one." }, { status: 400 });

  await db.$transaction([
    db.user.update({ where: { email: record.email }, data: { emailVerified: new Date() } }),
    db.emailVerifyToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return NextResponse.json({ ok: true, message: "Email verified successfully. You can now sign in." });
}
