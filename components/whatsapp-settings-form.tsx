"use client";
import { useState } from "react";

type Config = { number: string; message: string; enabled: boolean };

export function WhatsAppSettingsForm({ initial }: { initial: Config }) {
  const [number,  setNumber]  = useState(initial.number);
  const [message, setMessage] = useState(initial.message);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [status,  setStatus]  = useState<"idle"|"saving"|"done"|"error">("idle");
  const [msg,     setMsg]     = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving"); setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        whatsappNumber:  number.replace(/\D/g, ""),
        whatsappMessage: message,
        whatsappEnabled: enabled,
      }),
    });
    const json = await res.json() as { ok?: boolean; error?: string };
    if (res.ok && json.ok) { setStatus("done"); setMsg("Settings saved."); }
    else { setStatus("error"); setMsg(json.error ?? "Could not save settings."); }
  }

  // Live preview link
  const cleanNumber = number.replace(/\D/g, "");
  const previewHref = cleanNumber
    ? `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
    : "";

  return (
    <form className="admin-settings-form" onSubmit={save}>
      <label className="admin-toggle-row">
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
        <span>Show WhatsApp button on the storefront</span>
      </label>

      <div className="contact-field">
        <label htmlFor="wa-number">WhatsApp number (with country code)</label>
        <input id="wa-number" type="tel" value={number}
          onChange={e => setNumber(e.target.value)}
          placeholder="e.g. 919812345678" maxLength={18}
          className="admin-settings-input" />
        <span className="admin-settings-hint">
          Digits only, including country code. India = 91. Example: 919812345678
        </span>
      </div>

      <div className="contact-field">
        <label htmlFor="wa-message">Default message</label>
        <textarea id="wa-message" value={message} rows={3} maxLength={500}
          onChange={e => setMessage(e.target.value)}
          placeholder="Hi AURELIA, I have a question…"
          className="admin-settings-input" />
        <span className="admin-settings-hint">
          Pre-filled in the customer&apos;s WhatsApp chat. They can edit before sending.
        </span>
      </div>

      {previewHref && (
        <p className="admin-settings-preview">
          Preview link:{" "}
          <a href={previewHref} target="_blank" rel="noopener noreferrer" className="text-link">
            Open test chat ↗
          </a>
        </p>
      )}

      {msg && (
        <p className={status === "done" ? "newsletter-success" : "contact-field-error"} role="status">
          {msg}
        </p>
      )}

      <button type="submit" className="button" disabled={status === "saving"}
        style={{ marginTop: ".5rem" }}>
        {status === "saving" ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
