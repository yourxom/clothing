"use client";
import { useState } from "react";
import { PasswordInput, CurrentPasswordInput } from "@/components/password-input";

export function PasswordChangeForm() {
  const [status,  setStatus]  = useState<"idle"|"saving"|"done"|"error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data    = new FormData(e.currentTarget);
    const current = String(data.get("current")).trim();
    const next    = String(data.get("next")).trim();
    const confirm = String(data.get("confirm")).trim();

    if (next !== confirm) { setStatus("error"); setMessage("New passwords do not match."); return; }
    if (next.length < 8)  { setStatus("error"); setMessage("New password must be at least 8 characters."); return; }
    if (next.length > 72) { setStatus("error"); setMessage("Password must be 72 characters or fewer."); return; }

    setStatus("saving");
    const res  = await fetch("/api/account/password", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const json = await res.json() as { ok?: boolean; message?: string; error?: string };
    if (res.ok) {
      setStatus("done");
      setMessage(json.message ?? "Password updated.");
      (e.target as HTMLFormElement).reset();
    } else {
      setStatus("error");
      setMessage(json.error ?? "Could not update password. Please try again.");
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate style={{ maxWidth: "420px" }}>
      {message && (
        <p className={status === "done" ? "newsletter-success" : "contact-field-error"} role="status">
          {message}
        </p>
      )}
      <CurrentPasswordInput id="pw-current" name="current" label="Current password" />
      <PasswordInput id="pw-next" name="next" label="New password"
        showStrength autoComplete="new-password" placeholder="Min. 8 characters" />
      <PasswordInput id="pw-confirm" name="confirm" label="Confirm new password"
        autoComplete="new-password" placeholder="Repeat new password" />
      <button type="submit" className="button" disabled={status === "saving"}>
        {status === "saving" ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
