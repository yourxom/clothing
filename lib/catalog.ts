export type Tone = "rose" | "olive" | "blue" | "clay" | "sand" | "plum";
export type ColorOption = { name: string; hex: string; tone: Tone };
export type Product = { slug: string; name: string; category: string; color: string; fabric: string; price: number; mrp: number; tone: Tone; description: string; sizes: readonly string[]; colors: readonly ColorOption[]; image?: string | null; images?: readonly string[]; colorImages?: Readonly<Record<string, string>> };

/**
 * Resolves a product image into an absolute URL for use in Open Graph / Twitter
 * card tags (which require a fully-qualified URL, not a relative path).
 * Product images may be stored either as a relative path ("/products/..")
 * or as an already-absolute URL (e.g. a CDN link) — only prefix when relative.
 */
export function absoluteImageUrl(siteUrl: string, image?: string | null): string | undefined {
  if (!image) return undefined;
  return /^https?:\/\//i.test(image) ? image : `${siteUrl}${image}`;
}

// Colour name → swatch hex + tone.
// Every name here matches exactly the 'color' and 'colors' fields in prisma/seed.cjs.
// Source of truth for all swatch rendering across the storefront.
export const COLOR_META: Record<string, { hex: string; tone: Tone }> = {

  // ── Neutrals & Whites ────────────────────────────────────────
  "White":            { hex: "#F5F0E8", tone: "sand"  },  // warm off-white
  "Ivory":            { hex: "#EDE0C0", tone: "sand"  },  // classic ivory
  "Warm Ivory":       { hex: "#E8D5B5", tone: "sand"  },  // slightly warmer
  "Cream":            { hex: "#E8D9B8", tone: "sand"  },  // creamy neutral
  "Beige":            { hex: "#CDB99A", tone: "sand"  },  // light tan beige
  "Charcoal":         { hex: "#3C3C3C", tone: "plum"  },  // dark grey
  "Black":            { hex: "#1A1818", tone: "plum"  },  // near-black

  // ── Earth & Warm Neutrals ────────────────────────────────────
  "Earth Rose":       { hex: "#C08070", tone: "rose"  },  // dusty rose-brown
  "Old Rose":         { hex: "#B87070", tone: "rose"  },  // muted antique rose
  "Dusty Rose":       { hex: "#C49080", tone: "rose"  },  // soft dusty rose
  "Dusty Pink":       { hex: "#D4A8A0", tone: "rose"  },  // pale dusty pink
  "Blush Pink":       { hex: "#E8B8B8", tone: "rose"  },  // soft blush
  "Peach":            { hex: "#E8B090", tone: "sand"  },  // warm peach
  "Caramel":          { hex: "#C08840", tone: "clay"  },  // golden caramel

  // ── Reds, Oranges & Corals ───────────────────────────────────
  "Rust":             { hex: "#B04818", tone: "clay"  },  // warm burnt rust
  "Terracotta":       { hex: "#C06840", tone: "clay"  },  // muted terracotta
  "Coral":            { hex: "#E06050", tone: "clay"  },  // true coral-red
  "Orange":           { hex: "#D85820", tone: "clay"  },  // vivid orange
  "Burnt Orange":     { hex: "#C04818", tone: "clay"  },  // deep burnt orange
  "Hot Pink":         { hex: "#D81868", tone: "rose"  },  // vivid hot pink
  "Magenta":          { hex: "#C01880", tone: "plum"  },  // rich magenta

  // ── Pinks & Purples ──────────────────────────────────────────
  "Maroon":           { hex: "#680828", tone: "clay"  },  // deep maroon
  "Burgundy":         { hex: "#721830", tone: "plum"  },  // classic burgundy
  "Wine":             { hex: "#601838", tone: "plum"  },  // deep wine red
  "Deep Wine":        { hex: "#400818", tone: "plum"  },  // very dark wine
  "Soft Plum":        { hex: "#907080", tone: "plum"  },  // muted plum-mauve
  "Lavender":         { hex: "#C0B0D8", tone: "plum"  },  // soft lavender
  "Dusty Lavender":   { hex: "#A898C0", tone: "plum"  },  // muted dusty lavender

  // ── Yellows & Golds ──────────────────────────────────────────
  "Mustard":          { hex: "#C89020", tone: "sand"  },  // deep golden mustard
  "Gold":             { hex: "#C8981A", tone: "sand"  },  // warm gold
  "Lemon Yellow":     { hex: "#E8D840", tone: "sand"  },  // bright lemon
  "Neon Yellow":      { hex: "#D0E000", tone: "sand"  },  // electric yellow

  // ── Greens ───────────────────────────────────────────────────
  "Olive":            { hex: "#807848", tone: "olive" },  // muted olive
  "Sage":             { hex: "#88A878", tone: "olive" },  // soft sage
  "Sage Green":       { hex: "#88A878", tone: "olive" },  // same hue, explicit
  "Forest Green":     { hex: "#285038", tone: "olive" },  // deep forest
  "Emerald":          { hex: "#187848", tone: "olive" },  // jewel emerald
  "Emerald Green":    { hex: "#187848", tone: "olive" },  // same hue, explicit
  "Mint":             { hex: "#A0D8C0", tone: "blue"  },  // cool mint

  // ── Blues & Teals ────────────────────────────────────────────
  "Teal":             { hex: "#207878", tone: "blue"  },  // deep teal
  "Turquoise":        { hex: "#30B8B0", tone: "blue"  },  // bright turquoise
  "Seafoam":          { hex: "#88C8B8", tone: "blue"  },  // seafoam green-blue
  "Indigo":           { hex: "#303488", tone: "blue"  },  // deep indigo
  "Navy":             { hex: "#182040", tone: "blue"  },  // rich navy
  "Navy Blue":        { hex: "#182040", tone: "blue"  },  // same hue, explicit
  "Cobalt Blue":      { hex: "#1850A8", tone: "blue"  },  // vivid cobalt
  "Dusty Blue":       { hex: "#7090A8", tone: "blue"  },  // muted dusty blue
  "Slate Blue":       { hex: "#6070A0", tone: "blue"  },  // grey-blue slate
  "Powder Blue":      { hex: "#A8C0D8", tone: "blue"  },  // pale powder blue
};
export const colorMeta = (name: string): ColorOption => {
  const meta = COLOR_META[name] ?? { hex: "#C98A80", tone: "rose" as Tone };
  return { name, hex: meta.hex, tone: meta.tone };
};
export const categories = [
  { slug: "kurtas",      name: "Kurtas",       description: "Everyday ease in thoughtful silhouettes." },
  { slug: "kurta-sets",  name: "Kurta Sets",   description: "Considered pairings for every plan." },
  { slug: "tops-shirts", name: "Tops & Shirts", description: "Standalone tops and shirts for every occasion." },
  { slug: "suits",       name: "Suits",        description: "Elegant ensembles with modern ease." },
  { slug: "dresses",     name: "Dresses",      description: "One-piece dressing with room to move." },
  { slug: "sarees",      name: "Sarees",       description: "A timeless drape, a fresh perspective." },
  { slug: "lehengas",    name: "Lehengas",     description: "Celebrate in your own way." },
  { slug: "bottom-wear", name: "Bottom Wear",  description: "The foundations of a versatile wardrobe." },
  { slug: "co-ord-sets", name: "Co-ord Sets",  description: "Easy pieces made to work together." },
  { slug: "dupattas",    name: "Dupattas",     description: "A finishing touch with personality." },
] as const;
const styles: Record<string, readonly string[]> = {
  kurtas: ["Straight Kurta", "A-Line Kurta", "Panelled Kurta", "Relaxed Kurta", "Embroidered Kurta", "Everyday Kurta"],
  "kurta-sets": ["Cotton Kurta Set", "Printed Kurta Set", "Three-Piece Set", "Tonal Kurta Set", "Festive Kurta Set", "Linen Blend Set"],
  "tops-shirts": ["Embroidered Top", "Oversized Shirt", "Crop Top", "Peplum Top", "Pintuck Shirt", "Kaftan Top"],
  suits: ["Soft Tailored Suit", "Chanderi-Inspired Suit", "Tonal Suit Set", "Embroidered Suit", "Classic Suit", "Evening Suit"],
  dresses: ["Midi Dress", "Wrap Dress", "Tiered Dress", "Shirt Dress", "Pleated Dress", "Maxi Dress"],
  sarees: ["Lightweight Saree", "Textured Saree", "Printed Saree", "Evening Saree", "Everyday Saree", "Draped Saree"],
  lehengas: ["Festive Lehenga", "Fluid Lehenga", "Embroidered Lehenga", "Tonal Lehenga", "Celebration Lehenga", "Classic Lehenga"],
  "bottom-wear": ["Wide-Leg Trousers", "Straight Pants", "Relaxed Palazzos", "Tapered Pants", "Cotton Trousers", "Everyday Pants"],
  "co-ord-sets": ["Relaxed Co-ord Set", "Printed Co-ord Set", "Summer Co-ord Set", "Tailored Co-ord Set", "Weekend Co-ord Set", "Evening Co-ord Set"],
  dupattas: ["Textured Dupatta", "Printed Dupatta", "Soft Cotton Dupatta", "Occasion Dupatta", "Lightweight Dupatta", "Bordered Dupatta"],
};
const palettes = [
  { color: "Earth Rose", tone: "rose" }, { color: "Olive", tone: "olive" },
  { color: "Dusty Blue", tone: "blue" }, { color: "Terracotta", tone: "clay" },
  { color: "Warm Ivory", tone: "sand" }, { color: "Soft Plum", tone: "plum" },
] as const;

/**
 * Builds a product name in the convention real Indian ethnic-wear sites use
 * (Fabindia, Libas, W): "[Colour] [Fabric] [Style]", e.g.
 *   "Earth Rose Cotton Blend Straight Kurta"
 *   "Dusty Blue Viscose Printed Saree"
 * The fabric word is dropped when the style already names a fabric (Cotton/Linen)
 * to avoid redundancy like "Cotton Blend Cotton Kurta Set".
 */
export function productName(_categorySlug: string, style: string, color: string, fabric = "Cotton blend"): string {
  const styleMentionsFabric = /\b(cotton|linen|silk|chanderi|viscose)\b/i.test(style);
  // Shorten fabric for a name ("Viscose blend" → "Viscose", "Cotton blend" → "Cotton").
  const fabricWord = fabric.replace(/\s*blend$/i, "").trim();
  const parts = [color, styleMentionsFabric ? "" : fabricWord, style].filter(Boolean);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}
// Category-specific marketing copy. Builds authentic product descriptions from
// the piece's fabric, colour and style rather than a single templated string.
const categoryCopy: Record<string, (color: string, fabric: string, style: string) => string> = {
  kurtas: (c, f, s) => `A ${s.toLowerCase()} cut in soft ${f.toLowerCase()} and finished in ${c.toLowerCase()}. Breathable, easy to layer and made to move with you from a morning meeting to an evening out.`,
  "kurta-sets": (c, f, s) => `Our ${s.toLowerCase()} pairs a relaxed ${c.toLowerCase()} kurta with coordinated bottoms in the same ${f.toLowerCase()}. A put-together look with none of the effort — just add your favourite juttis.`,
  suits: (c, f, s) => `A ${s.toLowerCase()} in fluid ${f.toLowerCase()}, coloured in a considered ${c.toLowerCase()}. Tailored for comfort with a drape that carries you gracefully through celebrations and long days alike.`,
  dresses: (c, f, s) => `A ${s.toLowerCase()} in ${c.toLowerCase()}, cut from ${f.toLowerCase()} that skims rather than clings. One-piece dressing that feels effortless yet considered — throw it on and go.`,
  sarees: (c, f, s) => `A lightweight ${s.toLowerCase()} in ${c.toLowerCase()}, woven in ${f.toLowerCase()} that drapes beautifully and stays comfortable all day. A timeless six yards, reimagined for the way you live now.`,
  lehengas: (c, f, s) => `A ${s.toLowerCase()} in rich ${c.toLowerCase()}, crafted in ${f.toLowerCase()} with a flattering flare. Made for the moments you want to remember — weddings, festivals and every celebration in between.`,
  "bottom-wear": (c, f, s) => `${s} in ${c.toLowerCase()}, cut from durable ${f.toLowerCase()} with a comfortable rise. A versatile foundation piece that pairs with everything already in your wardrobe.`,
  "co-ord-sets": (c, f, s) => `A ${s.toLowerCase()} in ${c.toLowerCase()} ${f.toLowerCase()} — wear the pieces together for an instant outfit, or split them to mix into the rest of your wardrobe. Effortless dressing, sorted.`,
  dupattas: (c, f, s) => `A ${s.toLowerCase()} in ${c.toLowerCase()}, finished in soft ${f.toLowerCase()} with a gentle drape. The finishing touch that lifts a plain kurta or suit into something special.`,
  "tops-shirts": (c, f, s) => `A ${s.toLowerCase()} in ${c.toLowerCase()}, crafted in breathable ${f.toLowerCase()}. Versatile and easy to style — wear it with palazzos, jeans, or a skirt for a pulled-together look without the effort.`,
};

const buildDescription = (categorySlug: string, color: string, fabric: string, style: string) =>
  (categoryCopy[categorySlug] ??
    ((c: string, f: string, s: string) => `A ${s.toLowerCase()} in ${c.toLowerCase()}, crafted in ${f.toLowerCase()} for everyday comfort and considered style.`)
  )(color, fabric, style);

// 3 colour options for the demo fallback — own colour first, then two more.
// Mirrors prisma/seed.cjs colorOptionsFor().
function demoColorOptions(ownColor: string, seed: number): ColorOption[] {
  const names = palettes.map(p => p.color);
  const options = [ownColor];
  let i = seed;
  while (options.length < 3) {
    const candidate = names[(i + 1) % names.length];
    if (!options.includes(candidate)) options.push(candidate);
    i++;
  }
  return options.map(colorMeta);
}

export const products: Product[] = categories.flatMap((category, group) => styles[category.slug].map((style, index) => {
  const palette = palettes[(group + index) % palettes.length];
  const slug = `${category.slug}-${palette.color.toLowerCase().replaceAll(" ", "-")}-${style.toLowerCase().replaceAll(" ", "-")}`;
  const price = 899 + ((group * 5 + index * 3) % 12) * 210;
  const fabric = index % 2 ? "Viscose blend" : "Cotton blend";
  return {
    slug, name: productName(category.slug, style, palette.color, fabric), category: category.slug, color: palette.color,
    fabric, price, mrp: price + 600 + index * 120,
    tone: palette.tone,
    description: buildDescription(category.slug, palette.color, fabric, style),
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: demoColorOptions(palette.color, group + index),
  };
}));
export const formatPrice = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
export const getProduct = (slug: string) => products.find(product => product.slug === slug);
export const getCategory = (slug: string) => categories.find(category => category.slug === slug);
