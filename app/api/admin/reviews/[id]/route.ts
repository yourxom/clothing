import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Props) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const { approved } = (body as Record<string, unknown>) ?? {};
  const review = await db.review.update({
    where: { id }, data: { approved: Boolean(approved) },
  });
  return NextResponse.json({ ok: true, review });
}

export async function DELETE(_: NextRequest, { params }: Props) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  await db.review.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
