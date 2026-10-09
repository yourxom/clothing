import { PrismaClient, type Prisma } from "@prisma/client";
import { products as demoProducts, type Product, type Tone, colorMeta } from "@/lib/catalog";

// This module must only be imported by server components. Checkout remains disabled.
type DatabaseProduct = Prisma.ProductGetPayload<{ include: { category: true; variants: true; images: true } }>;
const tones: readonly string[] = ["rose", "olive", "blue", "clay", "sand", "plum"];
const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL"];
let client: PrismaClient | undefined;

const bySizeOrder = (a: string, b: string) => {
  const ai = sizeOrder.indexOf(a), bi = sizeOrder.indexOf(b);
  return (ai < 0 ? sizeOrder.length : ai) - (bi < 0 ? sizeOrder.length : bi) || a.localeCompare(b);
};

export function mapPreviewProduct(product: DatabaseProduct): Product {
  // Distinct sizes + distinct colours across all variants.
  const sizes = [...new Set(product.variants.map(v => v.size))].sort(bySizeOrder);
  const colorNames = [...new Set(product.variants.map(v => v.color))];
  // Put the product's own colour first, then the rest in a stable order.
  colorNames.sort((a, b) => (a === product.color ? -1 : b === product.color ? 1 : a.localeCompare(b)));

  // Colour → representative image URL. For each colour, pick its primary image
  // first, else its lowest sortOrder image. Only images explicitly tagged with a
  // colour contribute here; untagged images stay as generic product photos.
  const sortedImages = product.images
    .slice()
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder);
  const colorImages: Record<string, string> = {};
  for (const img of sortedImages) {
    const c = (img as { color?: string | null }).color;
    if (c && !colorImages[c]) colorImages[c] = img.url;
  }

  return {
    slug: product.slug,
    name: product.name,
    category: product.category.slug,
    color: product.color,
    fabric: product.fabric,
    price: product.price / 100,
    mrp: product.mrp / 100,
    tone: (tones.includes(product.tone) ? product.tone : "sand") as Tone,
    description: product.description,
    sizes,
    colors: colorNames.map(colorMeta),
    image: (product.images.find(i => i.isPrimary) ?? product.images[0])?.url ?? null,
    images: sortedImages.map(i => i.url),
    colorImages,
  };
}

/** Returns published products for the storefront. Falls back to bundled demo only if the DB is offline. */
export async function getPreviewProducts(): Promise<Product[]> {
  if (!process.env.DATABASE_URL) return demoProducts;
  try {
    client ??= new PrismaClient();
    const records = await client.product.findMany({
      where: { published: true },
      include: { category: true, variants: true, images: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { sku: "asc" }],
    });
    // If nothing is published yet, fall back to demo catalogue so the store isn't empty
    if (records.length === 0) return demoProducts;
    return records.map(mapPreviewProduct);
  } catch (error) {
    // Do not disguise invalid credentials, schema drift, or query errors as an empty/healthy database.
    if (typeof error === "object" && error !== null && "code" in error &&
      ["P1001", "P1002", "P1017"].includes(String(error.code))) {
      console.warn("AURELIA preview: MySQL unavailable; using bundled demo catalogue.");
      return demoProducts;
    }
    throw error;
  }
}
