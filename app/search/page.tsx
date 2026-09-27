import type { Metadata } from "next";
import { CatalogCard } from "@/components/catalog-card";
import { SearchExperience } from "@/components/search-experience";
import { filterPreviewProducts } from "@/lib/catalog-filters";
import { getPreviewProducts } from "@/lib/catalog-reader";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search the edit", description: "Search the original AURELIA demo catalogue by style, colour and fabric." };
type Props = { searchParams: Promise<{ q?: string | string[] }> };
export default async function SearchPage({ searchParams }: Props) { const params = await searchParams; const query = (typeof params.q === "string" ? params.q : "").slice(0, 100); const products = await getPreviewProducts(); const matches = query.trim() ? filterPreviewProducts(products, { query }) : [];
  return <main id="main-content" className="container shop-page"><header className="shop-intro"><span className="eyebrow">AURELIA / Preview discovery</span><h1 className="serif">Find your next idea.</h1><p>Search original demo concepts. These are not verified products or available for purchase.</p></header><SearchExperience products={products} initialQuery={query}/>{query.trim() ? <><p className="catalog-result-count" role="status">{matches.length} {matches.length === 1 ? "style" : "styles"} match “{query.trim()}”</p>{matches.length ? <div className="catalog-grid">{matches.map(product => <CatalogCard product={product} key={product.slug}/>)}</div> : <p className="notice">No concepts match this search. Try a colour, fabric or a different name.</p>}</> : <p className="notice">Enter a name, colour or fabric to explore the preview edit.</p>}</main>;
}
