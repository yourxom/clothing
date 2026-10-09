"use client";
import { useState } from "react";

export function DeliverySettingsForm({ initial }: { initial: { minDays: number; maxDays: number } }) {
  const [minDays, setMinDays] = useState(String(initial.minDays));
  const [maxDays, setMaxDays] = useState(String(initial.maxDays));
  const [status,  setStatus]  = useState<"idle"|"saving"|"done"|"error">("idle");
  const [msg,     setMsg]     = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const min = parseInt(minDays), max = parseInt(maxDays);
    if (!min || !max || min < 1 || max < min) {
      setStatus("error"); setMsg("Max days must be greater than or equal to min days.");
      return;
    }
    setStatus("saving"); setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliveryMinDays: min, deliveryMaxDays: max }),
    });
    const json = await res.json() as { ok?: boolean; error?: string };
    if (res.ok && json.ok) { setStatus("done"); setMsg("Delivery estimate saved."); }
    else { setStatus("error"); setMsg(json.error ?? "Could not save."); }
  }

  return (
    <form className="admin-settings-form" onSubmit={save}>
      <div className="delivery-days-row">
        <div className="contact-field">
          <label htmlFor="del-min">Earliest (days)</label>
          <input id="del-min" type="number" min={1} max={60} value={minDays}
            onChange={e => setMinDays(e.target.value)} className="admin-settings-input" />
        </div>
        <div className="contact-field">
          <label htmlFor="del-max">Latest (days)</label>
          <input id="del-max" type="number" min={1} max={90} value={maxDays}
            onChange={e => setMaxDays(e.target.value)} className="admin-settings-input" />
        </div>
      </div>
      <span className="admin-settings-hint">
        Customers will see e.g. &quot;Expected delivery in {minDays}–{maxDays} business days&quot;.
      </span>
      {msg && (
        <p className={status === "done" ? "newsletter-success" : "contact-field-error"} role="status">{msg}</p>
      )}
      <button type="submit" className="button" disabled={status === "saving"} style={{ marginTop: ".5rem" }}>
        {status === "saving" ? "Saving…" : "Save delivery estimate"}
      </button>
    </form>
  );
}
