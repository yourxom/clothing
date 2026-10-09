"use client";
import { useState } from "react";
import { FashionPlaceholder } from "./fashion-placeholder";
import type { Tone } from "@/lib/catalog";

/**
 * Content-page image slot (About / Stores / Journal etc.). Renders a real photo
 * when `src` is set AND loads successfully; otherwise falls back to the
 * art-directed placeholder. A missing/broken file shows the placeholder rather
 * than a broken-image icon.
 */
export function StoryMedia({
  src,
  label,
  tone,
  artwork,
  className = "",
}: {
  src?: string | null;
  label: string;
  tone: Tone;
  artwork?: "drape" | "fold" | "petal" | "arch";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={label}
        loading="lazy"
        onError={() => setFailed(true)}
        className={className}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    );
  }
  return <FashionPlaceholder label={label} tone={tone} artwork={artwork} className={className} />;
}
