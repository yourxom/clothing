"use client";
import { useState } from "react";

export function ReferralSettingsForm({
  initial,
}: {
  initial: { enabled: boolean; fixedRupees: number; percentRate: number };
}) {
  const [enabled, setEnabled]       = useState(initial.enabled);
  const [fixed,   setFixed]         = useState(String(initial.fixedRupees));
  const [percent, setPercent]       = useState(String(initial.percentRate));
  const [status,  setStatus]        = useState<"idle"|"saving"|"done"|"error">("idle");
  const [msg,     setMsg]           = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const f = Math.max(0, Math.floor(Number(fixed) || 0));
    const p = Number(percent) || 0;
    if (p < 0 || p > 100) { setStatus("error"); setMsg("Percentage must be between 0 and 100."); return; }
    setStatus("saving"); setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralEnabled: enabled, referralFixedRupees: f, referralPercentRate: p }),
    });
    const json = await res.json() as { ok?: boolean; error?: string };
    if (res.ok && json.ok) { setStatus("done"); setMsg("Referral settings saved."); }
    else { setStatus("error"); setMsg(json.error ?? "Could not save."); }
  }

  return (
    <form className="admin-settings-form" onSubmit={save}>
      <label className="admin-toggle-row">
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
        <span>Enable the Refer &amp; Earn program</span>
      </label>

      <div className="delivery-days-row">
        <div className="contact-field">
          <label htmlFor="ref-fixed">Fixed reward (₹ points)</label>
          <input id="ref-fixed" type="number" min={0} value={fixed}
            onChange={e => setFixed(e.target.value)} className="admin-settings-input" />
        </div>
        <div className="contact-field">
          <label htmlFor="ref-pct">% of referred order</label>
          <input id="ref-pct" type="number" min={0} max={100} value={percent}
            onChange={e => setPercent(e.target.value)} className="admin-settings-input" />
        </div>
      </div>
      <span className="admin-settings-hint">
        When a referred customer completes their first order, the referrer earns ₹{fixed || 0} plus {percent || 0}%
        of that order as points (1 point = ₹1 store credit).
      </span>
      {msg && (
        <p className={status === "done" ? "newsletter-success" : "contact-field-error"} role="status">{msg}</p>
      )}
      <button type="submit" className="button" disabled={status === "saving"} style={{ marginTop: ".5rem" }}>
        {status === "saving" ? "Saving…" : "Save referral settings"}
      </button>
    </form>
  );
}
