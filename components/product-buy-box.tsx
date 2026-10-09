"use client";
import Link from "next/link";
import { useState } from "react";
import { usePreviewStore } from "./preview-store";
import { useProductColor } from "./product-color-context";
import { ComparePreview, ComparisonNotice } from "./preview-actions";
import type { ColorOption } from "@/lib/catalog";

type Props = {
  slug: string;
  name: string;
  colors: readonly ColorOption[];
  sizes: readonly string[];
  /** Stock keyed by "<colour name>|<size>". Empty object = availability unknown (treat as in stock). */
  variantStock: Record<string, number>;
};

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

export function ProductBuyBox({ slug, name, colors, sizes, variantStock }: Props) {
  const { ready, state, add, save } = usePreviewStore();
  const knowStock = Object.keys(variantStock).length > 0;

  // Selected colour is shared with the product photo via context so picking a
  // colour swaps the displayed image. The provider is seeded with the same
  // default (first in-stock colour) computed on the server.
  const { color: colour, setColor: setColour } = useProductColor();
  const [size, setSize] = useState("");
  const [message, setMessage] = useState("");

  const saved = ready && state.wishlist.includes(slug);
  const orderedSizes = [...sizes].sort(
    (a, b) => (SIZE_ORDER.indexOf(a) + 100) % 200 - ((SIZE_ORDER.indexOf(b) + 100) % 200)
  );

  const stockFor = (c: string, s: string) => (knowStock ? variantStock[`${c}|${s}`] ?? 0 : 1);
  const sizeAvailable = (s: string) => stockFor(colour, s) > 0;
  const selectedInStock = size !== "" && sizeAvailable(size);

  function pickColour(c: string) {
    setColour(c);
    setMessage("");
    // If the currently chosen size is out of stock in the new colour, clear it.
    if (size && (variantStock[`${c}|${size}`] ?? 1) === 0) setSize("");
  }

  function addToBag() {
    if (!colour || !selectedInStock) return;
    add(slug, size, colour);
    setMessage(`${name} — ${colour}, size ${size} added to your bag.`);
  }

  return (
    <div className="buybox">
      {/* Colour picker */}
      {colors.length > 0 && (
        <div className="buybox-field">
          <div className="buybox-label">
            Colour: <strong>{colour}</strong>
          </div>
          <div className="buybox-swatches" role="radiogroup" aria-label="Select colour">
            {colors.map(c => {
              const anyStock = knowStock ? sizes.some(s => (variantStock[`${c.name}|${s}`] ?? 0) > 0) : true;
              return (
                <button
                  key={c.name}
                  type="button"
                  role="radio"
                  aria-checked={colour === c.name}
                  aria-label={`${c.name}${anyStock ? "" : " (out of stock)"}`}
                  title={c.name}
                  className={`buybox-swatch${colour === c.name ? " is-active" : ""}${anyStock ? "" : " is-oos"}`}
                  style={{ background: c.hex }}
                  disabled={!ready || !anyStock}
                  onClick={() => pickColour(c.name)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Size picker */}
      <div className="buybox-field">
        <div className="buybox-label">Size {size && <strong>· {size}</strong>}
          <Link href="/size-guide" className="buybox-sizeguide">Size guide ↗</Link>
        </div>
        <div className="buybox-sizes" role="radiogroup" aria-label="Select size">
          {orderedSizes.map(s => {
            const avail = sizeAvailable(s);
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={size === s}
                aria-label={`Size ${s}${avail ? "" : " (out of stock)"}`}
                className={`buybox-size${size === s ? " is-active" : ""}${avail ? "" : " is-oos"}`}
                disabled={!ready || !avail}
                onClick={() => { setSize(s); setMessage(""); }}
              >
                {s}
              </button>
            );
          })}
        </div>
        {colour && size && !selectedInStock && (
          <p className="buybox-hint">This colour/size is out of stock.</p>
        )}
      </div>

      {/* Actions */}
      <div className="buybox-actions">
        <button
          type="button"
          className="pa-add-btn"
          disabled={!ready || !colour || !selectedInStock}
          onClick={addToBag}
        >
          Add to bag
        </button>
        <button type="button" className="pa-save-btn" disabled={!ready} aria-pressed={saved}
          onClick={() => save(slug)}>
          {saved ? "♥ Saved" : "♡ Save"}
        </button>
        <ComparePreview slug={slug} name={name} />
      </div>
      <ComparisonNotice />
      {message && (
        <p className="pa-message" role="status" aria-live="polite">
          {message} <Link href="/bag" className="text-link">View bag ↗</Link>
        </p>
      )}
    </div>
  );
}
