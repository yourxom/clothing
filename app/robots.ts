import type { MetadataRoute } from "next";
/** Preview has unverified products and no canonical production hostname; do not expose it to crawlers. */
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", disallow: "/" } }; }
