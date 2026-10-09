import type { Metadata } from "next";
import Link from "next/link";
import { WishlistView } from "@/components/preview-actions";
import { getPreviewProducts } from "@/lib/catalog-reader";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Saved Styles — AURELIA",
  description: "Your saved AURELIA styles.",
};

export default async function WishlistPage() {
  const products = await getPreviewProducts();
  return (
    <main id="main-content" className="container shop-page">
      <nav className="catalog-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span> Saved styles
      </nav>
      <header className="shop-intro">
        <span className="eyebrow">Your wishlist</span>
        <h1 className="serif">Saved styles</h1>
      </header>
      <WishlistView products={products} />
    </main>
  );
}
