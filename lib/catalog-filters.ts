import type { Product } from "./catalog";

export type PreviewFilters = { query?: string; category?: string; size?: string; sort?: string; color?: string };

/** Pure, preview-only discovery; never substitutes demo products for a successful empty DB read. */
export function filterPreviewProducts(products: readonly Product[], filters: PreviewFilters): Product[] {
  const query = (filters.query ?? "").trim().toLocaleLowerCase();
  const color = (filters.color ?? "").trim().toLocaleLowerCase();
  const selected = products.filter(product =>
    (!filters.category || product.category === filters.category) &&
    (!filters.size || product.sizes.includes(filters.size)) &&
    (!color || product.color.toLocaleLowerCase() === color) &&
    (!query || [product.name, product.color, product.fabric, product.description].some(value => value.toLocaleLowerCase().includes(query)))
  );
  if (filters.sort === "price-asc") return selected.sort((a, b) => a.price - b.price);
  if (filters.sort === "price-desc") return selected.sort((a, b) => b.price - a.price);
  if (filters.sort === "name") return selected.sort((a, b) => a.name.localeCompare(b.name));
  return selected;
}

/** Bounded typeahead over the same unpublished catalogue supplied by the caller. */
export function suggestPreviewProducts(products: readonly Product[], query: string, limit = 5): Product[] {
  if (!query.trim() || !Number.isFinite(limit) || limit <= 0) return [];
  return filterPreviewProducts(products, { query: query.slice(0, 100) }).slice(0, Math.min(Math.floor(limit), 10));
}
