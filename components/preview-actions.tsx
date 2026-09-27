"use client";
import { useState } from "react";
import { usePreviewStore } from "./preview-store";

type Item = { slug: string; name: string; sizes: readonly string[] };
export function SavePreview({ slug, name }: Pick<Item, "slug" | "name">) {
  const { ready, state, save } = usePreviewStore();
  const saved = ready && state.wishlist.includes(slug);
  return <button className="preview-save" type="button" disabled={!ready} aria-pressed={saved} aria-label={`${saved ? "Remove" : "Save"} ${name} ${saved ? "from" : "to"} wishlist`} onClick={() => save(slug)}>{saved ? "♥ Saved" : "♡ Save style"}</button>;
}
export function ProductPreviewActions({ slug, name, sizes }: Item) {
  const { ready, state, add, save } = usePreviewStore();
  const [size, setSize] = useState("");
  const [message, setMessage] = useState("");
  const saved = ready && state.wishlist.includes(slug);
  const selectedSize = sizes.includes(size) ? size : "";
  return <div className="preview-product-actions">
    <label htmlFor="preview-size">Proposed size</label>
    <select id="preview-size" value={size} onChange={event => { setSize(event.target.value); setMessage(""); }} disabled={!ready || sizes.length === 0}>
      <option value="">Select a proposed size</option>{sizes.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
    <div className="preview-action-row"><button type="button" disabled={!ready || !selectedSize} onClick={() => { if (!selectedSize) return; add(slug, selectedSize); setMessage(`${name} (${selectedSize}) added to your demo bag. No order was placed.`); }}>Add to demo bag</button><button type="button" disabled={!ready} aria-pressed={saved} onClick={() => save(slug)}>{saved ? "♥ Saved" : "♡ Save style"}</button></div>
    <p role="status" aria-live="polite">{message || "Demo bag is a planning list only. Stock, size and price are unverified; checkout is disabled."}</p>
  </div>;
}
