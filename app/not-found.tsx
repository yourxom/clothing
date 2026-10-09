import type { Metadata } from "next";
import Link from "next/link";
import { StoryMedia } from "@/components/story-media";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page doesn't exist. Explore the AURELIA collection instead.",
};

export default function NotFound() {
  return (
    <main id="main-content" className="not-found-page">
      <div className="container not-found-inner">
        <div className="not-found-copy">
          <span className="eyebrow">404 · Page not found</span>
          <h1 className="serif">Lost in the edit.</h1>
          <p>
            The page you&apos;re looking for doesn&apos;t exist, or may have moved.
            Let&apos;s get you back to something beautiful.
          </p>
          <nav className="not-found-nav" aria-label="Helpful links">
            <Link href="/" className="button">Back to home</Link>
            <Link href="/shop" className="button button-outline">Shop the edit</Link>
          </nav>
          <ul className="not-found-links">
            <li><Link href="/collections/kurtas">Kurtas</Link></li>
            <li><Link href="/collections/dresses">Dresses</Link></li>
            <li><Link href="/collections/sarees">Sarees</Link></li>
            <li><Link href="/collections/lehengas">Lehengas</Link></li>
            <li><Link href="/journal">The journal</Link></li>
            <li><Link href="/contact">Contact us</Link></li>
          </ul>
        </div>
        <div className="not-found-art">
          <StoryMedia src="/editorial/not-found.png" label="404 — page not found" tone="plum" artwork="arch" />
        </div>
      </div>
    </main>
  );
}
