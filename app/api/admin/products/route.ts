import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { slugify, syncVariants, toneForColor, SIZE_OPTIONS } from "@/lib/product-admin";

const VALID_SIZES = new Set<string>(SIZE_OPTIONS);
// Colours are validated for non-empty string only — custom colours are allowed.
const isValidColor = (c: string) => typeof c === "string" && c.trim().length > 0 && c.trim().length <= 60;

// POST /api/admin/products — create a new product (+ colour×size variants + inventory)
export async function POST(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const b = (body as Record<string, unknown>) ?? {};

  const name = String(b.name ?? "").trim();
  const description = String(b.description ?? "").trim();
  const categorySlug = String(b.categorySlug ?? "").trim();
  const fabric = String(b.fabric ?? "Cotton blend").trim();
  const price = Math.floor(Number(b.price) || 0);   // rupees
  const mrp = Math.floor(Number(b.mrp) || 0);       // rupees
  const published = Boolean(b.published);
  const colors = Array.isArray(b.colors) ? b.colors.map(String).filter(isValidColor).map(c => c.trim()) : [];
  const sizes = Array.isArray(b.sizes) ? b.sizes.map(String).filter(s => VALID_SIZES.has(s)) : [];

  // Validation
  if (name.length < 2) return NextResponse.json({ error: "Product name is required." }, { status: 422 });
  if (description.length < 10) return NextResponse.json({ error: "Description must be at least 10 characters." }, { status: 422 });
  if (price <= 0) return NextResponse.json({ error: "A valid price is required." }, { status: 422 });
  if (mrp && mrp < price) return NextResponse.json({ error: "MRP cannot be lower than the price." }, { status: 422 });
  if (colors.length === 0) return NextResponse.json({ error: "Select at least one colour." }, { status: 422 });
  if (sizes.length === 0) return NextResponse.json({ error: "Select at least one size." }, { status: 422 });

  const category = await db.category.findUnique({ where: { slug: categorySlug }, select: { id: true } });
  if (!category) return NextResponse.json({ error: "Choose a valid category." }, { status: 422 });

  // Unique SKU + slug.
  const count = await db.product.count();
  const sku = `AUR-P-${String(count + 1).padStart(4, "0")}`;
  const slug = slugify(name);
  const primaryColor = colors[0];

  const product = await db.product.create({
    data: {
      sku,
      slug,
      name,
      description,
      categoryId: category.id,
      color: primaryColor,
      tone: toneForColor(primaryColor),
      fabric,
      price: price * 100,           // store as paise
      mrp: (mrp || price) * 100,
      published,
    },
    select: { id: true, sku: true, slug: true },
  });

  await syncVariants(product.id, product.sku, colors, sizes);

  return NextResponse.json({ ok: true, product }, { status: 201 });
}
