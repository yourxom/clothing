import type { Metadata } from "next";
import Link from "next/link";
import { ComparisonView } from "@/components/preview-actions";
import { getPreviewProducts } from "@/lib/catalog-reader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compare Styles — AURELIA",
  description: "Compare up to three AURELIA styles side by side — colour, fabric, sizing and pricing.",
};

export default async function ComparePage() {
  const products = await getPreviewProducts();

  return (
    <main id="main-content" className="container shop-page">
      <nav className="catalog-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span> Compare
      </nav>
      <div className="shop-intro">
        <span className="eyebrow">Side by side</span>
        <h1 className="serif">Compare styles.</h1>
        <p>Compare up to three styles by colour, fabric, sizing, and price.</p>
      </div>

      <ComparisonView products={products} />

      <p className="catalog-more">
        <Link href="/shop">Browse the collection ↗</Link>
      </p>
    </main>
  );
}
