import type { Metadata } from "next";
import Link from "next/link";
import { CatalogCard } from "@/components/catalog-card";
import { categories, products } from "@/lib/catalog";
export const metadata: Metadata = { title: "Shop the edit", description: "Browse original AURELIA demo fashion concepts. Products are not available for purchase yet." };
export default function ShopPage() {
  return <main id="main-content" className="container shop-page">
    <div className="shop-intro"><span className="eyebrow">The AURELIA edit / Preview</span><h1 className="serif">A wardrobe for every moment.</h1><p>Explore original fashion concepts while our complete shopping experience is being built. Images, prices and specifications are placeholders; checkout is not yet available.</p></div>
    <nav className="catalog-category-nav" aria-label="Shop by category">{categories.map(category => <Link key={category.slug} href={`/collections/${category.slug}`}>{category.name} <span aria-hidden="true">↗</span></Link>)}</nav>
    <div className="catalog-heading"><span className="eyebrow">The first edit</span><h2 className="serif">Discover the collection</h2><p>{products.length} demo styles</p></div>
    <div className="catalog-grid">{products.slice(0,24).map(product => <CatalogCard product={product} key={product.slug}/>)}</div>
    <p className="catalog-more">Showing 24 of {products.length} concepts. Browse category pages to explore all styles.</p>
  </main>;
}
