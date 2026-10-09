import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import { ProductImageGallery } from "@/components/product-image-gallery";
import { ProductColorProvider } from "@/components/product-color-context";
import { CatalogCard } from "@/components/catalog-card";
import { ProductBuyBox } from "@/components/product-buy-box";
import { TrustBadges } from "@/components/trust-badges";
import { ReviewSection } from "@/components/review-section";
import { StockIndicator, getStockLevel } from "@/components/stock-indicator";
import { NotifyMe } from "@/components/notify-me";
import { TrackView, RecentlyViewedStrip } from "@/components/recently-viewed";
import { ProductWhatsAppButton } from "@/components/product-whatsapp-button";
import { formatPrice, getCategory, absoluteImageUrl } from "@/lib/catalog";
import { getPreviewProducts } from "@/lib/catalog-reader";
import { db } from "@/lib/db";
import { breadcrumbSchema, productSchema as buildProductSchema } from "@/lib/structured-data";
import { getSiteConfig } from "@/lib/settings";

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
      url:         `${siteUrl}/products/${product.slug}`,
      ...(image ? { images: [{ url: image, width: 1200, height: 1500, alt: product.name }] } : {}),
    },
    ...(image ? { twitter: { card: "summary_large_image", images: [image] } } : {}),
  };
}

const careInstructions: Record<string, string[]> = {
  "Cotton blend":  ["Cold hand wash", "Do not bleach", "Low heat iron on reverse", "Dry in shade"],
  "Viscose blend": ["Dry clean recommended", "Do not wring", "Cool iron only", "Store folded"],
};

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const products = await getPreviewProducts();
  const product  = products.find(p => p.slug === slug);
  if (!product) notFound();

  const category = getCategory(product.category);
  const related  = products.filter(p => p.category === product.category && p.slug !== product.slug).slice(0, 4);
  const care     = careInstructions[product.fabric] ?? ["Gentle machine wash cold", "Do not bleach", "Cool iron if needed", "Dry in shade"];

  // Fetch real inventory from DB if available
  const dbProduct = await db.product.findUnique({
    where:   { slug },
    include: { variants: { include: { inventory: true } } },
  }).catch(() => null);

  // Aggregate total inventory across all colour/size variants
  const totalStock = dbProduct?.variants.reduce(
    (sum, v) => sum + (v.inventory?.quantity ?? 0), 0
  ) ?? null;
  const stockLevel = getStockLevel(totalStock);

  // Per-(colour|size) stock matrix — key is "colour|size".
  const variantStock: Record<string, number> = {};
  for (const v of dbProduct?.variants ?? []) {
    variantStock[`${v.color}|${v.size}`] = v.inventory?.quantity ?? 0;
  }

  const knowStock = Object.keys(variantStock).length > 0;
  // Default colour = first colour with any stock, else the first colour. Shared
  // by the colour picker and the product photo so they start in sync.
  const defaultColour =
    product.colors.find(c =>
      product.sizes.some(s => (variantStock[`${c.name}|${s}`] ?? (knowStock ? 0 : 1)) > 0)
    )?.name ?? product.colors[0]?.name ?? "";

  // Slim product list for recently viewed
  const slimProducts = products.map(p => ({
    slug: p.slug,
    name: p.name,
    color: p.color,
    tone: p.tone,
    image: p.image,
    price: p.price,
    mrp: p.mrp,
  }));

  const { siteUrl } = await getSiteConfig();
  const productSchema = buildProductSchema({
    name:        product.name,
    description: product.description,
    slug:        product.slug,
    price:       product.price,
    mrp:         product.mrp,
    color:       product.color,
    inStock:     stockLevel !== "out_of_stock",
  }, siteUrl);

  const crumbSchema = breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: category?.name ?? "Collection", path: `/collections/${product.category}` },
    { name: product.name, path: `/products/${product.slug}` },
  ], siteUrl);

  return (
    <main id="main-content" className="container shop-page">
      {/* Track view in localStorage */}
      <TrackView slug={product.slug} />

      <Script id={`product-schema-${product.slug}`} type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <Script id={`breadcrumb-schema-${product.slug}`} type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbSchema) }} />

      {/* Breadcrumb */}
      <nav className="catalog-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span>
        <Link href="/shop">Shop</Link><span aria-hidden="true">/</span>
        <Link href={`/collections/${product.category}`}>{category?.name}</Link>
        <span aria-hidden="true">/</span>{product.name}
      </nav>

      {/* Product detail — colour selection is shared between the photo and the
          buy box so picking a colour swaps the displayed image. */}
      <ProductColorProvider initialColor={defaultColour}>
      <div className="catalog-detail">
        {/* Art */}
        <div className="catalog-detail-art">
          <ProductImageGallery
            alt={`${product.name} product image`}
            tone={product.tone}
            images={product.images}
            colorImages={product.colorImages}
          />

          {/* WhatsApp product query button — sits directly below the gallery */}
          <ProductWhatsAppButton
            productName={product.name}
            productSlug={product.slug}
            productDescription={product.description}
            siteUrl={siteUrl}
          />
        </div>

        {/* Copy */}
        <div className="catalog-detail-copy">
          <span className="eyebrow">AURELIA / {category?.name}</span>
          <h1 className="serif">{product.name}</h1>

          {/* Stock indicator */}
          <StockIndicator level={stockLevel} />

          {/* Notify-me when out of stock */}
          {stockLevel === "out_of_stock" && (
            <NotifyMe productSlug={product.slug} />
          )}

          <p className="catalog-detail-summary">{product.description}</p>

          <div className="catalog-detail-price">
            {formatPrice(product.price)}
            {product.mrp > product.price && <del>{formatPrice(product.mrp)}</del>}
          </div>

          {/* Fabric spec */}
          <div className="catalog-detail-meta">
            <div><strong>Fabric</strong><span>{product.fabric}</span></div>
            <div><strong>Available in</strong><span>{product.colors.map(c => c.name).join(" · ")}</span></div>
          </div>

          {/* Colour + size picker + add to bag */}
          <ProductBuyBox
            slug={product.slug}
            name={product.name}
            colors={product.colors}
            sizes={product.sizes}
            variantStock={variantStock}
          />

          {/* Care */}
          <details className="product-care">
            <summary>Care &amp; fabric</summary>
            <ul className="product-care-list">
              {care.map(i => <li key={i}>{i}</li>)}
            </ul>
          </details>

          {/* Delivery */}
          <details className="product-care">
            <summary>Delivery &amp; returns</summary>
            <ul className="product-care-list">
              <li>Standard delivery across India: 4–7 business days</li>
              <li>Express delivery (select cities): 1–2 business days</li>
              <li>Free shipping on orders above ₹2,000</li>
              <li>Easy returns within 15 days of delivery</li>
            </ul>
            <Link href="/shipping-and-returns" className="text-link"
              style={{ fontSize: ".74rem", display: "inline-block", marginTop: ".5rem" }}>
              Full shipping &amp; returns policy ↗
            </Link>
          </details>

          <Link className="button" href={`/collections/${product.category}`} style={{ marginTop: "1rem" }}>
            More {category?.name}
          </Link>

          <TrustBadges />
        </div>
      </div>
      </ProductColorProvider>

      {/* Reviews */}
      <ReviewSection productSlug={product.slug} />

      {/* Related */}
      {related.length > 0 && (
        <section className="catalog-related" aria-labelledby="related-heading">
          <div className="catalog-heading">
            <span className="eyebrow">Keep exploring</span>
            <h2 id="related-heading" className="serif">More from the edit</h2>
          </div>
          <div className="catalog-grid">
            {related.map(item => <CatalogCard key={item.slug} product={item} />)}
          </div>
        </section>
      )}

      {/* Recently viewed */}
      <RecentlyViewedStrip currentSlug={product.slug} products={slimProducts} />
    </main>
  );
}
