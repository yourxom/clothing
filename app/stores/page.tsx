import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Stores", description: "AURELIA store availability and ways to explore the online preview." };
export default function StoresPage() { return <main id="main-content" className="container shop-page content-page"><span className="eyebrow">Beyond the screen</span><h1 className="serif">Stores</h1><p className="content-lead">There are no verified AURELIA store locations to list yet.</p><p>We will add store addresses, opening hours and directions only after each location is confirmed. No map is shown because an unverified pin could send you to the wrong place.</p><Link className="text-link" href="/shop">Explore the online preview ↗</Link></main>; }
