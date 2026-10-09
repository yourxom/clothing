import type { Product } from "./catalog";

export type PreviewFilters = {
  query?: string;
  category?: string;
  size?: string;
  sort?: string;
  color?: string;
  occasion?: string;
  sale?: boolean;
};

/** Minimum discount (percentage off MRP) for a product to count as "on sale". */
export const SALE_THRESHOLD = 40;

/** Discount percentage off MRP, rounded. Returns 0 when there's no real markdown. */
export function discountPercent(product: Pick<Product, "price" | "mrp">): number {
  if (!product.mrp || product.mrp <= product.price) return 0;
  return Math.round(((product.mrp - product.price) / product.mrp) * 100);
}

/** Whether a product qualifies for the Sale edit (>= SALE_THRESHOLD off). */
export function isOnSale(product: Pick<Product, "price" | "mrp">): boolean {
  return discountPercent(product) >= SALE_THRESHOLD;
}

/**
 * Occasion → category mapping.
 * Each occasion maps to the categories most relevant to it.
 * This will be replaced with a proper DB tag system in Phase 2.
 */
const occasionCategories: Record<string, readonly string[]> = {
  workwear: ["kurtas", "kurta-sets", "suits", "dresses", "bottom-wear", "co-ord-sets"],
  festive:  ["kurta-sets", "suits", "lehengas", "sarees", "dupattas"],
  wedding:  ["lehengas", "sarees", "suits", "dupattas"],
  casual:   ["kurtas", "dresses", "bottom-wear", "co-ord-sets", "dupattas"],
};

/** Pure, preview-only discovery; never substitutes demo products for a successful empty DB read. */
export function filterPreviewProducts(
  products: readonly Product[],
  filters: PreviewFilters
): Product[] {
  const query   = (filters.query   ?? "").trim().toLocaleLowerCase();
  const color   = (filters.color   ?? "").trim().toLocaleLowerCase();
  const occasion = (filters.occasion ?? "").trim().toLocaleLowerCase();

  // Resolve occasion → allowed category slugs
  const occasionAllowed = occasion ? occasionCategories[occasion] : null;

  const selected = products.filter(product => {
    if (filters.category && product.category !== filters.category) return false;
    if (filters.size && !product.sizes.includes(filters.size)) return false;
    if (color && product.color.toLocaleLowerCase() !== color) return false;
    if (occasionAllowed && !occasionAllowed.includes(product.category)) return false;
    if (filters.sale && !isOnSale(product)) return false;
    if (query && ![product.name, product.color, product.fabric, product.description]
      .some(v => v.toLocaleLowerCase().includes(query))) return false;
    return true;
  });

  if (filters.sort === "price-asc")  return [...selected].sort((a, b) => a.price - b.price);
  if (filters.sort === "price-desc") return [...selected].sort((a, b) => b.price - a.price);
  if (filters.sort === "name")       return [...selected].sort((a, b) => a.name.localeCompare(b.name));
  // "New Arrivals" — the catalogue is generated in category order, so the most
  // recently added styles sit at the end. Reversing surfaces them first.
  if (filters.sort === "newest")     return [...selected].reverse();
  return selected;
}

/** Bounded typeahead over the same unpublished catalogue supplied by the caller. */
export function suggestPreviewProducts(
  products: readonly Product[],
  query: string,
  limit = 5
): Product[] {
  if (!query.trim() || !Number.isFinite(limit) || limit <= 0) return [];
  return filterPreviewProducts(products, { query: query.slice(0, 100) }).slice(
    0, Math.min(Math.floor(limit), 10)
  );
}

/** Returns human-readable label for an occasion slug. */
export function getOccasionLabel(slug: string): string {
  const labels: Record<string, string> = {
    workwear: "Workwear",
    festive:  "Festive",
    wedding:  "Wedding",
    casual:   "Casual",
  };
  return labels[slug] ?? slug;
}

export const OCCASIONS = Object.keys(occasionCategories);
