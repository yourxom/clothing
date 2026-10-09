"use client";
import { useState, useRef } from "react";

type Item = {
  productId: string; productName: string; category: string;
  variantId: string; sku: string; size: string; color: string;
  quantity: number; inventoryId: string | null;
};

export function InventoryEditor({ items }: { items: Item[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(items.map(i => [i.variantId, i.quantity]))
  );
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved,  setSaved]  = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const filtered = search
    ? items.filter(i =>
        i.productName.toLowerCase().includes(search.toLowerCase()) ||
        i.category.toLowerCase().includes(search.toLowerCase()) ||
        i.sku.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  // Group by product
  const grouped = filtered.reduce<Record<string, Item[]>>((acc, item) => {
    if (!acc[item.productId]) acc[item.productId] = [];
    acc[item.productId].push(item);
    return acc;
  }, {});

  async function saveQuantity(variantId: string, quantity: number) {
    setSaving(prev => ({ ...prev, [variantId]: true }));
    setErrors(prev => ({ ...prev, [variantId]: "" }));
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setSaved(prev => ({ ...prev, [variantId]: true }));
      setTimeout(() => setSaved(prev => ({ ...prev, [variantId]: false })), 2000);
    } catch (err) {
      setErrors(prev => ({ ...prev, [variantId]: (err as Error).message }));
    } finally {
      setSaving(prev => ({ ...prev, [variantId]: false }));
    }
  }

  function handleChange(variantId: string, value: string) {
    const num = Math.max(0, Math.min(9999, parseInt(value) || 0));
    setQuantities(prev => ({ ...prev, [variantId]: num }));
    // Debounce auto-save 600ms
    clearTimeout(debounceRef.current[variantId]);
    debounceRef.current[variantId] = setTimeout(() => saveQuantity(variantId, num), 600);
  }

  const totalStock = items.reduce((s, i) => s + (quantities[i.variantId] ?? 0), 0);

  return (
    <div>
      {/* Summary bar */}
      <div className="inv-summary">
        <div className="inv-summary-stat">
          <span>{totalStock}</span><span>Total units</span>
        </div>
        <div className="inv-summary-stat">
          <span>{items.filter(i => (quantities[i.variantId] ?? 0) === 0).length}</span>
          <span>Out of stock variants</span>
        </div>
        <div className="inv-summary-stat">
          <span>{items.filter(i => (quantities[i.variantId] ?? 0) > 0 && (quantities[i.variantId] ?? 0) <= 3).length}</span>
          <span>Low stock (≤3)</span>
        </div>
      </div>

      {/* Search */}
      <div className="inv-search">
        <input type="search" placeholder="Search by product, category or SKU…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="inv-search-input" />
      </div>

      {/* Product groups */}
      {Object.values(grouped).map(variants => {
        const product = variants[0];
        const groupStock = variants.reduce((s, v) => s + (quantities[v.variantId] ?? 0), 0);
        return (
          <div key={product.productId} className="inv-product-group">
            <div className="inv-product-header">
              <div>
                <span className="inv-product-name">{product.productName}</span>
                <span className="inv-product-cat">{product.category} · {product.color}</span>
              </div>
              <span className={`inv-group-stock${groupStock === 0 ? " inv-group-stock--zero" : groupStock <= 5 ? " inv-group-stock--low" : ""}`}>
                {groupStock} units
              </span>
            </div>
            <div className="inv-variants">
              {variants.map(v => (
                <div key={v.variantId} className="inv-variant-row">
                  <span className="inv-size">{v.size}</span>
                  <span className="inv-sku">{v.sku}</span>
                  <div className="inv-qty-wrap">
                    <button type="button" className="inv-qty-btn"
                      onClick={() => handleChange(v.variantId, String(Math.max(0, (quantities[v.variantId] ?? 0) - 1)))}>
                      −
                    </button>
                    <input
                      type="number" min={0} max={9999}
                      value={quantities[v.variantId] ?? 0}
                      onChange={e => handleChange(v.variantId, e.target.value)}
                      className="inv-qty-input"
                      aria-label={`Quantity for ${v.sku}`}
                    />
                    <button type="button" className="inv-qty-btn"
                      onClick={() => handleChange(v.variantId, String((quantities[v.variantId] ?? 0) + 1))}>
                      +
                    </button>
                  </div>
                  <span className="inv-status">
                    {saving[v.variantId] && <span className="inv-saving">Saving…</span>}
                    {saved[v.variantId]  && <span className="inv-saved">✓ Saved</span>}
                    {errors[v.variantId] && <span className="inv-error">{errors[v.variantId]}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <p className="notice">No variants match your search.</p>
      )}
    </div>
  );
}
