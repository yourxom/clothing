import type { Metadata } from "next";
import Link from "next/link";
import { WishlistView } from "@/components/preview-actions";
import { getPreviewProducts } from "@/lib/catalog-reader";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Saved preview styles", description: "Your browser-only AURELIA demo wishlist. Not available to purchase." };
export default async function WishlistPage() {
  const products = await getPreviewProducts();
  return <main id="main-content" className="container shop-page">
    <header className="shop-intro"><span className="eyebrow">Preview only / On this browser</span><h1 className="serif">Saved styles</h1><p>Save ideas from any demo product card or product page. Choose “Preview style” below to see illustrative concept artwork and details without leaving this list. Saved styles are not reservations or products available to purchase.</p></header>
    <WishlistView products={products}/>
    <p className="catalog-more"><Link href="/shop">Explore all demo styles ↗</Link></p>
  </main>;
}
