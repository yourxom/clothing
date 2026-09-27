import type { MetadataRoute } from "next";
import { categories } from "@/lib/catalog";
import { journalEntries } from "@/lib/editorial";
/** Only use a verified canonical hostname; the preview is disallowed by robots.txt. */
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.SITE_URL;
  if (!origin) return [];
  let base: URL;
  try { base = new URL(origin); } catch { return []; }
  if (base.protocol !== "https:" || base.pathname !== "/" || base.search || base.hash) return [];
  const paths = ["/", "/shop", "/search", "/about", "/journal", "/stores", "/help", "/privacy-policy", "/terms-and-conditions", "/shipping-and-returns", ...categories.map(item => `/collections/${item.slug}`), ...journalEntries.map(item => `/journal/${item.slug}`)];
  return paths.map(path => ({ url: new URL(path, base).toString() }));
}
