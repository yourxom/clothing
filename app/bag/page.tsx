import type { Metadata } from "next";
import Link from "next/link";
import { BagView } from "@/components/preview-actions";
import { getPreviewProducts } from "@/lib/catalog-reader";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Shopping Bag — AURELIA",
  description: "Review the items in your bag and proceed to checkout.",
};

export default async function BagPage() {
  const products = await getPreviewProducts();
  return (
    <main id="main-content" className="container shop-page">
      <nav className="catalog-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span> Bag
      </nav>
      <header className="shop-intro">
        <span className="eyebrow">Your bag</span>
        <h1 className="serif">Shopping bag</h1>
      </header>
      <BagView products={products} />
    </main>
  );
}
