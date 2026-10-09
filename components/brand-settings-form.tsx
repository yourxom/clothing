"use client";
import { useState } from "react";

export function BrandSettingsForm({
  initial,
}: {
  initial: { siteUrl: string; contactEmail: string };
}) {
  const [siteUrl, setSiteUrl] = useState(initial.siteUrl);
  const [contactEmail, setContactEmail] = useState(initial.contactEmail);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving"); setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteUrl: siteUrl.trim(), contactEmail: contactEmail.trim() }),
    });
    const json = await res.json() as { ok?: boolean; error?: string };
    if (res.ok && json.ok) { setStatus("done"); setMsg("Brand & domain saved."); }
    else { setStatus("error"); setMsg(json.error ?? "Could not save."); }
  }

  return (
    <form className="admin-settings-form" onSubmit={save}>
      <div className="contact-field">
        <label htmlFor="brand-url">Site URL (domain)</label>
        <input
          id="brand-url"
          type="url"
          placeholder="https://your-domain.example"
          value={siteUrl}
          onChange={e => setSiteUrl(e.target.value)}
          className="admin-settings-input"
        />
        <span className="admin-settings-hint">
          The canonical address of your store. Used in page metadata, sitemap, SEO links and emails.
          Set this once your real domain is live (e.g. https://aurelia.in).
        </span>
      </div>

      <div className="contact-field">
        <label htmlFor="brand-email">Contact email</label>
        <input
          id="brand-email"
          type="email"
          placeholder="hello@your-domain.example"
          value={contactEmail}
          onChange={e => setContactEmail(e.target.value)}
          className="admin-settings-input"
        />
        <span className="admin-settings-hint">
          Shown on the Contact, Help, Privacy and Terms pages, and used as the default sender name.
        </span>
      </div>

      {msg && (
        <p className={status === "done" ? "newsletter-success" : "contact-field-error"} role="status">{msg}</p>
      )}
      <button type="submit" className="button" disabled={status === "saving"} style={{ marginTop: ".5rem" }}>
        {status === "saving" ? "Saving…" : "Save brand & domain"}
      </button>
    </form>
  );
}
