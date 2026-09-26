export type Tone = "rose" | "olive" | "blue" | "clay" | "sand" | "plum";
export type Product = { slug: string; name: string; category: string; color: string; fabric: string; price: number; mrp: number; tone: Tone; description: string; sizes: readonly string[] };
export const categories = [
  { slug: "kurtas", name: "Kurtas", description: "Everyday ease in thoughtful silhouettes." },
  { slug: "kurta-sets", name: "Kurta Sets", description: "Considered pairings for every plan." },
  { slug: "suits", name: "Suits", description: "Elegant ensembles with modern ease." },
  { slug: "dresses", name: "Dresses", description: "One-piece dressing with room to move." },
  { slug: "sarees", name: "Sarees", description: "A timeless drape, a fresh perspective." },
  { slug: "lehengas", name: "Lehengas", description: "Celebrate in your own way." },
  { slug: "bottom-wear", name: "Bottom Wear", description: "The foundations of a versatile wardrobe." },
  { slug: "co-ord-sets", name: "Co-ord Sets", description: "Easy pieces made to work together." },
  { slug: "dupattas", name: "Dupattas", description: "A finishing touch with personality." },
] as const;
const styles: Record<string, readonly string[]> = {
  kurtas: ["Straight Kurta", "A-Line Kurta", "Panelled Kurta", "Relaxed Kurta", "Embroidered Kurta", "Everyday Kurta"],
  "kurta-sets": ["Cotton Kurta Set", "Printed Kurta Set", "Three-Piece Set", "Tonal Kurta Set", "Festive Kurta Set", "Linen Blend Set"],
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
export const products: Product[] = categories.flatMap((category, group) => styles[category.slug].map((style, index) => {
  const palette = palettes[(group + index) % palettes.length];
  const slug = `${category.slug}-${palette.color.toLowerCase().replaceAll(" ", "-")}-${style.toLowerCase().replaceAll(" ", "-")}`;
  const price = 899 + ((group * 5 + index * 3) % 12) * 210;
  return {
    slug, name: `${palette.color} ${style}`, category: category.slug, color: palette.color,
    fabric: index % 2 ? "Viscose blend" : "Cotton blend", price, mrp: price + 600 + index * 120,
    tone: palette.tone,
    description: `An original AURELIA concept in ${palette.color.toLowerCase()}. This is a demo product; material, fit, availability and price must be confirmed before sales begin.`,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  };
}));
export const formatPrice = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
export const getProduct = (slug: string) => products.find(product => product.slug === slug);
export const getCategory = (slug: string) => categories.find(category => category.slug === slug);
