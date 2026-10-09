import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, requireSuperAdmin } from "@/lib/admin-guard";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Props) {
  const adminSession = await requireAdmin();
  if (!adminSession) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;

  // Prevent changing your own role
  if (id === adminSession.user!.id) {
    return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const { role } = (body as Record<string, unknown>) ?? {};
  if (role !== "admin" && role !== "customer" && role !== "superadmin") {
    return NextResponse.json({ error: "Role must be customer, admin, or superadmin." }, { status: 422 });
  }

  // Only a superadmin can grant or revoke the superadmin role
  const superSession = await requireSuperAdmin();
  const target = await db.user.findUnique({ where: { id }, select: { role: true } });
  if ((role === "superadmin" || target?.role === "superadmin") && !superSession) {
    return NextResponse.json(
      { error: "Only a superadmin can manage superadmin roles." },
      { status: 403 }
    );
  }

  const user = await db.user.update({ where: { id }, data: { role: String(role) } });
  return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
}
