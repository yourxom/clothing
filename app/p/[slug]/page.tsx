import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getPreviewProducts } from "@/lib/catalog-reader";
import { getSiteConfig } from "@/lib/settings";
import { absoluteImageUrl } from "@/lib/catalog";

// Short link redirect: /p/<slug> -> /products/<slug>
// Used for compact URLs in WhatsApp messages, SMS, etc. where a long
// /products/<slug> link would be unwieldy to read.
//
// IMPORTANT: this route still renders full Open Graph metadata (including
// the product photo) even though it redirects. Link-preview crawlers used by
// WhatsApp, Facebook, iMessage, etc. read the <head> of the response at the
// shared URL itself — most do NOT follow redirects before generating the
// preview card. Human visitors get sent on to the canonical product page.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const products = await getPreviewProducts();
  const product  = products.find(p => p.slug === slug);
  if (!product) return { title: "Product not found" };
  const { siteUrl } = await getSiteConfig();
  const image = absoluteImageUrl(siteUrl, product.image);
  return {
    title:       product.name,
    description: product.description,
    openGraph: {
      title:       `${product.name} | AURELIA`,
      description: product.description,
      url:         `${siteUrl}/p/${product.slug}`,
      ...(image ? { images: [{ url: image, width: 1200, height: 1500, alt: product.name }] } : {}),
    },
    ...(image ? { twitter: { card: "summary_large_image", images: [image] } } : {}),
  };
}

export default async function ShortProductLink({ params }: Props) {
  const { slug } = await params;
  const products = await getPreviewProducts();
  const exists = products.some(p => p.slug === slug);
  if (!exists) notFound();
  redirect(`/products/${slug}`);
}
