import type { Metadata } from "next";
import Link from "next/link";
import { CatalogCard } from "@/components/catalog-card";
import { categories } from "@/lib/catalog";
import { filterPreviewProducts } from "@/lib/catalog-filters";
import { getPreviewProducts } from "@/lib/catalog-reader";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shop the edit", description: "Browse original AURELIA demo fashion concepts. Products are not available for purchase yet." };
type ShopParams = { q?: string | string[]; category?: string | string[]; size?: string | string[]; sort?: string | string[] };
type Props = { searchParams: Promise<ShopParams> };
const first = (value: string | string[] | undefined) => typeof value === "string" ? value : "";

export default async function ShopPage({ searchParams }: Props) {
  const products = await getPreviewProducts();
  const params = await searchParams;
  const query = first(params.q).slice(0, 100);
  const category = first(params.category);
  const size = first(params.size);
  const sort = first(params.sort);
  const sizes = Array.from(new Set(products.flatMap(product => product.sizes))).sort((a, b) => {
    const order = ["XS", "S", "M", "L", "XL", "XXL"];
    const ai = order.indexOf(a), bi = order.indexOf(b);
    return (ai < 0 ? order.length : ai) - (bi < 0 ? order.length : bi) || a.localeCompare(b);
  });
  const selectedCategory = categories.some(item => item.slug === category) ? category : "";
  const selectedSize = sizes.includes(size) ? size : "";
  const selectedSort = ["price-asc", "price-desc", "name"].includes(sort) ? sort : "";
  const visible = filterPreviewProducts(products, { query, category: selectedCategory, size: selectedSize, sort: selectedSort });
  return <main id="main-content" className="container shop-page">
    <div className="shop-intro"><span className="eyebrow">The AURELIA edit / Preview</span><h1 className="serif">A wardrobe for every moment.</h1><p>Explore original fashion concepts while our complete shopping experience is being built. Images, prices and specifications are placeholders; checkout is not yet available.</p></div>
    <nav className="catalog-category-nav" aria-label="Shop by category">{categories.map(item => <Link key={item.slug} href={`/collections/${item.slug}`}>{item.name} <span aria-hidden="true">↗</span></Link>)}</nav>
    <div className="catalog-heading"><span className="eyebrow">The first edit</span><h2 className="serif">Discover the collection</h2><p>{products.length} demo styles</p></div>
    <form action="/shop" method="get" className="catalog-filters" role="search" aria-label="Filter preview catalogue">
      <div className="catalog-filter-field catalog-filter-search"><label htmlFor="catalog-query">Search styles</label><input id="catalog-query" name="q" type="search" maxLength={100} defaultValue={query} placeholder="Name, colour or fabric" /></div>
      <div className="catalog-filter-field"><label htmlFor="catalog-category">Category</label><select id="catalog-category" name="category" defaultValue={selectedCategory}><option value="">All categories</option>{categories.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></div>
      <div className="catalog-filter-field"><label htmlFor="catalog-size">Proposed size</label><select id="catalog-size" name="size" defaultValue={selectedSize}><option value="">All sizes</option>{sizes.map(item => <option key={item} value={item}>{item}</option>)}</select></div>
      <div className="catalog-filter-field"><label htmlFor="catalog-sort">Sort by</label><select id="catalog-sort" name="sort" defaultValue={selectedSort}><option value="">Catalogue order</option><option value="price-asc">Indicative price: low to high</option><option value="price-desc">Indicative price: high to low</option><option value="name">Name A–Z</option></select></div>
      <div className="catalog-filter-actions"><button type="submit">Apply filters</button><Link href="/shop">Clear</Link></div>
    </form>
    <p className="catalog-result-count" role="status">Showing {visible.length} of {products.length} demo styles</p>
    {visible.length ? <div className="catalog-grid">{visible.map(product => <CatalogCard product={product} key={product.slug}/>)}</div> : <p className="notice">{products.length ? "No demo styles match these filters. Clear filters to browse the full preview." : "Preview concepts are being prepared."}</p>}
    <p className="catalog-more">Preview concepts only. Prices, sizes and product details are unverified; checkout is disabled.</p>
  </main>;
}
