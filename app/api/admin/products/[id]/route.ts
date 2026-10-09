import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { syncVariants, toneForColor, SIZE_OPTIONS } from "@/lib/product-admin";

type Props = { params: Promise<{ id: string }> };

const VALID_SIZES = new Set<string>(SIZE_OPTIONS);
const isValidColor = (c: string) => typeof c === "string" && c.trim().length > 0 && c.trim().length <= 60;

export async function PATCH(request: NextRequest, { params }: Props) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const b = (body as Record<string, unknown>) ?? {};

  const existing = await db.product.findUnique({ where: { id }, select: { id: true, sku: true } });
  if (!existing) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const data: Record<string, unknown> = {};

  if (typeof b.published === "boolean") data.published = b.published;
  if (typeof b.name === "string" && b.name.trim()) data.name = b.name.trim().slice(0, 200);
  if (typeof b.description === "string" && b.description.trim().length >= 10) data.description = b.description.trim();
  if (typeof b.fabric === "string" && b.fabric.trim()) data.fabric = b.fabric.trim().slice(0, 60);
  // Prices arrive in rupees; stored as paise.
  if (typeof b.price === "number" && b.price > 0) data.price = Math.floor(b.price) * 100;
  if (typeof b.mrp === "number" && b.mrp > 0) data.mrp = Math.floor(b.mrp) * 100;

  if (typeof b.categorySlug === "string" && b.categorySlug) {
    const category = await db.category.findUnique({ where: { slug: b.categorySlug }, select: { id: true } });
    if (!category) return NextResponse.json({ error: "Invalid category." }, { status: 422 });
    data.categoryId = category.id;
  }

  // Colours/sizes → regenerate variants.
  const colors = Array.isArray(b.colors) ? b.colors.map(String).filter(isValidColor).map(c => c.trim()) : null;
  const sizes = Array.isArray(b.sizes) ? b.sizes.map(String).filter(s => VALID_SIZES.has(s)) : null;

  if (colors && colors.length === 0) return NextResponse.json({ error: "Select at least one colour." }, { status: 422 });
  if (sizes && sizes.length === 0) return NextResponse.json({ error: "Select at least one size." }, { status: 422 });

  // Keep product.color/tone in sync with the first offered colour.
  if (colors && colors.length) {
    data.color = colors[0];
    data.tone = toneForColor(colors[0]);
  }

  if (Object.keys(data).length) {
    await db.product.update({ where: { id }, data });
  }

  if (colors && sizes) {
    await syncVariants(id, existing.sku, colors, sizes);
  } else if (colors || sizes) {
    // Only one of the two provided — resolve the other from current variants.
    const current = await db.productVariant.findMany({ where: { productId: id }, select: { size: true, color: true } });
    const curColors = [...new Set(current.map(v => v.color))];
    const curSizes = [...new Set(current.map(v => v.size))];
    await syncVariants(id, existing.sku, colors ?? curColors, sizes ?? curSizes);
  }

  const product = await db.product.findUnique({
    where: { id },
    include: { variants: true, images: true, category: { select: { slug: true, name: true } } },
  });
  return NextResponse.json({ ok: true, product });
}

// DELETE /api/admin/products/[id] — permanently remove a product.
// Variants, inventory, images, reviews cascade-delete. Order history is preserved
// because OrderLine snapshots product data (its productId FK is onDelete: Restrict),
// so if the product was ever ordered we unpublish instead of hard-deleting.
export async function DELETE(_request: NextRequest, { params }: Props) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;

  const orderedLine = await db.orderLine.findFirst({ where: { productId: id }, select: { id: true } });
  if (orderedLine) {
    // Can't hard-delete (would break order history) — unpublish + zero stock.
    await db.product.update({ where: { id }, data: { published: false } });
    await db.inventory.updateMany({
      where: { variant: { productId: id } },
      data: { quantity: 0 },
    });
    return NextResponse.json({ ok: true, softDeleted: true, message: "Product has orders — unpublished and stock zeroed instead of deleted." });
  }

  await db.product.delete({ where: { id } });
  return NextResponse.json({ ok: true, deleted: true });
}
