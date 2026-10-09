import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, email, subject, message } =
    (body as Record<string, unknown>) ?? {};

  const cleanName    = String(name    ?? "").trim().slice(0, 100);
  const cleanEmail   = String(email   ?? "").trim().toLowerCase();
  const cleanSubject = String(subject ?? "general").trim().slice(0, 100);
  const cleanMessage = String(message ?? "").trim().slice(0, 5000);

  if (!cleanName) return NextResponse.json({ error: "Name is required." }, { status: 422 });
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 422 });
  }
  if (!cleanMessage || cleanMessage.length < 10) {
    return NextResponse.json({ error: "Message must be at least 10 characters." }, { status: 422 });
  }

  await db.contactMessage.create({
    data: { name: cleanName, email: cleanEmail, subject: cleanSubject, message: cleanMessage },
  });

  return NextResponse.json({ ok: true, message: "Message received. We'll be in touch soon." }, { status: 201 });
}
