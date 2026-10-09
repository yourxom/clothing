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
  const b = (body as Record<string, unknown>) ?? {};

  // Toggle-only request: body carries just `active` and nothing editable.
  const isToggleOnly =
    "active" in b &&
    !("discountValue" in b || "discountType" in b || "description" in b ||
      "minOrderPaise" in b || "maxDiscountPaise" in b || "usageLimit" in b ||
      "expiresAt" in b);

  if (isToggleOnly) {
    const coupon = await db.coupon.update({
      where: { id }, data: { active: Boolean(b.active) },
    });
    return NextResponse.json({ ok: true, coupon });
  }

  // Full edit. Code and scope/owner are immutable after creation — only the
  // discount terms and metadata can change.
  const discountType: "FIXED" | "PERCENT" = b.discountType === "FIXED" ? "FIXED" : "PERCENT";
  const discountValue = Math.max(1, Math.floor(Number(b.discountValue) || 0));
  if (discountType === "PERCENT" && discountValue > 100) {
    return NextResponse.json({ error: "Percentage cannot exceed 100." }, { status: 422 });
  }

  try {
    const coupon = await db.coupon.update({
      where: { id },
      data: {
        description:      b.description ? String(b.description).slice(0, 200) : null,
        discountType,
        discountValue,
        minOrderPaise:    Math.max(0, Math.floor(Number(b.minOrderPaise) || 0)),
        maxDiscountPaise: b.maxDiscountPaise ? Math.floor(Number(b.maxDiscountPaise)) : null,
        usageLimit:       b.usageLimit ? Math.floor(Number(b.usageLimit)) : null,
        expiresAt:        b.expiresAt ? new Date(String(b.expiresAt)) : null,
        active:           b.active !== false,
      },
    });
    return NextResponse.json({ ok: true, coupon });
  } catch {
    return NextResponse.json({ error: "Could not update coupon." }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: Props) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  await db.coupon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
