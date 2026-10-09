import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { currentPassword, newPassword } = (body as Record<string, unknown>) ?? {};
  const current = String(currentPassword ?? "");
  const next    = String(newPassword    ?? "");

  if (!current || !next) return NextResponse.json({ error: "Both fields are required." }, { status: 422 });
  if (next.length < 8)   return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 422 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return NextResponse.json({ error: "No password set on this account." }, { status: 400 });
  }

  const valid = await bcrypt.compare(current, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });

  const newHash = await bcrypt.hash(next, 12);
  await db.user.update({ where: { id: session.user.id }, data: { passwordHash: newHash } });

  return NextResponse.json({ ok: true, message: "Password updated successfully." });
}
