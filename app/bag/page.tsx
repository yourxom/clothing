import type { Metadata } from "next";
import Link from "next/link";
import { BagView } from "@/components/preview-actions";
import { getPreviewProducts } from "@/lib/catalog-reader";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Demo bag", description: "A browser-only planning list; no AURELIA checkout or orders are available." };
export default async function BagPage() {
  const products = await getPreviewProducts();
  return <main id="main-content" className="container shop-page">
    <header className="shop-intro"><span className="eyebrow">Preview only / Not a checkout</span><h1 className="serif">Your demo bag</h1><p>Gather styles and proposed sizes in a browser-only planning list. Choose “Preview style” below to see concept artwork and details. Quantities and the illustrative total do not reserve stock or create an order; no payment is collected.</p></header>
    <BagView products={products}/>
    <p className="catalog-more"><Link href="/shop">Explore all demo styles ↗</Link></p>
  </main>;
}
