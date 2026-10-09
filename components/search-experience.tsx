"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/catalog";
import { suggestPreviewProducts } from "@/lib/catalog-filters";

/** Instant local suggestions over the already-loaded unpublished preview; full results stay server-rendered. */
export function SearchExperience({ products, initialQuery = "" }: { products: readonly Product[]; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const suggestions = useMemo(() => suggestPreviewProducts(products, query), [products, query]);
  return <form action="/search" method="get" className="search-experience" role="search" aria-label="Search the collection"><label htmlFor="preview-search">Search styles</label><div className="search-experience-controls"><input id="preview-search" type="search" name="q" maxLength={100} value={query} autoComplete="off" onChange={event => setQuery(event.target.value)} placeholder="Try colour, name or fabric" /><button type="submit">See results</button></div>{query.trim() && <div className="search-suggestions" aria-live="polite"><p>{suggestions.length ? "Suggestions" : "No matching suggestions"}</p>{suggestions.length > 0 && <ul>{suggestions.map(product => <li key={product.slug}><Link href={`/products/${product.slug}`}>{product.name}</Link></li>)}</ul>}</div>}</form>;
}
