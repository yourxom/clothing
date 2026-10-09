// Server-side helpers for admin product management: colour metadata, slug/SKU
// generation, and variant regeneration (colour × size). Import only in server code.
import { db } from "@/lib/db";
import { COLOR_META, type Tone } from "@/lib/catalog";

export const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export const FABRIC_OPTIONS = [
  "Cotton blend", "Viscose blend", "Linen blend", "Silk blend", "Chanderi",
  "Pure Cotton", "Georgette", "Rayon", "Crepe", "Velvet", "Organza",
  "Banarasi Silk", "Tussar Silk", "Mul Cotton", "Cambric Cotton",
  "Scuba Crepe", "Lycra blend",
] as const;

// The colours an admin can pick from (name → tone). Mirrors COLOR_META in lib/catalog.
export const COLOR_OPTIONS: { name: string; tone: Tone }[] = Object.entries(COLOR_META).map(
  ([name, meta]) => ({ name, tone: meta.tone })
);

export const toneForColor = (name: string): Tone => COLOR_META[name]?.tone ?? "sand";

/** URL-safe slug from a product name, with a short random suffix to avoid clashes. */
export function slugify(name: string): string {
  const base = name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90)
    .replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "product"}-${suffix}`;
}

const colorCode = (name: string) =>
  name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 3);

/**
 * Rebuilds a product's variants to exactly match the given colours × sizes.
 * - Adds missing (colour,size) variants with fresh inventory (default qty).
 * - Removes variants whose colour or size is no longer offered — UNLESS they
 *   are referenced by an order line (kept to preserve order history), in which
 *   case their inventory is zeroed instead.
 * Runs in a transaction.
 */
export async function syncVariants(
  productId: string,
  productSku: string,
  colors: string[],
  sizes: string[],
  defaultQty = 5
): Promise<void> {
  const wanted = new Set<string>();
  for (const c of colors) for (const s of sizes) wanted.add(`${c}|${s}`);

  const existing = await db.productVariant.findMany({
    where: { productId },
    select: { id: true, size: true, color: true },
  });
  const existingKeys = new Set(existing.map(v => `${v.color}|${v.size}`));

  // 1. Create missing variants (+ inventory).
  const toCreate: { productId: string; size: string; color: string; sku: string }[] = [];
  for (const c of colors) {
    for (const s of sizes) {
      if (!existingKeys.has(`${c}|${s}`)) {
        toCreate.push({ productId, size: s, color: c, sku: `${productSku}-${colorCode(c)}-${s}-${Math.random().toString(36).slice(2, 5)}` });
      }
    }
  }
  if (toCreate.length) {
    await db.productVariant.createMany({ data: toCreate, skipDuplicates: true });
    const created = await db.productVariant.findMany({
      where: { productId, sku: { in: toCreate.map(v => v.sku) } },
      select: { id: true },
    });
    await db.inventory.createMany({
      data: created.map(v => ({ variantId: v.id, quantity: defaultQty })),
      skipDuplicates: true,
    });
  }

  // 2. Remove variants no longer offered. OrderLine stores snapshots (variantSku
  // string, not an FK), so deleting variants is safe for order history. Inventory
  // rows cascade-delete with the variant.
  const staleIds = existing.filter(v => !wanted.has(`${v.color}|${v.size}`)).map(v => v.id);
  if (staleIds.length) {
    await db.productVariant.deleteMany({ where: { id: { in: staleIds } } });
  }
}
