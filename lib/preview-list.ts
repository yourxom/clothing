// Browser-only planning lists. Never use this state for inventory, pricing or checkout.
export type BagItem = { slug: string; size: string; color: string; quantity: number };
export type PreviewList = { wishlist: string[]; bag: BagItem[] };
export const emptyPreviewList: PreviewList = { wishlist: [], bag: [] };
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const validSlug = (value: unknown): value is string => typeof value === 'string' && value.length <= 120 && slugPattern.test(value);
const validSize = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 20 && /^[A-Za-z0-9 -]+$/.test(value);
// Colour names contain letters/spaces, e.g. "Earth Rose". Empty allowed for legacy items.
const validColor = (value: unknown): value is string => typeof value === 'string' && value.length <= 40 && /^[A-Za-z0-9 -]*$/.test(value);
const cap = (value: number) => Math.min(10, Math.max(1, value));

export function parsePreviewList(raw: string | null): PreviewList {
  if (!raw || raw.length > 30000) return { wishlist: [], bag: [] };
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null || !('version' in data) || data.version !== 1) return { wishlist: [], bag: [] };
    const wishlist: string[] = [];
    const bag: BagItem[] = [];
    if ('wishlist' in data && Array.isArray(data.wishlist)) for (const slug of data.wishlist.slice(0, 200)) {
      if (validSlug(slug) && !wishlist.includes(slug) && wishlist.length < 100) wishlist.push(slug);
    }
    if ('bag' in data && Array.isArray(data.bag)) for (const item of data.bag.slice(0, 200)) {
      if (typeof item !== 'object' || item === null || !('slug' in item) || !('size' in item) || !('quantity' in item)) continue;
      const { slug, size, quantity } = item;
      const color = ('color' in item ? item.color : "") ?? "";
      if (!validSlug(slug) || !validSize(size) || !validColor(color) || typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity < 1) continue;
      const existing = bag.find(entry => entry.slug === slug && entry.size === size && entry.color === color);
      if (existing) existing.quantity = cap(existing.quantity + quantity);
      else if (bag.length < 100) bag.push({ slug, size, color: String(color), quantity: cap(quantity) });
    }
    return { wishlist, bag };
  } catch { return { wishlist: [], bag: [] }; }
}
export function serializePreviewList(state: PreviewList): string {
  return JSON.stringify({ version: 1, wishlist: state.wishlist, bag: state.bag });
}
export function toggleWishlist(state: PreviewList, slug: string): PreviewList {
  if (!validSlug(slug)) return state;
  return { ...state, wishlist: state.wishlist.includes(slug) ? state.wishlist.filter(entry => entry !== slug) : state.wishlist.length < 100 ? [...state.wishlist, slug] : state.wishlist };
}
export function addToBag(state: PreviewList, slug: string, size: string, color = ""): PreviewList {
  if (!validSlug(slug) || !validSize(size) || !validColor(color)) return state;
  const existing = state.bag.find(item => item.slug === slug && item.size === size && item.color === color);
  if (!existing && state.bag.length >= 100) return state;
  return { ...state, bag: existing ? state.bag.map(item => item === existing ? { ...item, quantity: cap(item.quantity + 1) } : item) : [...state.bag, { slug, size, color, quantity: 1 }] };
}
export function setBagQuantity(state: PreviewList, slug: string, size: string, color: string, quantity: number): PreviewList {
  if (!validSlug(slug) || !validSize(size) || !validColor(color) || !Number.isSafeInteger(quantity) || quantity < 0) return state;
  if (!state.bag.some(item => item.slug === slug && item.size === size && item.color === color)) return state;
  return { ...state, bag: state.bag.filter(item => item.slug !== slug || item.size !== size || item.color !== color || quantity > 0).map(item => item.slug === slug && item.size === size && item.color === color ? { ...item, quantity: cap(quantity) } : item) };
}

// Stored under a different key so existing version-1 bag and wishlist data remain intact.
export function parseComparison(raw: string | null): string[] {
  if (!raw || raw.length > 30000) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object' || !('version' in data) || data.version !== 1 || !('slugs' in data) || !Array.isArray(data.slugs)) return [];
    const slugs: string[] = [];
    for (const slug of data.slugs.slice(0, 100)) {
      if (validSlug(slug) && !slugs.includes(slug)) slugs.push(slug);
      if (slugs.length === 3) break;
    }
    return slugs;
  } catch { return []; }
}
export function serializeComparison(slugs: readonly string[]): string {
  return JSON.stringify({ version: 1, slugs: parseComparison(JSON.stringify({ version: 1, slugs })) });
}
export function toggleComparison(slugs: readonly string[], slug: string): string[] {
  if (!validSlug(slug)) return [...slugs];
  if (slugs.includes(slug)) return slugs.filter(entry => entry !== slug);
  return slugs.length < 3 ? [...slugs, slug] : [...slugs];
}
