// Browser-only planning lists. Never use this state for inventory, pricing or checkout.
export type BagItem = { slug: string; size: string; quantity: number };
export type PreviewList = { wishlist: string[]; bag: BagItem[] };
export const emptyPreviewList: PreviewList = { wishlist: [], bag: [] };
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const validSlug = (value: unknown): value is string => typeof value === 'string' && value.length <= 120 && slugPattern.test(value);
const validSize = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 20 && /^[A-Za-z0-9 -]+$/.test(value);
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
      if (!validSlug(slug) || !validSize(size) || typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity < 1) continue;
      const existing = bag.find(entry => entry.slug === slug && entry.size === size);
      if (existing) existing.quantity = cap(existing.quantity + quantity);
      else if (bag.length < 100) bag.push({ slug, size, quantity: cap(quantity) });
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
export function addToBag(state: PreviewList, slug: string, size: string): PreviewList {
  if (!validSlug(slug) || !validSize(size)) return state;
  const existing = state.bag.find(item => item.slug === slug && item.size === size);
  if (!existing && state.bag.length >= 100) return state;
  return { ...state, bag: existing ? state.bag.map(item => item === existing ? { ...item, quantity: cap(item.quantity + 1) } : item) : [...state.bag, { slug, size, quantity: 1 }] };
}
export function setBagQuantity(state: PreviewList, slug: string, size: string, quantity: number): PreviewList {
  if (!validSlug(slug) || !validSize(size) || !Number.isSafeInteger(quantity)) return state;
  return { ...state, bag: state.bag.filter(item => item.slug !== slug || item.size !== size || quantity > 0).map(item => item.slug === slug && item.size === size ? { ...item, quantity: cap(quantity) } : item) };
}
