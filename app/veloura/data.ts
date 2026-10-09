// View-model data + adapters for the AURELIA landing page.
// Real products come from the DB (see lib/catalog-reader) and are mapped into
// the card shape below. Static bits (hero slides, occasions, testimonials) that
// have no DB source are defined here with links into the real store routes.
import type { Product } from "@/lib/catalog";

export type Pose = "portrait" | "seated" | "walk" | "profile" | "detail" | "duo";

export type VProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  tone: string;
  pose: Pose;
  colors: { name: string; hex: string }[]; // all real colour options for the product
  image?: string | null; // real product photo if uploaded, else null → illustration
  badge?: string;
  href: string;
};

export type VCategory = {
  id: string;
  name: string;
  blurb: string;
  tone: string;
  pose: Pose;
  href: string;
  /** Real category photo. When set, shown instead of the illustration. Put files in public/. */
  image?: string | null;
};

export type VOccasion = {
  id: string;
  name: string;
  blurb: string;
  tone: string;
  pose: Pose;
  href: string;
  /** Real occasion photo. When set, shown instead of the illustration. Put files in public/. */
  image?: string | null;
};

export type VTestimonial = {
  id: string;
  quote: string;
  title?: string;
  name: string;
  location: string;
  rating: number; // 1–5
  date: string;   // display date
  tone: string;
};

export type VSlide = {
  eyebrow: string;
  titleTop: string;
  titleAccent: string;
  desc: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  tone: string;
  pose: Pose;
  /**
   * Full-bleed hero photo URL. When set, the slide renders as a single
   * edge-to-edge background photograph with the text overlaid on a soft scrim.
   * When null/empty, the slide falls back to the art-directed illustration.
   * Paste a portrait (4:5 or taller) image URL here.
   */
  image?: string | null;
};

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

// Rotate poses so a grid of real products looks visually varied.
const POSES: Pose[] = ["portrait", "profile", "seated", "walk", "profile", "portrait"];

/** Maps a real catalogue Product into the landing-page card view-model. */
export function toVProduct(p: Product, index: number): VProduct {
  // Deterministic pseudo-rating so cards look real without a rating column.
  const rating = 4.3 + ((index * 7) % 7) / 10; // 4.3–4.9
  const reviews = 60 + ((index * 37) % 190);
  const hasDiscount = p.mrp > p.price;
  return {
    id: p.slug,
    slug: p.slug,
    name: p.name,
    price: p.price,
    originalPrice: hasDiscount ? p.mrp : undefined,
    rating: Math.round(rating * 10) / 10,
    reviews,
    tone: p.tone,
    pose: POSES[index % POSES.length],
    // Real colour options straight from the product's variants.
    colors: p.colors.map(c => ({ name: c.name, hex: c.hex })),
    image: p.image ?? null,
    badge: hasDiscount ? `${Math.round((1 - p.price / p.mrp) * 100)}% Off` : index < 2 ? "New" : undefined,
    href: `/products/${p.slug}`,
  };
}

export const heroSlides: VSlide[] = [
  {
    eyebrow: "New Collection",
    titleTop: "NEW SEASON,",
    titleAccent: "NEW YOU",
    desc: "Discover stylish outfits for every mood, every moment and every version of you.",
    primary: { label: "Shop New Arrivals", href: "/shop" },
    secondary: { label: "Explore Collection", href: "/collections/kurtas" },
    tone: "rose",
    pose: "portrait",
    image: "/hero/new-season.png", // full-bleed hero photo (public/hero/new-season.png)
  },
  {
    eyebrow: "Festive Edit",
    titleTop: "DRESSED FOR",
    titleAccent: "THE MOMENT",
    desc: "Occasion-ready silhouettes in flowing fabrics — made to be remembered.",
    primary: { label: "Shop Festive", href: "/shop?occasion=festive" },
    secondary: { label: "View Lehengas", href: "/collections/lehengas" },
    tone: "plum",
    pose: "seated",
    image: "/hero/festive.png", // full-bleed hero photo (public/hero/festive.png)
  },
  {
    eyebrow: "Everyday Luxe",
    titleTop: "SOFT DAYS,",
    titleAccent: "EASY STYLE",
    desc: "Elevated basics and co-ords designed to move with your day, effortlessly.",
    primary: { label: "Shop Co-ords", href: "/collections/co-ord-sets" },
    secondary: { label: "Explore Collection", href: "/shop" },
    tone: "sand",
    pose: "walk",
    image: "/hero/everyday.png", // full-bleed hero photo (public/hero/everyday.png)
  },
];

// Categories map to real collection routes.
export const categories: VCategory[] = [
  { id: "dresses",     name: "Dresses",       blurb: "Elegant styles for every occasion",       tone: "rose",  pose: "portrait", href: "/collections/dresses",    image: "/category/dresses.png" },
  { id: "kurtas",      name: "Kurtas",         blurb: "Everyday ease in thoughtful silhouettes", tone: "sand",  pose: "profile",  href: "/collections/kurtas",     image: "/category/kurtas.png" },
  { id: "tops-shirts", name: "Tops & Shirts",  blurb: "Versatile pieces for every day",          tone: "blue",  pose: "portrait", href: "/collections/tops-shirts", image: "/category/tops-shirts.png" },
  { id: "coords",      name: "Co-ords",        blurb: "Chic sets for effortless style",          tone: "olive", pose: "walk",     href: "/collections/co-ord-sets",image: "/category/coords.png" },
  { id: "sarees",      name: "Sarees",         blurb: "A timeless drape, reimagined",            tone: "plum",  pose: "detail",   href: "/collections/sarees",     image: "/category/sarees.png" },
  { id: "lehengas",    name: "Lehengas",       blurb: "Celebrate in your own way",               tone: "clay",  pose: "profile",  href: "/collections/lehengas",   image: "/category/lehengas.png" },
];

// Occasions map to the real shop occasion filters.
export const occasions: VOccasion[] = [
  { id: "party", name: "Party Wear", blurb: "Make every night special", tone: "plum", pose: "seated", href: "/shop?occasion=wedding", image: "/occasion/party.png" },
  { id: "casual", name: "Casual Wear", blurb: "Comfort meets everyday style", tone: "rose", pose: "walk", href: "/shop?occasion=casual", image: "/occasion/casual.png" },
  { id: "work", name: "Work Wear", blurb: "Polished looks for the office", tone: "sand", pose: "portrait", href: "/shop?occasion=workwear", image: "/occasion/work.png" },
  { id: "festive", name: "Festive Wear", blurb: "Traditional with a modern edge", tone: "clay", pose: "profile", href: "/shop?occasion=festive", image: "/occasion/festive.png" },
];

export const testimonials: VTestimonial[] = [
  { id: "r1", title: "Comfort meets elegance", quote: "Comfort meets elegance in this light and airy fabric. Absolutely love the quality and fit — perfect for any occasion.", name: "Samiksha", location: "Mumbai", rating: 5, date: "Jan 25, 2026", tone: "rose" },
  { id: "r2", title: "Effortlessly stylish", quote: "Soft cotton and charming floral prints make every piece effortlessly stylish. Fast delivery too.", name: "Nishita", location: "Bengaluru", rating: 5, date: "Jan 22, 2026", tone: "sand" },
  { id: "r3", title: "Fresh and breezy", quote: "Fresh and breezy — this piece is perfect for a relaxed, everyday look. The fabric feels premium.", name: "Nayantara", location: "Delhi", rating: 5, date: "Jan 01, 2026", tone: "plum" },
  { id: "r4", title: "Comfort meets quality!", quote: "Perfect balance of comfort and quality — highly recommend. Every piece feels thoughtfully designed.", name: "Laya", location: "Chennai", rating: 4, date: "Nov 18, 2025", tone: "olive" },
];
