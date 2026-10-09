"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type ProductImageItem = {
  id: string; url: string; altText: string; isPrimary: boolean; color?: string | null;
};

export function AdminImageManager({
  productId,
  categorySlug = "products",
  initialImages,
  colours = [],
}: {
  productId:    string;
  categorySlug?: string;
  initialImages: ProductImageItem[];
  colours?:      string[];
}) {
  const router = useRouter();
  const [images, setImages]   = useState<ProductImageItem[]>(initialImages);
  const [tab,    setTab]      = useState<"upload"|"url">("upload");
  const [busy,   setBusy]     = useState(false);
  const [error,  setError]    = useState("");

  // Upload tab state
  const fileRef   = useRef<HTMLInputElement>(null);
  const [files,   setFiles]   = useState<File[]>([]);
  const [upAlt,   setUpAlt]   = useState("");
  const [upColor, setUpColor] = useState("");
  const [progress, setProgress] = useState<string[]>([]);

  // URL tab state
  const [url,   setUrl]   = useState("");
  const [alt,   setAlt]   = useState("");
  const [urlColor, setUrlColor] = useState("");

  // ── Upload files ──────────────────────────────────────────────────────────
  async function uploadFiles(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) return;
    setBusy(true); setError(""); setProgress([]);
    const msgs: string[] = [];

    for (const file of files) {
      const fd = new FormData();
      fd.append("file",         file);
      fd.append("productId",    productId);
      fd.append("categorySlug", categorySlug);
      fd.append("altText",      upAlt || file.name.replace(/\.[^.]+$/, ""));
      fd.append("color",        upColor);
      fd.append("isPrimary",    String(images.length === 0 && msgs.length === 0));

      const res  = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json() as { ok?: boolean; image?: ProductImageItem; url?: string; error?: string };
      if (res.ok && json.ok && json.image) {
        setImages(prev => [...prev, json.image!]);
        msgs.push(`✔ ${file.name}`);
      } else {
        msgs.push(`✖ ${file.name}: ${json.error ?? "Failed"}`);
      }
      setProgress([...msgs]);
    }

    setBusy(false);
    setFiles([]); if (fileRef.current) fileRef.current.value = "";
    setUpAlt(""); setUpColor("");
    router.refresh();
  }

  // ── Add by URL ────────────────────────────────────────────────────────────
  async function addByUrl(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const res  = await fetch(`/api/admin/products/${productId}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim(), altText: alt.trim(), color: urlColor || undefined }),
    });
    const json = await res.json().catch(() => ({})) as { ok?: boolean; image?: ProductImageItem; error?: string };
    setBusy(false);
    if (!res.ok) { setError(json.error ?? "Could not add image."); return; }
    if (json.image) setImages(prev => [...prev, json.image!]);
    setUrl(""); setAlt(""); setUrlColor(""); router.refresh();
  }

  // ── Image actions ─────────────────────────────────────────────────────────
  async function remove(imageId: string) {
    const prev = images;
    setImages(cur => cur.filter(i => i.id !== imageId));
    const res = await fetch(`/api/admin/products/${productId}/images`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId }),
    });
    if (!res.ok) { setImages(prev); return; }
    router.refresh();
  }

  async function makePrimary(imageId: string) {
    setImages(cur => cur.map(i => ({ ...i, isPrimary: i.id === imageId })));
    await fetch(`/api/admin/products/${productId}/images`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId, setPrimary: true }),
    });
    router.refresh();
  }

  async function setImageColour(imageId: string, value: string) {
    setImages(cur => cur.map(i => i.id === imageId ? { ...i, color: value || null } : i));
    await fetch(`/api/admin/products/${productId}/images`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId, color: value, setPrimary: false }),
    });
    router.refresh();
  }

  return (
    <div className="admin-images">
      {colours.length > 0 && (
        <p className="admin-form-hint">
          Tag each image with a colour so the store swaps the photo when a shopper selects that colour.
        </p>
      )}

      {/* Image grid */}
      <div className="admin-image-grid">
        {images.length === 0 && (
          <p className="admin-form-hint">No images yet — upload or add a URL below.</p>
        )}
        {images.map(img => (
          <figure key={img.id} className={`admin-image-card${img.isPrimary ? " is-primary" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url.startsWith("/") ? img.url.split("/").map(encodeURIComponent).join("/") : img.url}
              alt={img.altText}
              loading="lazy"
            />
            {img.isPrimary && <span className="admin-image-badge">Main</span>}
            <figcaption>
              {colours.length > 0 && (
                <label className="admin-image-colour">
                  <span>Colour</span>
                  <select value={img.color ?? ""} onChange={e => setImageColour(img.id, e.target.value)}>
                    <option value="">— none —</option>
                    {colours.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
              )}
              {!img.isPrimary && (
                <button type="button" className="admin-image-btn" onClick={() => makePrimary(img.id)}>
                  Set as main
                </button>
              )}
              <button type="button" className="admin-image-btn admin-image-btn--danger" onClick={() => remove(img.id)}>
                Remove
              </button>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="admin-img-tabs">
        <button type="button" className={`admin-img-tab${tab === "upload" ? " admin-img-tab--active" : ""}`}
          onClick={() => setTab("upload")}>
          📁 Upload from device
        </button>
        <button type="button" className={`admin-img-tab${tab === "url" ? " admin-img-tab--active" : ""}`}
          onClick={() => setTab("url")}>
          🔗 Add by URL
        </button>
      </div>

      {/* Upload tab */}
      {tab === "upload" && (
        <form className="admin-image-add" onSubmit={uploadFiles}>
          {error && <p className="contact-field-error" role="alert">{error}</p>}

          {/* Drop zone / file picker */}
          <div className="admin-upload-zone"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
              setFiles(dropped);
            }}>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden
              onChange={e => setFiles(Array.from(e.target.files ?? []))} />
            {files.length > 0 ? (
              <div className="admin-upload-previews">
                {files.map((f, i) => (
                  <div key={i} className="admin-upload-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={URL.createObjectURL(f)} alt={f.name} />
                    <span>{f.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-upload-placeholder">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p>Click to choose files or drag &amp; drop</p>
                <p style={{ fontSize: ".72rem" }}>JPG, PNG, WebP, GIF · max 8 MB each</p>
              </div>
            )}
          </div>

          {files.length > 0 && (
            <>
              <div style={{ display: "flex", gap: ".8rem", flexWrap: "wrap", marginTop: ".6rem" }}>
                <div className="contact-field" style={{ flex: 1, minWidth: "180px" }}>
                  <label>Alt text</label>
                  <input type="text" value={upAlt} onChange={e => setUpAlt(e.target.value)}
                    placeholder="e.g. Front view" />
                </div>
                {colours.length > 0 && (
                  <div className="contact-field" style={{ flex: 1, minWidth: "140px" }}>
                    <label>Colour tag</label>
                    <select value={upColor} onChange={e => setUpColor(e.target.value)}>
                      <option value="">— all colours —</option>
                      {colours.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: ".5rem", marginTop: ".6rem", alignItems: "center" }}>
                <button type="submit" className="button" disabled={busy}>
                  {busy ? `Uploading ${files.length} file${files.length !== 1 ? "s" : ""}…` : `Upload ${files.length} file${files.length !== 1 ? "s" : ""}`}
                </button>
                <button type="button" className="button button-outline"
                  onClick={() => { setFiles([]); if (fileRef.current) fileRef.current.value = ""; }}>
                  Clear
                </button>
              </div>
            </>
          )}

          {/* Upload progress */}
          {progress.length > 0 && (
            <ul className="admin-upload-progress">
              {progress.map((m, i) => (
                <li key={i} style={{ color: m.startsWith("✔") ? "#3a7d44" : "#8b3344" }}>{m}</li>
              ))}
            </ul>
          )}

          <p className="admin-form-hint" style={{ marginTop: ".5rem" }}>
            Files are saved to <code style={{ fontSize: ".75rem" }}>public/products/{categorySlug}/</code>
          </p>
        </form>
      )}

      {/* URL tab */}
      {tab === "url" && (
        <form className="admin-image-add" onSubmit={addByUrl}>
          {error && <p className="contact-field-error" role="alert">{error}</p>}
          <div className="contact-field">
            <label htmlFor="img-url">Image URL</label>
            <input id="img-url" type="url" required value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://…/photo.jpg" />
          </div>
          <div className="contact-field">
            <label htmlFor="img-alt">Alt text (accessibility)</label>
            <input id="img-alt" type="text" value={alt} onChange={e => setAlt(e.target.value)}
              placeholder="e.g. Model wearing the kurta, front view" />
          </div>
          {colours.length > 0 && (
            <div className="contact-field">
              <label htmlFor="img-colour">Colour tag (optional)</label>
              <select id="img-colour" value={urlColor} onChange={e => setUrlColor(e.target.value)}>
                <option value="">— applies to all colours —</option>
                {colours.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          <button type="submit" className="button button-outline" disabled={busy}>
            {busy ? "Adding…" : "Add image"}
          </button>
        </form>
      )}
    </div>
  );
}
