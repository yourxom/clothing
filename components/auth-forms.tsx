"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PasswordInput, CurrentPasswordInput } from "@/components/password-input";

type Channel = "email" | "phone";

/* ── GOOGLE SIGN-IN BUTTON ──────────────────────────────────────── */
function GoogleButton({ label, callbackUrl = "/account" }: { label: string; callbackUrl?: string }) {
  return (
    <>
      <button type="button" className="button button-outline auth-google-btn"
        onClick={() => signIn("google", { callbackUrl })}>
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        {label}
      </button>
      <div className="auth-divider"><span>or</span></div>
    </>
  );
}

/* ── OTP INPUT + SEND/VERIFY ────────────────────────────────────── */
function OtpVerifier({
  identifier, channel, purpose, verified, onVerified,
}: {
  identifier: string;
  channel: Channel;
  purpose: "register" | "reset";
  verified: boolean;
  onVerified: (v: boolean) => void;
}) {
  const [sent, setSent]     = useState(false);
  const [code, setCode]     = useState("");
  const [busy, setBusy]     = useState(false);
  const [msg, setMsg]       = useState("");

  async function send() {
    setBusy(true); setMsg("");
    const res  = await fetch("/api/auth/otp/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, channel, purpose }),
    });
    const json = await res.json() as { ok?: boolean; message?: string; error?: string };
    setBusy(false);
    if (res.ok) {
      setSent(true);
      setMsg(json.message ?? "Code sent.");
    } else {
      setMsg(json.error ?? "Could not send code.");
    }
  }

  async function verify() {
    setBusy(true); setMsg("");
    const res  = await fetch("/api/auth/otp/verify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, channel, code }),
    });
    const json = await res.json() as { ok?: boolean; error?: string };
    setBusy(false);
    if (res.ok) { onVerified(true); setMsg("Verified ✓"); }
    else { setMsg(json.error ?? "Incorrect code."); }
  }

  const canSend = identifier.length > 3;

  if (verified) {
    return <p className="auth-otp-ok" role="status">✓ {channel === "email" ? "Email" : "Phone"} verified</p>;
  }

  return (
    <div className="auth-otp">
      {!sent ? (
        <button type="button" className="button button-outline" disabled={!canSend || busy}
          onClick={send} style={{ width: "100%" }}>
          {busy ? "Sending…" : `Send verification code`}
        </button>
      ) : (
        <>
          <div className="contact-field">
            <label htmlFor="otp-code">Enter the 6-digit code</label>
            <input id="otp-code" inputMode="numeric" maxLength={6} value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••" autoComplete="one-time-code" />
          </div>
          <div className="auth-otp-actions">
            <button type="button" className="button" disabled={code.length !== 6 || busy} onClick={verify}>
              {busy ? "Verifying…" : "Verify"}
            </button>
            <button type="button" className="auth-link-btn" disabled={busy} onClick={send}>
              Resend code
            </button>
          </div>
        </>
      )}
      {msg && <p className="auth-otp-msg" role="status">{msg}</p>}
    </div>
  );
}

/* ── LOGIN FORM ─────────────────────────────────────────────────── */
export function LoginForm({ callbackUrl = "/account" }: { callbackUrl?: string }) {
  const router = useRouter();
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const data = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      identifier: String(data.get("identifier")).trim(),
      password:   String(data.get("password")),
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Incorrect credentials. Check your email/phone and password.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH === "true";

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {error && <p className="auth-error" role="alert">{error}</p>}

      {googleEnabled && <GoogleButton label="Continue with Google" callbackUrl={callbackUrl} />}

      <div className="contact-field">
        <label htmlFor="login-identifier">Email or phone number</label>
        <input id="login-identifier" name="identifier" type="text" autoComplete="username"
          required placeholder="you@example.com or 9812345678" />
      </div>

      <CurrentPasswordInput id="login-password" name="password" label="Password" />

      <button type="submit" className="button" style={{ width: "100%" }} disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <p className="auth-switch">
        Don&apos;t have an account? <a href="/register">Create one ↗</a>
      </p>
      <p className="auth-switch">
        <a href="/forgot-password">Forgot your password?</a>
      </p>
    </form>
  );
}

/* ── REGISTER FORM (Email-only registration with Email OTP) ──────── */
export function RegisterForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [verified, setVerified] = useState(false);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function updateIdentifier(v: string) {
    setIdentifier(v);
    if (verified) setVerified(false);
  }

  const normalizedEmail = identifier.trim().toLowerCase();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    const password = String(data.get("password"));
    const confirm  = String(data.get("confirm"));

    if (!verified) { setError("Please verify your email address first."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }

    setLoading(true);
    // Pass along a referral code captured from the ?ref= link
    const refCode = typeof document !== "undefined"
      ? (document.cookie.match(/(?:^|;\s*)aurelia_ref=([^;]+)/)?.[1] ?? "")
      : "";
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:       String(data.get("name")).trim(),
        identifier: normalizedEmail,
        channel:    "email",
        password,
        referralCode: refCode ? decodeURIComponent(refCode) : undefined,
      }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError((json as { error?: string }).error ?? "Registration failed. Please try again.");
      setLoading(false);
      return;
    }

    // Auto sign-in after registration
    await signIn("credentials", { identifier: normalizedEmail, password, redirect: false });
    router.push("/account");
    router.refresh();
  }

  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH === "true";

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {error && <p className="auth-error" role="alert">{error}</p>}

      {googleEnabled && <GoogleButton label="Sign up with Google" />}

      <div className="contact-field">
        <label htmlFor="reg-name">Full name</label>
        <input id="reg-name" name="name" type="text" autoComplete="name"
          placeholder="Your name" maxLength={100} />
      </div>

      <div className="contact-field">
        <label htmlFor="reg-email">Email address <span aria-hidden="true">*</span></label>
        <input id="reg-email" name="email" type="email" autoComplete="email"
          required value={identifier} onChange={e => updateIdentifier(e.target.value)}
          placeholder="you@example.com" disabled={verified} />
      </div>

      <OtpVerifier identifier={normalizedEmail} channel="email" purpose="register"
        verified={verified} onVerified={setVerified} />

      <PasswordInput
        id="reg-password" name="password"
        label="Password" showStrength
        autoComplete="new-password" placeholder="Min. 8 characters"
      />
      <PasswordInput
        id="reg-confirm" name="confirm"
        label="Confirm password"
        autoComplete="new-password" placeholder="Repeat password"
      />

      <button type="submit" className="button" style={{ width: "100%" }} disabled={loading || !verified}>
        {loading ? "Creating account…" : "Create account"}
      </button>

      <p className="auth-switch">
        Already have an account? <a href="/login">Sign in ↗</a>
      </p>
    </form>
  );
}

/* ── SIGN OUT BUTTON ────────────────────────────────────────────── */
export function SignOutButton() {
  async function handleSignOut() {
    const { signOut } = await import("next-auth/react");
    await signOut({ callbackUrl: "/" });
  }
  return (
    <button type="button" className="button button-outline" onClick={handleSignOut}>
      Sign out
    </button>
  );
}

/* ── FORGOT PASSWORD FORM (Email reset link) ─────────────────────── */
export function ForgotPasswordForm() {
  const [email, setEmail]     = useState("");
  const [status,  setStatus]  = useState<"idle"|"submitting"|"done"|"error">("idle");
  const [message, setMessage] = useState("");

  async function sendEmailLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const normalizedEmail = email.trim().toLowerCase();
    const res  = await fetch("/api/auth/forgot-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail }),
    });
    const json = await res.json() as { message?: string; error?: string };
    setStatus(res.ok ? "done" : "error");
    setMessage(json.message ?? json.error ?? (res.ok ? "Reset link sent." : "Something went wrong."));
  }

  if (status === "done") {
    return <p className="newsletter-success" role="status">{message}</p>;
  }

  return (
    <form className="auth-form" onSubmit={sendEmailLink} noValidate>
      {status === "error" && <p className="auth-error" role="alert">{message}</p>}
      <div className="contact-field">
        <label htmlFor="fp-email">Email address</label>
        <input id="fp-email" type="email" required autoComplete="email"
          value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com" />
      </div>
      <button type="submit" className="button" style={{ width: "100%" }}
        disabled={status === "submitting" || !email.trim()}>
        {status === "submitting" ? "Sending…" : "Send reset link"}
      </button>
      <p className="auth-switch"><a href="/login">Back to sign in ↗</a></p>
    </form>
  );
}

/* ResetPasswordForm moved to components/reset-password-form.tsx for useSearchParams support */
export { ResetPasswordForm } from "./reset-password-form";
