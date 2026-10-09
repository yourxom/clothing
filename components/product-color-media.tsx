"use client";
import { ProductMedia } from "./product-media";
import { useProductColor } from "./product-color-context";
import type { Tone } from "@/lib/catalog";

/**
 * The main product photo, wired to the shared colour selection. When the shopper
 * picks a colour that has its own tagged image, we show that; otherwise we fall
 * back to the product's primary image (or the art placeholder).
 */
export function ProductColorMedia({
  alt,
  tone,
  baseImage,
  colorImages,
}: {
  alt: string;
  tone: Tone;
  baseImage?: string | null;
  colorImages?: Readonly<Record<string, string>>;
}) {
  const { color } = useProductColor();
  const src = (color && colorImages?.[color]) || baseImage || null;
  const label = color ? `${alt} — ${color}` : alt;
  return <ProductMedia src={src} alt={label} tone={tone} artwork="arch" />;
}
