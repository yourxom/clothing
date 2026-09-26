import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FashionPlaceholder } from "@/components/fashion-placeholder";
import { CatalogCard } from "@/components/catalog-card";
import { formatPrice, getCategory, getProduct, products } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return products.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProduct((await params).slug);
  return { title: product?.name ?? "Product", description: product?.description };
}
export default async function ProductPage({ params }: Props) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  const category = getCategory(product.category);
  const related = products.filter(item => item.category === product.category && item.slug !== product.slug).slice(0,4);
  return <main id="main-content" className="container shop-page">
    <nav className="catalog-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link> <span aria-hidden="true">/</span> <Link href="/shop">Shop</Link> <span aria-hidden="true">/</span> <Link href={`/collections/${product.category}`}>{category?.name}</Link> <span aria-hidden="true">/</span> {product.name}</nav>
    <div className="catalog-detail">
      <div className="catalog-detail-art"><FashionPlaceholder label={`${product.name} illustrative demo image`} tone={product.tone}/><p>Illustrative placeholder · Not a photograph of a real product</p></div>
      <div className="catalog-detail-copy"><span className="eyebrow">AURELIA / The first edit</span><h1 className="serif">{product.name}</h1><p className="catalog-detail-summary">{product.description}</p><div className="catalog-detail-price">{formatPrice(product.price)} <del>{formatPrice(product.mrp)}</del></div><p className="catalog-card-disclaimer">Indicative demo pricing only. No purchase can be made yet.</p><div className="catalog-detail-meta"><div><strong>Colour</strong><span>{product.color}</span></div><div><strong>Fabric concept</strong><span>{product.fabric}</span></div><div><strong>Proposed sizes</strong><span>{product.sizes.join(" · ")}</span></div></div><div className="notice">This is a preview. Availability, fit, care details and delivery information will be added when the catalogue is verified. Checkout is disabled.</div><Link className="button" href={`/collections/${product.category}`}>Explore {category?.name}</Link></div>
    </div>
    <section className="catalog-related"><div className="catalog-heading"><span className="eyebrow">Keep exploring</span><h2 className="serif">More from the edit</h2></div><div className="catalog-grid">{related.map(item => <CatalogCard key={item.slug} product={item}/>)}</div></section>
  </main>;
}
