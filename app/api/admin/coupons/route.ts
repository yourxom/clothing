import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      // For PERSONAL coupons, surface the one owner so the admin table can show it.
      userCoupons: {
        take: 1,
        include: { user: { select: { name: true, email: true, phone: true } } },
      },
    },
  });

  // Flatten the owner onto each coupon for the UI.
  const shaped = coupons.map((c) => {
    const owner = c.userCoupons[0]?.user;
    const ownerLabel = owner
      ? (owner.name || (owner.email && !owner.email.endsWith("@phone.aurelia.local") ? owner.email : null) || (owner.phone ? `+91 ${owner.phone}` : null))
      : null;
    const { userCoupons, ...rest } = c;
    void userCoupons;
    return { ...rest, ownerLabel };
  });

  return NextResponse.json({ ok: true, coupons: shaped });
}

export async function POST(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const b = (body as Record<string, unknown>) ?? {};

  const code = String(b.code ?? "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Code is required." }, { status: 422 });

  const discountType: "FIXED" | "PERCENT" = b.discountType === "FIXED" ? "FIXED" : "PERCENT";
  const discountValue = Math.max(1, Math.floor(Number(b.discountValue) || 0));
  if (discountType === "PERCENT" && discountValue > 100) {
    return NextResponse.json({ error: "Percentage cannot exceed 100." }, { status: 422 });
  }

  const scope: "GENERAL" | "PERSONAL" = b.scope === "PERSONAL" ? "PERSONAL" : "GENERAL";
  const targetUserId = b.targetUserId ? String(b.targetUserId) : null;

  // A PERSONAL coupon must be bound to an existing user.
  if (scope === "PERSONAL") {
    if (!targetUserId) {
      return NextResponse.json({ error: "Select a user for a personal coupon." }, { status: 422 });
    }
    const target = await db.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
    if (!target) {
      return NextResponse.json({ error: "The selected user no longer exists." }, { status: 422 });
    }
  }

  const data = {
    code,
    description:      b.description ? String(b.description).slice(0, 200) : null,
    discountType,
    discountValue,   // percent, or paise for FIXED
    minOrderPaise:    Math.max(0, Math.floor(Number(b.minOrderPaise) || 0)),
    maxDiscountPaise: b.maxDiscountPaise ? Math.floor(Number(b.maxDiscountPaise)) : null,
    usageLimit:       b.usageLimit ? Math.floor(Number(b.usageLimit)) : null,
    active:           b.active !== false,
    expiresAt:        b.expiresAt ? new Date(String(b.expiresAt)) : null,
    scope,
  };

  try {
    const coupon = scope === "PERSONAL"
      // Create the coupon AND bind it to the chosen user in one go.
      ? await db.coupon.create({
          data: {
            ...data,
            userCoupons: { create: { userId: targetUserId!, code } },
          },
        })
      : await db.coupon.create({ data });
    return NextResponse.json({ ok: true, coupon }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "A coupon with this code already exists." }, { status: 409 });
  }
}
