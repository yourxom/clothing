import { PrismaClient, type Prisma } from "@prisma/client";
import { products as demoProducts, type Product, type Tone } from "@/lib/catalog";

// This module must only be imported by server components. Checkout remains disabled.
type DatabaseProduct = Prisma.ProductGetPayload<{ include: { category: true; variants: true } }>;
const tones: readonly string[] = ["rose", "olive", "blue", "clay", "sand", "plum"];
const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL"];
let client: PrismaClient | undefined;

export function mapPreviewProduct(product: DatabaseProduct): Product {
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
    sizes: product.variants.map(variant => variant.size).sort((a, b) => {
      const aIndex = sizeOrder.indexOf(a);
      const bIndex = sizeOrder.indexOf(b);
      return (aIndex < 0 ? sizeOrder.length : aIndex) - (bIndex < 0 ? sizeOrder.length : bIndex) || a.localeCompare(b);
    }),
  };
}

/** Preview concepts only. A successful empty query stays empty; a missing/offline DB uses the bundled demo. */
export async function getPreviewProducts(): Promise<Product[]> {
  if (!process.env.DATABASE_URL) return demoProducts;
  try {
    client ??= new PrismaClient();
    const records = await client.product.findMany({
      where: { published: false },
      include: { category: true, variants: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { sku: "asc" }],
    });
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
