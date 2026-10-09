import type { MetadataRoute } from "next";
import { getSiteConfig } from "@/lib/settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { siteUrl: BASE } = await getSiteConfig();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/bag", "/wishlist", "/account", "/p/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
