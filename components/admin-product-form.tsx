"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export type CategoryOption = { slug: string; name: string };
export type ColorOption = { name: string; hex: string };

const SINGLE_COLOR_CATEGORIES = new Set(["sarees", "lehengas"]);
const SINGLE_COLOR_KEYWORDS = [
  "printed","embroidered","festive","celebration","evening","occasion",
  "chanderi","bordered","three-piece","panelled","tiered","pleated","textured","draped",
];
function looksSingleColour(categorySlug: string, name: string): boolean {
  if (SINGLE_COLOR_CATEGORIES.has(categorySlug)) return true;
  return SINGLE_COLOR_KEYWORDS.some(k => name.toLowerCase().includes(k));
}

export type ProductFormInitial = {
  id?: string;
  name: string; description: string;
  categorySlug: string; fabric: string;
  price: number; mrp: number;
  published: boolean;
  colors: string[]; sizes: string[];
};

// ── Colour naming from hex ──────────────────────────────────────────────────
// Named colour palette for proximity matching.
const NAMED_COLORS: [string, number, number, number][] = [
  ["Black",0,0,0],["White",255,255,255],["Red",220,30,30],["Deep Red",160,20,20],
  ["Burgundy",128,0,32],["Wine",100,15,40],["Pink",240,120,150],["Hot Pink",255,60,120],
  ["Blush Pink",255,180,185],["Dusty Rose",200,140,145],["Rose",210,100,105],
  ["Earth Rose",200,138,128],["Old Rose",188,115,115],["Coral",255,120,90],
  ["Peach",255,190,160],["Orange",255,140,0],["Burnt Orange",200,100,30],
  ["Mustard",200,160,30],["Yellow",255,220,0],["Lemon Yellow",255,235,60],
  ["Lime",150,220,50],["Olive",140,148,110],["Sage",130,160,120],["Forest Green",30,100,50],
  ["Teal",0,140,140],["Turquoise",60,190,190],["Cyan",0,200,220],
  ["Sky Blue",100,180,235],["Dusty Blue",120,150,168],["Slate Blue",95,110,160],
  ["Royal Blue",60,80,200],["Navy Blue",20,40,110],["Indigo",60,30,140],
  ["Violet",140,60,180],["Purple",120,40,160],["Soft Plum",152,120,138],
  ["Lavender",190,160,220],["Powder Blue",180,210,240],["Ivory",240,235,205],
  ["Warm Ivory",230,213,195],["Cream",255,250,220],["Beige",225,200,170],
  ["Sand",210,185,150],["Caramel",190,140,80],["Brown",150,100,60],
  ["Terracotta",176,126,99],["Rust",170,85,45],["Tan",180,140,100],
  ["Charcoal",70,70,75],["Grey",150,150,155],["Silver",190,190,200],
  ["Gold",210,175,60],["Emerald",30,135,80],["Seafoam",120,190,175],
  ["Magenta",220,60,145],["Cobalt Blue",30,70,200],["Deep Wine",90,20,35],
  ["Powder Pink",245,200,210],["Sage Green",130,162,130],["Dusty Pink",220,170,170],
];

function hexToRgb(hex: string): [number,number,number] | null {
  const clean = hex.replace("#","").replace(/\s/g,"");
  if (clean.length === 3) {
    const r = parseInt(clean[0]+clean[0],16);
    const g = parseInt(clean[1]+clean[1],16);
    const b = parseInt(clean[2]+clean[2],16);
    return [r,g,b];
  }
  if (clean.length === 6) {
    return [parseInt(clean.slice(0,2),16), parseInt(clean.slice(2,4),16), parseInt(clean.slice(4,6),16)];
  }
  return null;
}

function rgbaToHex(rgba: string): string | null {
  const m = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return null;
  return "#" + [m[1],m[2],m[3]].map(n => parseInt(n).toString(16).padStart(2,"0")).join("");
}

function parseColourInput(input: string): string | null {
  const t = input.trim();
  if (t.startsWith("#")) return hexToRgb(t) ? t : null;
  if (/^rgb/i.test(t)) return rgbaToHex(t);
  // Plain 6-char hex without #
  if (/^[0-9a-f]{6}$/i.test(t)) return "#" + t;
  return null;
}

function nearestColorName(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "Custom";
  const [r,g,b] = rgb;
  let best = "Custom", bestDist = Infinity;
  for (const [name,nr,ng,nb] of NAMED_COLORS) {
    const d = Math.sqrt((r-nr)**2 + (g-ng)**2 + (b-nb)**2);
    if (d < bestDist) { bestDist = d; best = name; }
  }
  return best;
}

// ── Component ───────────────────────────────────────────────────────────────
export function AdminProductForm({
  mode, initial, categories, colorOptions, sizeOptions, fabricOptions,
}: {
  mode: "create" | "edit";
  initial: ProductFormInitial;
  categories: CategoryOption[];
  colorOptions: ColorOption[];
  sizeOptions: string[];
  fabricOptions: string[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormInitial>(initial);
  const [status, setStatus] = useState<"idle"|"saving"|"error">("idle");
  const [error, setError] = useState("");

  // Custom category
  const [customCategory, setCustomCategory] = useState(false);
  const [customCategoryVal, setCustomCategoryVal] = useState("");

  // Custom fabric
  const [customFabric, setCustomFabric] = useState(!fabricOptions.includes(initial.fabric));
  const [customFabricVal, setCustomFabricVal] = useState(
    fabricOptions.includes(initial.fabric) ? "" : initial.fabric
  );

  // Colour picker
  const [colorInput, setColorInput]   = useState("");    // hex/rgba typed by admin
  const [colorName,  setColorName]    = useState("");    // auto-generated name (editable)
  const [colorHex,   setColorHex]     = useState("");    // resolved hex for preview
  const [colorErr,   setColorErr]     = useState("");
  const colorNameRef = useRef<HTMLInputElement>(null);

  // Extra colours added this session (not in the original colorOptions list)
  const [extraColors, setExtraColors] = useState<ColorOption[]>([]);

  // All displayed colours = preset + custom extras
  const allColors: ColorOption[] = [
    ...colorOptions,
    ...extraColors.filter(ec => !colorOptions.some(c => c.name === ec.name)),
  ];

  function set<K extends keyof ProductFormInitial>(key: K, value: ProductFormInitial[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }
  function toggleIn(list: string[], value: string) {
    return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
  }

  const singleColourSuggested = looksSingleColour(form.categorySlug, form.name);

  // ── Colour input handler ──────────────────────────────────────────────────
  function handleColorInputChange(val: string) {
    setColorInput(val);
    setColorErr("");
    const hex = parseColourInput(val);
    if (hex) {
      setColorHex(hex);
      const auto = nearestColorName(hex);
      setColorName(auto);
    } else {
      setColorHex("");
      setColorName("");
    }
  }

  function addCustomColor() {
    if (!colorHex) { setColorErr("Enter a valid hex (#rrggbb) or rgba() value."); return; }
    if (!colorName.trim()) { setColorErr("Enter a name for this colour."); colorNameRef.current?.focus(); return; }
    const name = colorName.trim();
    if (allColors.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      setColorErr(`"${name}" already exists. Pick a different name or select it from the list.`);
      return;
    }
    const newColor: ColorOption = { name, hex: colorHex };
    setExtraColors(prev => [...prev, newColor]);
    setForm(prev => ({ ...prev, colors: [...prev.colors, name] }));
    setColorInput(""); setColorHex(""); setColorName(""); setColorErr("");
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving"); setError("");

    // Resolve custom category/fabric
    const resolvedCategorySlug = customCategory
      ? customCategoryVal.toLowerCase().trim().replace(/\s+/g, "-")
      : form.categorySlug;
    const resolvedFabric = customFabric ? customFabricVal.trim() : form.fabric;

    const payload = {
      name: form.name, description: form.description,
      categorySlug: resolvedCategorySlug,
      fabric: resolvedFabric,
      price: Number(form.price), mrp: Number(form.mrp),
      published: form.published,
      colors: form.colors, sizes: form.sizes,
    };

    const url    = mode === "create" ? "/api/admin/products" : `/api/admin/products/${initial.id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setStatus("error"); setError((json as { error?: string }).error ?? "Could not save product."); return; }
    if (mode === "create") {
      const newId = (json as { product?: { id?: string } }).product?.id;
      router.push(newId ? `/admin/products/${newId}/edit` : "/admin/products");
    } else { router.refresh(); setStatus("idle"); }
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      {status === "error" && <p className="contact-field-error" role="alert">{error}</p>}

      <div className="admin-form-grid">
        {/* Name */}
        <div className="contact-field admin-form-full">
          <label htmlFor="pf-name">Product name *</label>
          <input id="pf-name" type="text" required maxLength={200}
            value={form.name} onChange={e => set("name", e.target.value)}
            placeholder="e.g. Earth Rose Cotton Straight Kurta" />
        </div>

        {/* Category */}
        <div className="contact-field">
          <label htmlFor="pf-category">Category *</label>
          {!customCategory ? (
            <>
              <select id="pf-category" value={form.categorySlug}
                onChange={e => {
                  if (e.target.value === "__custom__") { setCustomCategory(true); set("categorySlug", ""); }
                  else set("categorySlug", e.target.value);
                }}>
                <option value="">Choose a category</option>
                {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                <option value="__custom__">+ Add custom category…</option>
              </select>
            </>
          ) : (
            <div className="admin-custom-input-row">
              <input type="text" required placeholder="e.g. Sharara Sets"
                value={customCategoryVal}
                onChange={e => setCustomCategoryVal(e.target.value)} />
              <button type="button" className="addrbook-btn" onClick={() => { setCustomCategory(false); setCustomCategoryVal(""); }}>
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Fabric */}
        <div className="contact-field">
          <label htmlFor="pf-fabric">Fabric</label>
          {!customFabric ? (
            <select id="pf-fabric" value={form.fabric}
              onChange={e => {
                if (e.target.value === "__custom__") { setCustomFabric(true); setCustomFabricVal(""); }
                else set("fabric", e.target.value);
              }}>
              {fabricOptions.map(f => <option key={f} value={f}>{f}</option>)}
              <option value="__custom__">+ Add custom fabric…</option>
            </select>
          ) : (
            <div className="admin-custom-input-row">
              <input type="text" required placeholder="e.g. Organza Silk blend"
                value={customFabricVal}
                onChange={e => { setCustomFabricVal(e.target.value); set("fabric", e.target.value); }} />
              <button type="button" className="addrbook-btn" onClick={() => { setCustomFabric(false); set("fabric", fabricOptions[0]); }}>
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="contact-field">
          <label htmlFor="pf-price">Selling price (₹) *</label>
          <input id="pf-price" type="number" min={1} required
            value={form.price || ""} onChange={e => set("price", Number(e.target.value))} />
        </div>

        <div className="contact-field">
          <label htmlFor="pf-mrp">MRP (₹)</label>
          <input id="pf-mrp" type="number" min={0}
            value={form.mrp || ""} onChange={e => set("mrp", Number(e.target.value))} />
        </div>

        {/* Description */}
        <div className="contact-field admin-form-full">
          <label htmlFor="pf-desc">Description *</label>
          <textarea id="pf-desc" rows={4} required maxLength={2000}
            value={form.description} onChange={e => set("description", e.target.value)}
            placeholder="Describe the fabric, fit, styling and occasion…" />
        </div>
      </div>

      {/* ── Colours ─────────────────────────────────────────────────────── */}
      <fieldset className="admin-form-fieldset">
        <legend>Colours *</legend>
        <p className="admin-form-hint">Each selected colour × size becomes a stocked variant.</p>

        {singleColourSuggested && form.colors.length > 1 && (
          <p className="admin-form-warn">
            {SINGLE_COLOR_CATEGORIES.has(form.categorySlug)
              ? "This category is usually sold as a single colourway."
              : "This looks like a print/occasion design — usually one colourway."}
            {" "}<button type="button" className="admin-inline-link"
              onClick={() => set("colors", form.colors.slice(0, 1))}>
              Keep only {form.colors[0]}
            </button>
          </p>
        )}

        {/* Preset colour chips */}
        <div className="admin-chip-grid">
          {allColors.map(c => {
            const on = form.colors.includes(c.name);
            return (
              <button type="button" key={c.name}
                className={`admin-color-chip${on ? " is-on" : ""}`}
                aria-pressed={on}
                onClick={() => set("colors", toggleIn(form.colors, c.name))}>
                <span className="admin-color-dot" style={{ background: c.hex }} />
                {c.name}
              </button>
            );
          })}
        </div>

        {/* Custom colour picker */}
        <div className="admin-color-picker">
          <p className="admin-form-hint" style={{ marginBottom: ".6rem" }}>
            Add a custom colour by entering a hex code or rgba value:
          </p>
          <div className="admin-color-picker-row">
            {/* Colour swatch preview */}
            <div className="admin-color-swatch-preview"
              style={{ background: colorHex || "transparent",
                       border: colorHex ? "2px solid var(--line)" : "2px dashed var(--line)" }}
              title={colorHex || "Enter a colour code to preview"} />

            <div className="contact-field" style={{ flex: 1, margin: 0 }}>
              <label htmlFor="color-input">Hex / rgba</label>
              <input id="color-input" type="text"
                value={colorInput}
                onChange={e => handleColorInputChange(e.target.value)}
                placeholder="#b5769e  or  rgba(181,118,158,1)" />
            </div>

            <div className="contact-field" style={{ flex: 1, margin: 0 }}>
              <label htmlFor="color-name-input">Colour name</label>
              <input id="color-name-input" type="text" ref={colorNameRef}
                value={colorName}
                onChange={e => setColorName(e.target.value)}
                placeholder="Auto-generated — edit if needed" />
            </div>

            <button type="button" className="button" style={{ alignSelf: "flex-end", height: "40px", whiteSpace: "nowrap" }}
              onClick={addCustomColor} disabled={!colorHex}>
              + Add colour
            </button>
          </div>
          {colorErr && <p className="contact-field-error" style={{ marginTop: ".35rem" }}>{colorErr}</p>}
          {colorHex && colorName && (
            <p style={{ fontSize: ".74rem", color: "var(--muted)", marginTop: ".35rem" }}>
              Nearest match: <strong>{colorName}</strong> — edit the name above if it doesn't fit.
            </p>
          )}
        </div>
      </fieldset>

      {/* ── Sizes ────────────────────────────────────────────────────────── */}
      <fieldset className="admin-form-fieldset">
        <legend>Sizes *</legend>
        <div className="admin-chip-grid">
          {sizeOptions.map(s => {
            const on = form.sizes.includes(s);
            return (
              <button type="button" key={s}
                className={`admin-size-chip${on ? " is-on" : ""}`}
                aria-pressed={on}
                onClick={() => set("sizes", toggleIn(form.sizes, s))}>
                {s}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="admin-toggle-row">
        <input type="checkbox" checked={form.published}
          onChange={e => set("published", e.target.checked)} />
        <span>Published (visible in the store)</span>
      </label>

      <div className="admin-form-actions">
        <button type="submit" className="button" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
        </button>
        <button type="button" className="button button-outline" onClick={() => router.push("/admin/products")}>
          Cancel
        </button>
      </div>
      {mode === "create" && (
        <p className="admin-form-hint">After creating, you'll be able to add product images.</p>
      )}
    </form>
  );
}
