"use client";
import { useState, useEffect } from "react";
import { useProductColor } from "./product-color-context";
import { FashionPlaceholder } from "./fashion-placeholder";
import type { Tone } from "@/lib/catalog";

/** Encodes local path segments so spaces/special chars are valid in img src. Leaves external URLs untouched. */
function safeUrl(src: string): string {
  if (!src.startsWith("/")) return src;
  return src.split("/").map(seg => encodeURIComponent(seg)).join("/");
}

/**
 * Product image gallery with a main photo + thumbnail strip.
 * - Wired to the shared colour context: switching colour resets to
 *   the first image for that colour.
 * - Left/right arrow keyboard navigation.
 * - Touch/swipe support for mobile.
 */
export function ProductImageGallery({
  alt,
  tone,
  images,          // all image URLs for this product (all colours)
  colorImages,     // colour → primary image URL
}: {
  alt: string;
  tone: Tone;
  images?: readonly string[];
  colorImages?: Readonly<Record<string, string>>;
}) {
  const { color } = useProductColor();
  const allImages = images && images.length > 0 ? images : [];

  // When colour changes, jump to the primary image for that colour (or 0).
  const primaryForColor = (color && colorImages?.[color]) || allImages[0] || null;
  const startIndex = primaryForColor ? Math.max(0, allImages.indexOf(primaryForColor)) : 0;

  const [active, setActive] = useState(startIndex);

  // Reset active image when colour changes.
  useEffect(() => {
    setActive(startIndex);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color]);

  // Keyboard navigation.
  useEffect(() => {
    if (allImages.length < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  setActive(i => (i - 1 + allImages.length) % allImages.length);
      if (e.key === "ArrowRight") setActive(i => (i + 1) % allImages.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [allImages.length]);

  // Touch swipe.
  let touchStartX = 0;
  const onTouchStart = (e: React.TouchEvent) => { touchStartX = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (allImages.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (dx >  45) setActive(i => (i - 1 + allImages.length) % allImages.length);
    if (dx < -45) setActive(i => (i + 1) % allImages.length);
  };

  const currentSrc = allImages[active] ?? null;
  const label = color ? `${alt} — ${color}` : alt;

  // No images at all → show placeholder only.
  if (allImages.length === 0) {
    return (
      <div className="pdp-gallery">
        <div className="pdp-gallery__main">
          <FashionPlaceholder label={alt} tone={tone} artwork="arch" />
        </div>
      </div>
    );
  }

  return (
    <div className="pdp-gallery">
      {/* ── Main image ─────────────────────────────────────────── */}
      <div
        className="pdp-gallery__main"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {allImages.length > 1 && (
          <>
            <button
              type="button"
              className="pdp-gallery__arrow pdp-gallery__arrow--prev"
              aria-label="Previous image"
              onClick={() => setActive(i => (i - 1 + allImages.length) % allImages.length)}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              className="pdp-gallery__arrow pdp-gallery__arrow--next"
              aria-label="Next image"
              onClick={() => setActive(i => (i + 1) % allImages.length)}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </>
        )}

        {/* Counter badge */}
        {allImages.length > 1 && (
          <span className="pdp-gallery__counter" aria-live="polite">
            {active + 1} / {allImages.length}
          </span>
        )}

        {currentSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={currentSrc}
            src={safeUrl(currentSrc)}
            alt={`${label} — image ${active + 1}`}
            className="pdp-gallery__img"
            draggable={false}
          />
        ) : (
          <FashionPlaceholder label={alt} tone={tone} artwork="arch" />
        )}
      </div>

      {/* ── Thumbnail strip ────────────────────────────────────── */}
      {allImages.length > 1 && (
        <div className="pdp-gallery__thumbs" role="list" aria-label="Product images">
          {allImages.map((src, i) => (
            <button
              key={src}
              type="button"
              role="listitem"
              className={`pdp-gallery__thumb${i === active ? " pdp-gallery__thumb--active" : ""}`}
              aria-label={`View image ${i + 1}`}
              aria-pressed={i === active}
              onClick={() => setActive(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={safeUrl(src)} alt={`${label} thumbnail ${i + 1}`} draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
