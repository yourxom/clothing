import type { MetadataRoute } from "next";
import { categories } from "@/lib/catalog";
import { articles } from "@/lib/journal";
import { getSiteConfig } from "@/lib/settings";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { siteUrl: BASE } = await getSiteConfig();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,                             lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/shop`,                   lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/journal`,                lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/about`,                  lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/stores`,                 lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/contact`,                lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/search`,                 lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/shipping-and-returns`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/privacy-policy`,         lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/terms-and-conditions`,   lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map(cat => ({
    url: `${BASE}/collections/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const journalRoutes: MetadataRoute.Sitemap = articles.map(article => ({
    url: `${BASE}/journal/${article.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Individual published product pages — DB-driven. Falls back gracefully to no
  // product URLs if the DB is unreachable at build time.
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await db.product.findMany({
      where:  { published: true },
      select: { slug: true, updatedAt: true },
    });
    productRoutes = products.map(p => ({
      url: `${BASE}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    /* DB unavailable at build — ship the sitemap without product URLs */
  }

  return [...staticRoutes, ...categoryRoutes, ...journalRoutes, ...productRoutes];
}
