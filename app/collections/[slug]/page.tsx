import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogCard } from "@/components/catalog-card";
import { categories, getCategory, products } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return categories.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = getCategory((await params).slug);
  return { title: category?.name ?? "Collection", description: category?.description };
}
export default async function CollectionPage({ params }: Props) {
  const category = getCategory((await params).slug);
  if (!category) notFound();
  const selected = products.filter(product => product.category === category.slug);
  return <main id="main-content" className="container shop-page">
    <nav aria-label="Breadcrumb" className="catalog-breadcrumb"><Link href="/">Home</Link> <span aria-hidden="true">/</span> <Link href="/shop">Shop</Link> <span aria-hidden="true">/</span> {category.name}</nav>
    <header className="shop-intro"><span className="eyebrow">The AURELIA edit / {category.name}</span><h1 className="serif">{category.name}</h1><p>{category.description} Discover {selected.length} original demo styles. These pieces are previews only, not yet available to purchase.</p></header>
    <nav className="catalog-category-nav" aria-label="Browse other categories">{categories.map(item => <Link key={item.slug} aria-current={item.slug === category.slug ? "page" : undefined} href={`/collections/${item.slug}`}>{item.name} <span aria-hidden="true">↗</span></Link>)}</nav>
    <div className="catalog-heading"><span className="eyebrow">A closer look</span><h2 className="serif">Explore the edit</h2><p>{selected.length} demo styles</p></div>
    <div className="catalog-grid">{selected.map(product => <CatalogCard key={product.slug} product={product}/>)}</div>
  </main>;
}
