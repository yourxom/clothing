import type { Metadata } from "next";
import Link from "next/link";
import { WishlistView } from "@/components/preview-actions";
import { getPreviewProducts } from "@/lib/catalog-reader";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Saved preview styles", description: "Your browser-only AURELIA demo wishlist. Not available to purchase." };
export default async function WishlistPage() {
  const products = await getPreviewProducts();
  return <main id="main-content" className="container shop-page">
    <header className="shop-intro"><span className="eyebrow">Preview only / On this browser</span><h1 className="serif">Saved styles</h1><p>Keep track of ideas you like. This list lives in your browser; it is not an account or a reservation. Products are demo concepts, not available to purchase.</p></header>
    <WishlistView products={products}/>
    <p className="catalog-more"><Link href="/shop">Explore all demo styles ↗</Link></p>
  </main>;
}
