import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogCard } from "@/components/catalog-card";
import { ComparisonNotice } from "@/components/preview-actions";
import { categories, getCategory } from "@/lib/catalog";
import { filterPreviewProducts } from "@/lib/catalog-filters";
import { getPreviewProducts } from "@/lib/catalog-reader";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string | string[]; size?: string | string[]; sort?: string | string[] }> };
const first = (value: string | string[] | undefined) => typeof value === "string" ? value : "";
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = getCategory((await params).slug);
  return { title: category?.name ?? "Collection", description: category?.description };
}
export default async function CollectionPage({ params, searchParams }: Props) {
  const category = getCategory((await params).slug);
  if (!category) notFound();
  const selected = (await getPreviewProducts()).filter(product => product.category === category.slug);
  const filters = await searchParams;
  const query = first(filters.q).slice(0, 100);
  const size = first(filters.size);
  const sort = first(filters.sort);
  const sizes = Array.from(new Set(selected.flatMap(product => product.sizes))).sort((a, b) => {
    const order = ["XS", "S", "M", "L", "XL", "XXL"];
    const ai = order.indexOf(a), bi = order.indexOf(b);
    return (ai < 0 ? order.length : ai) - (bi < 0 ? order.length : bi) || a.localeCompare(b);
  });
  const selectedSize = sizes.includes(size) ? size : "";
  const selectedSort = ["price-asc", "price-desc", "name"].includes(sort) ? sort : "";
  const visible = filterPreviewProducts(selected, { category: category.slug, query, size: selectedSize, sort: selectedSort });
  return <main id="main-content" className="container shop-page">
    <nav aria-label="Breadcrumb" className="catalog-breadcrumb"><Link href="/">Home</Link> <span aria-hidden="true">/</span> <Link href="/shop">Shop</Link> <span aria-hidden="true">/</span> {category.name}</nav>
    <header className="shop-intro"><span className="eyebrow">The AURELIA edit / {category.name}</span><h1 className="serif">{category.name}</h1><p>{category.description} Discover {selected.length} original demo styles. These pieces are previews only, not yet available to purchase.</p></header>
    <nav className="catalog-category-nav" aria-label="Browse other categories">{categories.map(item => <Link key={item.slug} aria-current={item.slug === category.slug ? "page" : undefined} href={`/collections/${item.slug}`}>{item.name} <span aria-hidden="true">↗</span></Link>)}</nav>
    <div className="catalog-heading"><span className="eyebrow">A closer look</span><h2 className="serif">Explore the edit</h2><p>{selected.length} demo styles</p></div>
    <form action={`/collections/${category.slug}`} method="get" className="catalog-filters catalog-filters-collection" role="search" aria-label={`Filter ${category.name} demo styles`}>
      <div className="catalog-filter-field catalog-filter-search"><label htmlFor="collection-query">Search styles</label><input id="collection-query" name="q" type="search" maxLength={100} defaultValue={query} placeholder="Name, colour or fabric" /></div>
      <div className="catalog-filter-field"><label htmlFor="collection-size">Proposed size</label><select id="collection-size" name="size" defaultValue={selectedSize}><option value="">All sizes</option>{sizes.map(item => <option key={item} value={item}>{item}</option>)}</select></div>
      <div className="catalog-filter-field"><label htmlFor="collection-sort">Sort by</label><select id="collection-sort" name="sort" defaultValue={selectedSort}><option value="">Catalogue order</option><option value="price-asc">Indicative price: low to high</option><option value="price-desc">Indicative price: high to low</option><option value="name">Name A–Z</option></select></div>
      <div className="catalog-filter-actions"><button type="submit">Apply filters</button><Link href={`/collections/${category.slug}`}>Clear</Link></div>
    </form>
    <p className="catalog-result-count" role="status">Showing {visible.length} of {selected.length} demo styles</p><ComparisonNotice />
    {visible.length ? <div className="catalog-grid">{visible.map(product => <CatalogCard key={product.slug} product={product}/>)}</div> : <p className="notice">{selected.length ? "No demo styles match these filters. Clear filters to browse this collection." : "No preview concepts in this collection yet."}</p>}
  </main>;
}
