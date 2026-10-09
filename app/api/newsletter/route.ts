import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateEmail } from "@/lib/email-guard";

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = String(
    (body as Record<string, unknown>)?.email ?? ""
  ).trim().toLowerCase();

  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) {
    return NextResponse.json({ error: emailCheck.error }, { status: 422 });
  }

  const source = String(
    (body as Record<string, unknown>)?.source ?? "website"
  ).slice(0, 50);

  // Upsert — signing up twice is not an error
  await db.newsletterSubscriber.upsert({
    where:  { email },
    update: {},
    create: { email, source },
  });

  return NextResponse.json(
    { ok: true, message: "You're on the list. We'll be in touch when AURELIA launches." },
    { status: 200 }
  );
}
