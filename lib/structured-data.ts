// JSON-LD structured data builders for SEO. Rendered via <script type="application/ld+json">.
// Keeping these centralized ensures every page emits consistent, valid schema.org markup.

// Fallback origin used only when a caller doesn't pass one. Real value comes
// from admin settings via getSiteConfig() (see callers).
const FALLBACK_BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-domain.example";

/** Organization schema — rendered once in the root layout. */
export function organizationSchema(base: string = FALLBACK_BASE, email?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${base}/#organization`,
    name: "AURELIA",
    url: base,
    logo: `${base}/icon.svg`,
    description:
      "AURELIA is a contemporary Indian fashion label offering kurtas, kurta sets, suits, sarees, lehengas and co-ords designed for everyday life and celebration.",
    ...(email ? { email } : {}),
    address: {
      "@type": "PostalAddress",
      addressCountry: "IN",
    },
    sameAs: [
      "https://www.instagram.com/aurelia",
      "https://www.facebook.com/aurelia",
    ],
  };
}

/** WebSite schema with sitelinks search box — rendered once in the root layout. */
export function webSiteSchema(base: string = FALLBACK_BASE) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${base}/#website`,
    url: base,
    name: "AURELIA",
    publisher: { "@id": `${base}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${base}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export type Crumb = { name: string; path: string };

/** BreadcrumbList schema for a given trail of crumbs (path is relative, e.g. "/shop"). */
export function breadcrumbSchema(crumbs: Crumb[], base: string = FALLBACK_BASE) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${base}${crumb.path}`,
    })),
  };
}

/** Product schema for a product detail page. */
export function productSchema(input: {
  name: string;
  description: string;
  slug: string;
  price: number;
  mrp?: number;
  color?: string;
  inStock?: boolean;
}, base: string = FALLBACK_BASE) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    brand: { "@type": "Brand", name: "AURELIA" },
    color: input.color,
    url: `${base}/products/${input.slug}`,
    offers: {
      "@type": "Offer",
      url: `${base}/products/${input.slug}`,
      priceCurrency: "INR",
      price: input.price,
      availability: input.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@id": `${base}/#organization` },
    },
  };
}
