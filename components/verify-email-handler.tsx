"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export function VerifyEmailHandler() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"verifying"|"done"|"error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. Please check your email for the correct link.");
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json() as Promise<{ ok?: boolean; message?: string; error?: string }>)
      .then(json => {
        if (json.ok) { setStatus("done"); setMessage(json.message ?? "Email verified."); }
        else         { setStatus("error"); setMessage(json.error ?? "Verification failed."); }
      })
      .catch(() => { setStatus("error"); setMessage("Network error. Please try again."); });
  }, [token]);

  if (status === "verifying") {
    return (
      <div className="verify-loading">
        <div className="checkout-placing-spinner" aria-hidden="true" />
        <p>Verifying your email address…</p>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div>
        <p className="newsletter-success" role="status">✦ {message}</p>
        <p style={{ color: "var(--muted)", fontSize: ".85rem", margin: "1rem 0 1.5rem" }}>
          Your account is now active. You can sign in and start shopping.
        </p>
        <Link href="/login" className="button">Sign in to your account</Link>
      </div>
    );
  }

  return (
    <div>
      <p className="auth-error" role="alert">{message}</p>
      <p style={{ color: "var(--muted)", fontSize: ".85rem", margin: "1rem 0 1.5rem" }}>
        Need a new verification link?
      </p>
      <Link href="/account" className="button button-outline">Resend verification email</Link>
    </div>
  );
}
