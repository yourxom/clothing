"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  orderId: string;
  currentTracking: string;
  currentProvider: string;
  customerEmail: string;
  orderNumber: string;
};

const CARRIERS = ["", "Delhivery", "Bluedart", "DTDC", "Xpressbees", "Ecom Express", "India Post", "FedEx", "Other"];

export function AdminTrackingForm({ orderId, currentTracking, currentProvider, customerEmail, orderNumber }: Props) {
  const router = useRouter();
  const [open,     setOpen]     = useState(false);
  const [tracking, setTracking] = useState(currentTracking);
  // If the saved provider isn't one of the known carriers, treat it as a custom
  // "Other" value so it round-trips correctly when editing.
  const isKnown = CARRIERS.includes(currentProvider);
  const [provider,     setProvider]     = useState(isKnown ? currentProvider : "Other");
  const [customCarrier, setCustomCarrier] = useState(isKnown ? "" : currentProvider);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState("");

  // The carrier name actually saved: the custom name when "Other" is picked.
  const resolvedProvider = provider === "Other" ? customCarrier.trim() : provider;

  // Lock body scroll + close on Escape while the dialog is open.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleSave() {
    setSaving(true);
    setMsg("");
    const res = await fetch(`/api/admin/orders/${orderId}/tracking`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber: tracking.trim(), trackingProvider: resolvedProvider, customerEmail, orderNumber }),
    });
    const json = await res.json() as { ok?: boolean; error?: string };
    setSaving(false);
    if (res.ok) {
      setMsg("Saved. Email sent to customer.");
      router.refresh();
      setTimeout(() => setOpen(false), 1500);
    } else {
      setMsg(json.error ?? "Failed to save.");
    }
  }

  return (
    <div>
      <button type="button"
        className="button button-outline"
        style={{ height:"40px", minHeight:"40px", padding:"0 1.1rem", fontSize:".78rem" }}
        onClick={() => setOpen(true)}>
        {currentTracking ? `📦 ${currentTracking}` : "Add tracking"}
      </button>

      {open && (
        <div
          className="admin-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tracking-modal-title"
          onClick={() => setOpen(false)}
        >
          {/* Stop clicks inside the dialog from closing it. */}
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h3 id="tracking-modal-title" className="admin-modal-title">Tracking details</h3>
              <button type="button" className="admin-modal-close" aria-label="Close" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="contact-field" style={{ marginBottom:".9rem" }}>
                <label htmlFor="track-provider">Carrier</label>
                <select id="track-provider" value={provider}
                  onChange={e => setProvider(e.target.value)} className="admin-select">
                  {CARRIERS.map(c => <option key={c} value={c}>{c || "Select carrier"}</option>)}
                </select>
              </div>

              {/* When "Other" is chosen, let the admin type the carrier name. */}
              {provider === "Other" && (
                <div className="contact-field" style={{ marginBottom:".9rem" }}>
                  <label htmlFor="track-carrier-name">Carrier name</label>
                  <input id="track-carrier-name" type="text" value={customCarrier}
                    onChange={e => setCustomCarrier(e.target.value)}
                    placeholder="e.g. Shadowfax, Shiprocket…"
                    className="admin-modal-input" />
                </div>
              )}

              <div className="contact-field" style={{ marginBottom:".4rem" }}>
                <label htmlFor="track-number">Tracking number</label>
                <input id="track-number" type="text" value={tracking}
                  onChange={e => setTracking(e.target.value)}
                  placeholder="e.g. 1234567890"
                  className="admin-modal-input" />
              </div>

              {msg && (
                <p style={{ fontSize:".78rem", color: msg.includes("Saved") ? "#3a7d44" : "#8b3344", margin:".6rem 0 0" }}>
                  {msg}
                </p>
              )}
            </div>

            <div className="admin-modal-foot">
              <button type="button" className="button"
                disabled={saving || !tracking.trim() || !resolvedProvider}
                onClick={handleSave}>
                {saving ? "Saving…" : "Save & notify customer"}
              </button>
              <button type="button" className="button button-outline" onClick={() => setOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
