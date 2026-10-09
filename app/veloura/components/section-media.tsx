"use client";
import { useState } from "react";
import { FashionImage } from "./fashion-image";
import type { Pose } from "../data";

/**
 * Renders a real <img> when `src` is set AND loads successfully; otherwise falls
 * back to the art-directed illustration. This means a missing/broken image path
 * (e.g. the file hasn't been added to /public yet) shows the illustration
 * instead of a broken-image icon.
 */
export function SectionMedia({
  src, alt, tone, pose, uid,
}: {
  src?: string | null;
  alt: string;
  tone: string;
  pose: Pose;
  uid: string;
}) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    );
  }
  return <FashionImage tone={tone} pose={pose} uid={uid} alt={alt} />;
}
