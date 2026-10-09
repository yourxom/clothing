import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Props = { params: Promise<{ id: string }> };

const isValidUrl = (v: string) =>
  (/^https?:\/\/.+/i.test(v) || v.startsWith("/products/")) && v.length <= 2000;

// POST — add an image (by URL) to a product.
export async function POST(request: NextRequest, { params }: Props) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const b = (body as Record<string, unknown>) ?? {};
  const url = String(b.url ?? "").trim();
  const altText = String(b.altText ?? "").trim().slice(0, 200);
  const makePrimary = Boolean(b.isPrimary);
  const colorInput = String(b.color ?? "").trim().slice(0, 100);

  if (!isValidUrl(url)) return NextResponse.json({ error: "Enter a valid image URL or path." }, { status: 422 });

  const product = await db.product.findUnique({
    where: { id },
    select: { id: true, name: true, images: { select: { id: true } }, variants: { select: { color: true } } },
  });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  // A colour tag, if given, must be one of the product's real variant colours.
  const productColors = new Set(product.variants.map(v => v.color));
  const color = colorInput && productColors.has(colorInput) ? colorInput : null;

  // First image (or explicitly requested) becomes primary.
  const primary = makePrimary || product.images.length === 0;
  if (primary) {
    await db.productImage.updateMany({ where: { productId: id }, data: { isPrimary: false } });
  }

  const image = await db.productImage.create({
    data: {
      productId: id,
      url,
      altText: altText || product.name,
      color,
      isPrimary: primary,
      sortOrder: product.images.length,
    },
  });

  return NextResponse.json({ ok: true, image }, { status: 201 });
}

// PATCH — update an image. Body: { imageId, setPrimary?, color? }
//   • setPrimary: true  → make this the main image
//   • color: "<name>" | "" → tag/untag this image with a colourway
export async function PATCH(request: NextRequest, { params }: Props) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const b = (body as Record<string, unknown>) ?? {};
  const imageId = String(b.imageId ?? "");

  const image = await db.productImage.findFirst({ where: { id: imageId, productId: id }, select: { id: true } });
  if (!image) return NextResponse.json({ error: "Image not found." }, { status: 404 });

  // Update the colour tag when a `color` field is present in the body.
  if ("color" in b) {
    const colorInput = String(b.color ?? "").trim().slice(0, 100);
    let color: string | null = null;
    if (colorInput) {
      const product = await db.product.findUnique({
        where: { id }, select: { variants: { select: { color: true } } },
      });
      const productColors = new Set(product?.variants.map(v => v.color) ?? []);
      color = productColors.has(colorInput) ? colorInput : null;
    }
    await db.productImage.update({ where: { id: imageId }, data: { color } });
  }

  // Set as primary when requested (legacy calls send only { imageId }).
  const setPrimary = b.setPrimary === undefined ? !("color" in b) : Boolean(b.setPrimary);
  if (setPrimary) {
    await db.productImage.updateMany({ where: { productId: id }, data: { isPrimary: false } });
    await db.productImage.update({ where: { id: imageId }, data: { isPrimary: true } });
  }

  return NextResponse.json({ ok: true });
}

// DELETE — remove an image. Body: { imageId }
export async function DELETE(request: NextRequest, { params }: Props) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const imageId = String((body as Record<string, unknown>)?.imageId ?? "");
  const image = await db.productImage.findFirst({ where: { id: imageId, productId: id }, select: { id: true, isPrimary: true } });
  if (!image) return NextResponse.json({ ok: true }); // idempotent

  await db.productImage.delete({ where: { id: imageId } });

  // If we removed the primary, promote the next remaining image.
  if (image.isPrimary) {
    const next = await db.productImage.findFirst({ where: { productId: id }, orderBy: { sortOrder: "asc" }, select: { id: true } });
    if (next) await db.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }

  return NextResponse.json({ ok: true });
}
