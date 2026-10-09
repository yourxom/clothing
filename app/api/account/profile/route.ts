import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const name  = String((body as Record<string, unknown>)?.name  ?? "").trim().slice(0, 100);
  const phone = String((body as Record<string, unknown>)?.phone ?? "").trim().slice(0, 20);

  const user = await db.user.update({
    where: { id: session.user.id },
    data:  { name: name || null, phone: phone || null },
    select: { id: true, name: true, email: true, phone: true },
  });

  return NextResponse.json({ ok: true, user });
}
