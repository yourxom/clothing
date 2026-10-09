"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status,  setStatus]  = useState<"idle"|"submitting"|"done"|"error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data     = new FormData(e.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirm  = String(data.get("confirm")  ?? "");

    if (password !== confirm) { setStatus("error"); setMessage("Passwords do not match."); return; }
    if (password.length < 8)  { setStatus("error"); setMessage("Password must be at least 8 characters."); return; }
    if (!token)               { setStatus("error"); setMessage("Invalid reset link. Please request a new one."); return; }

    setStatus("submitting");
    const res  = await fetch("/api/auth/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const json = await res.json() as { message?: string; error?: string };
    setStatus(res.ok ? "done" : "error");
    setMessage(json.message ?? json.error ?? (res.ok ? "Password updated." : "Something went wrong."));
  }

  if (status === "done") {
    return (
      <div>
        <p className="newsletter-success" role="status">{message}</p>
        <a href="/login" className="button" style={{ marginTop: "1rem", display: "inline-flex" }}>
          Sign in ↗
        </a>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {status === "error" && <p className="auth-error" role="alert">{message}</p>}
      <div className="contact-field">
        <label htmlFor="rp-password">New password</label>
        <input id="rp-password" name="password" type="password" required
          autoComplete="new-password" placeholder="Min. 8 characters" />
      </div>
      <div className="contact-field">
        <label htmlFor="rp-confirm">Confirm password</label>
        <input id="rp-confirm" name="confirm" type="password" required
          autoComplete="new-password" placeholder="Repeat password" />
      </div>
      <button type="submit" className="button" style={{ width: "100%" }}
        disabled={status === "submitting"}>
        {status === "submitting" ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}
