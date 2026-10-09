import { FashionPlaceholder } from "./fashion-placeholder";
import type { Tone } from "@/lib/catalog";

// Shows a real product photo when a URL is present; otherwise falls back to the
// art-directed placeholder. Keeps the same aspect box either way.
export function ProductMedia({
  src,
  alt,
  tone,
  artwork,
  className = "",
}: {
  src?: string | null;
  alt: string;
  tone: Tone;
  artwork?: "drape" | "fold" | "petal" | "arch";
  className?: string;
}) {
  if (src) {
    // Encode the path so spaces and special chars in filenames are valid URLs.
    // Only encode the path portion — leave external http(s):// URLs untouched.
    const safeSrc = src.startsWith("/")
      ? src.split("/").map(seg => encodeURIComponent(seg)).join("/")
      : src;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={safeSrc}
        alt={alt}
        loading="lazy"
        className={`product-media-img ${className}`}
      />
    );
  }
  return <FashionPlaceholder label={alt} tone={tone} artwork={artwork} className={className} />;
}
