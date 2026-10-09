// Server-side saved items (wishlist + bag) for authenticated users.
// Guest users continue to use localStorage via preview-store.tsx.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SIZE_RE = /^[A-Za-z0-9 -]{1,20}$/;
const COLOR_RE = /^[A-Za-z0-9 -]{0,40}$/;
const valid = {
  slug: (v: unknown): v is string => typeof v === "string" && v.length <= 120 && SLUG_RE.test(v),
  size: (v: unknown): v is string => typeof v === "string" && SIZE_RE.test(v),
  color: (v: unknown): v is string => typeof v === "string" && COLOR_RE.test(v),
  type: (v: unknown): v is "WISHLIST" | "BAG" => v === "WISHLIST" || v === "BAG",
};

// GET /api/saved — return all saved items for the logged-in user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const items = await db.savedItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: { slug: true, name: true, color: true, tone: true, price: true, mrp: true,
                  category: { select: { slug: true, name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, items });
}

// POST /api/saved — add or update a saved item
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { productSlug, type, size, color, quantity } = (body as Record<string, unknown>) ?? {};

  if (!valid.slug(productSlug)) return NextResponse.json({ error: "Invalid product." }, { status: 422 });
  if (!valid.type(type))        return NextResponse.json({ error: "Invalid type." },    { status: 422 });
  if (type === "BAG" && !valid.size(size)) return NextResponse.json({ error: "Size required for bag." }, { status: 422 });
  if (color !== undefined && !valid.color(color)) return NextResponse.json({ error: "Invalid colour." }, { status: 422 });

  const product = await db.product.findUnique({ where: { slug: productSlug }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const qty = type === "BAG" ? Math.min(10, Math.max(1, Number(quantity) || 1)) : 1;
  const sizeVal  = type === "BAG" ? String(size) : "";
  const colorVal = type === "BAG" ? String(color ?? "") : "";

  const where = {
    userId_productId_type_size_color: {
      userId:    session.user.id,
      productId: product.id,
      type,
      size:      sizeVal,
      color:     colorVal,
    },
  };

  try {
    const item = await db.savedItem.upsert({
      where,
      update:  { quantity: qty, updatedAt: new Date() },
      create:  {
        userId:    session.user.id,
        productId: product.id,
        type,
        size:      sizeVal,
        color:     colorVal,
        quantity:  qty,
      },
      include: { product: { select: { slug: true, name: true } } },
    });

    return NextResponse.json({ ok: true, item }, { status: 200 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Race condition with concurrent upsert: record was inserted in parallel, update it
      const item = await db.savedItem.update({
        where,
        data:    { quantity: qty, updatedAt: new Date() },
        include: { product: { select: { slug: true, name: true } } },
      });
      return NextResponse.json({ ok: true, item }, { status: 200 });
    }
    throw err;
  }
}

// DELETE /api/saved — remove a saved item
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { productSlug, type, size, color } = (body as Record<string, unknown>) ?? {};

  if (!valid.slug(productSlug)) return NextResponse.json({ error: "Invalid product." }, { status: 422 });
  if (!valid.type(type))        return NextResponse.json({ error: "Invalid type." },    { status: 422 });

  const product = await db.product.findUnique({ where: { slug: productSlug }, select: { id: true } });
  if (!product) return NextResponse.json({ ok: true }); // idempotent

  await db.savedItem.deleteMany({
    where: {
      userId:    session.user.id,
      productId: product.id,
      type,
      ...(type === "BAG" && valid.size(size) ? { size: String(size) } : {}),
      ...(type === "BAG" && color !== undefined && valid.color(color) ? { color: String(color) } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
