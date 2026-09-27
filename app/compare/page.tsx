import type { Metadata } from "next";
import Link from "next/link";
import { ComparisonView } from "@/components/preview-actions";
import { getPreviewProducts } from "@/lib/catalog-reader";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Compare demo styles", description: "Compare up to three original AURELIA fashion concepts. No products are available for purchase." };
export default async function ComparePage() {
  const products = await getPreviewProducts();
  return <main id="main-content" className="container shop-page"><nav className="catalog-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link> <span aria-hidden="true">/</span> <Link href="/shop">Shop</Link> <span aria-hidden="true">/</span> Compare</nav><header className="shop-intro"><span className="eyebrow">The AURELIA edit / Preview</span><h1 className="serif">Compare your ideas.</h1><p>Choose up to three demo concepts in the catalogue to see their current illustrative details together. Selection stays in this browser only.</p></header><ComparisonView products={products}/></main>;
}
