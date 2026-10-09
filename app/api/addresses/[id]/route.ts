import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export async function DELETE(_: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { id } = await params;
  const address = await db.address.findUnique({ where: { id } });
  if (!address || address.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  await db.address.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { id } = await params;

  const address = await db.address.findUnique({ where: { id } });
  if (!address || address.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { isDefault } = (body as Record<string, unknown>) ?? {};

  if (isDefault) {
    await db.address.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data:  { isDefault: false },
    });
  }

  const updated = await db.address.update({
    where: { id },
    data:  { isDefault: Boolean(isDefault) },
  });

  return NextResponse.json({ ok: true, address: updated });
}
