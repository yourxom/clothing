"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Activate / deactivate the Refer & Earn program from the Referrals admin page.
// Persists via the existing PATCH /api/admin/settings (referralEnabled).
export function ReferralProgramToggle({ enabled: initial }: { enabled: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function toggle() {
    const next = !enabled;
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralEnabled: next }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (res.ok && json.ok) {
        setEnabled(next);
        router.refresh(); // re-pull the server page so the banner/data update
      } else {
        setErr(json.error ?? "Could not update the program.");
      }
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="referral-toggle">
      <span className={`referral-status-pill${enabled ? " referral-status-pill--on" : ""}`}>
        <span className="referral-status-dot" aria-hidden="true" />
        {enabled ? "Active" : "Paused"}
      </span>
      <button
        type="button"
        className={`button${enabled ? " button-outline" : ""}`}
        onClick={toggle}
        disabled={busy}
      >
        {busy ? "Saving…" : enabled ? "Deactivate program" : "Activate program"}
      </button>
      {err && <span className="contact-field-error" style={{ marginLeft: ".2rem" }}>{err}</span>}
    </div>
  );
}
