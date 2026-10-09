// File upload API for admin product images.
// Accepts multipart/form-data with fields:
//   file         — the image file (jpg/jpeg/png/webp/gif, max 8 MB)
//   productId    — the product to attach the image to
//   categorySlug — used to determine the folder: public/products/[categorySlug]/
//   altText      — optional alt text
//   color        — optional colour tag
//   isPrimary    — "true" to mark as main image
//
// Saves to: public/products/[categorySlug]/[slug]-[timestamp].[ext]
// Creates a ProductImage row and returns { ok, image, url }.

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

const MAX_SIZE   = 8 * 1024 * 1024; // 8 MB
const ALLOWED    = new Set(["image/jpeg","image/jpg","image/png","image/webp","image/gif"]);
const EXT_MAP: Record<string,string> = { "image/jpeg":"jpg","image/jpg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif" };

function safeName(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

export const config = { api: { bodyParser: false } };

export async function POST(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let formData: FormData;
  try { formData = await request.formData(); }
  catch { return NextResponse.json({ error: "Invalid multipart form data." }, { status: 400 }); }

  const file         = formData.get("file") as File | null;
  const productId    = String(formData.get("productId") ?? "").trim();
  const categorySlug = String(formData.get("categorySlug") ?? "products").trim().replace(/[^a-z0-9-]/g,"") || "products";
  const altTextRaw   = String(formData.get("altText") ?? "").trim().slice(0, 200);
  const colorRaw     = String(formData.get("color") ?? "").trim().slice(0, 100);
  const isPrimary    = formData.get("isPrimary") === "true";

  // Validate file
  if (!file || file.size === 0) return NextResponse.json({ error: "No file provided." }, { status: 422 });
  if (!ALLOWED.has(file.type))  return NextResponse.json({ error: "Only JPG, PNG, WebP and GIF are allowed." }, { status: 422 });
  if (file.size > MAX_SIZE)     return NextResponse.json({ error: "File is too large (max 8 MB)." }, { status: 422 });

  // Validate product
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, images: { select: { id: true } }, variants: { select: { color: true } } },
  });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  // Build file path: public/products/[categorySlug]/[safeName]-[ts].[ext]
  const ext      = EXT_MAP[file.type] ?? "jpg";
  const baseName = safeName(product.name) || "product";
  const fileName = `${baseName}-${Date.now()}.${ext}`;
  const folder   = path.join(process.cwd(), "public", "products", categorySlug);
  const filePath = path.join(folder, fileName);
  const publicUrl = `/products/${categorySlug}/${fileName}`;

  // Create folder if it doesn't exist
  await mkdir(folder, { recursive: true });

  // Write file to disk
  const bytes  = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  // Colour tag — must be a real variant colour
  const productColors = new Set(product.variants.map(v => v.color));
  const color = colorRaw && productColors.has(colorRaw) ? colorRaw : null;

  // First image or explicit → mark primary
  const primary = isPrimary || product.images.length === 0;
  if (primary) {
    await db.productImage.updateMany({ where: { productId }, data: { isPrimary: false } });
  }

  const image = await db.productImage.create({
    data: {
      productId,
      url:       publicUrl,
      altText:   altTextRaw || product.name,
      color,
      isPrimary: primary,
      type:      "MODEL",
      sortOrder: product.images.length,
    },
  });

  return NextResponse.json({ ok: true, image, url: publicUrl }, { status: 201 });
}
