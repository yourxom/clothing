"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AureliaLogo } from "./aurelia-logo";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface OtpModalProps {
  /** Whether this is for "login" or "checkout" — changes copy */
  mode?: "login" | "checkout";
  /** Called when phone number is successfully verified */
  onVerified?: (mobile: string) => void;
  /** Called when the user dismisses the modal */
  onClose?: () => void;
}

type Step = "phone" | "otp";

const RESEND_COOLDOWN = 30; // seconds

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export function OtpModal({ mode = "login", onVerified, onClose }: OtpModalProps) {
  const [step, setStep] = useState<Step>("phone");
  const [mobile, setMobile] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start / restart resend cooldown timer
  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  /* ── Send OTP ── */
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setSuccess(data.message);
    setStep("otp");
    startCooldown();
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }

  /* ── OTP digit input handler ── */
  function handleDigitChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleDigitPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      setOtpDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  }

  /* ── Verify OTP ── */
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const otp = otpDigits.join("");
    if (otp.length < 6) { setError("Please enter all 6 digits."); return; }

    setError("");
    setLoading(true);

    const res = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, otp }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Verification failed.");
      return;
    }

    setSuccess("✓ Verified!");
    onVerified?.(mobile);
  }

  /* ── Resend OTP ── */
  async function handleResend() {
    if (cooldown > 0) return;
    setError("");
    setOtpDigits(["", "", "", "", "", ""]);
    setLoading(true);

    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Could not resend OTP."); return; }
    setSuccess("New OTP sent!");
    startCooldown();
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }

  /* ── Modal backdrop click ── */
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose?.();
  }

  const headings = {
    login:    { title: "Sign in to AURELIA",       sub: "We'll send a one-time code to your mobile" },
    checkout: { title: "Verify your phone number", sub: "Required to confirm your order" },
  };

  return (
    <div className="otp-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="otp-card">
        {/* Close button */}
        <button className="otp-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Aurelia Brand Logo */}
        <div className="otp-logo" style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "center" }}>
          <AureliaLogo size={52} />
        </div>

        {/* Headings */}
        <h2 className="otp-title">{headings[mode].title}</h2>
        <p className="otp-sub">{step === "phone" ? headings[mode].sub : `Code sent to +91 ${mobile}`}</p>

        {/* Feedback */}
        {error   && <p className="otp-feedback otp-error">{error}</p>}
        {success && !error && <p className="otp-feedback otp-success">{success}</p>}

        {/* ── Step 1: Phone entry ── */}
        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="otp-form">
            <div className="otp-phone-row">
              <span className="otp-flag">🇮🇳 +91</span>
              <input
                id="otp-mobile-input"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="otp-phone-input"
                required
                autoComplete="tel-national"
              />
            </div>
            <button type="submit" className="otp-btn" disabled={loading || mobile.length < 10}>
              {loading ? "Sending…" : "Send OTP"}
            </button>
          </form>
        )}

        {/* ── Step 2: OTP entry ── */}
        {step === "otp" && (
          <form onSubmit={handleVerify} className="otp-form">
            <div className="otp-digits" onPaste={handleDigitPaste}>
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  className="otp-digit"
                  aria-label={`OTP digit ${i + 1}`}
                />
              ))}
            </div>

            <button type="submit" className="otp-btn" disabled={loading || otpDigits.join("").length < 6}>
              {loading ? "Verifying…" : "Verify"}
            </button>

            <div className="otp-resend-row">
              <button
                type="button"
                className="otp-resend"
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
              </button>
              <button type="button" className="otp-change" onClick={() => { setStep("phone"); setError(""); setSuccess(""); }}>
                Change number
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .otp-backdrop {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,.55);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          animation: otp-fade-in .2s ease;
        }
        @keyframes otp-fade-in { from { opacity:0 } to { opacity:1 } }

        .otp-card {
          position: relative;
          background: #fff;
          border-radius: 20px;
          padding: 2.5rem 2rem 2rem;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 24px 60px rgba(0,0,0,.18);
          text-align: center;
          animation: otp-slide-up .25s cubic-bezier(.22,1,.36,1);
        }
        @keyframes otp-slide-up { from { transform: translateY(20px); opacity:0 } to { transform: translateY(0); opacity:1 } }

        .otp-close {
          position: absolute; top: 1rem; right: 1rem;
          background: none; border: none; cursor: pointer;
          font-size: 1rem; color: #888;
          transition: color .15s;
        }
        .otp-close:hover { color: #222; }

        .otp-logo { margin-bottom: 1.25rem; }

        .otp-title {
          font-size: 1.35rem; font-weight: 700;
          color: #1a1a1a; margin: 0 0 .4rem;
          letter-spacing: -.02em;
        }
        .otp-sub {
          font-size: .875rem; color: #666;
          margin: 0 0 1.25rem;
          line-height: 1.5;
        }

        .otp-feedback {
          font-size: .825rem; padding: .6rem 1rem;
          border-radius: 8px; margin-bottom: 1rem;
        }
        .otp-error   { background: #fff0f0; color: #c0392b; }
        .otp-success { background: #f0faf4; color: #27ae60; }

        .otp-form { display: flex; flex-direction: column; gap: .875rem; }

        .otp-phone-row {
          display: flex; align-items: center;
          border: 1.5px solid #e2e2e2; border-radius: 12px;
          overflow: hidden;
          transition: border-color .2s;
        }
        .otp-phone-row:focus-within { border-color: #1a1a1a; }
        .otp-flag {
          padding: 0 .75rem; font-size: .9rem;
          background: #f7f7f7; border-right: 1.5px solid #e2e2e2;
          height: 100%; display: flex; align-items: center;
          white-space: nowrap; color: #444;
        }
        .otp-phone-input {
          flex: 1; border: none; outline: none;
          padding: .9rem .75rem;
          font-size: 1rem; background: transparent;
          letter-spacing: .05em;
        }

        .otp-btn {
          padding: .9rem;
          background: #1a1a1a; color: #fff;
          border: none; border-radius: 12px;
          font-size: 1rem; font-weight: 600; cursor: pointer;
          transition: background .2s, transform .1s;
        }
        .otp-btn:hover:not(:disabled)  { background: #333; }
        .otp-btn:active:not(:disabled) { transform: scale(.98); }
        .otp-btn:disabled { opacity: .5; cursor: not-allowed; }

        .otp-digits {
          display: flex; gap: .5rem; justify-content: center;
        }
        .otp-digit {
          width: 3rem; height: 3.5rem;
          text-align: center; font-size: 1.4rem; font-weight: 700;
          border: 2px solid #e2e2e2; border-radius: 10px;
          outline: none; transition: border-color .2s, box-shadow .2s;
          caret-color: transparent;
        }
        .otp-digit:focus {
          border-color: #1a1a1a;
          box-shadow: 0 0 0 3px rgba(26,26,26,.1);
        }

        .otp-resend-row {
          display: flex; justify-content: space-between;
          align-items: center; margin-top: .25rem;
        }
        .otp-resend, .otp-change {
          background: none; border: none; cursor: pointer;
          font-size: .8rem; color: #888;
          transition: color .15s;
        }
        .otp-resend:hover:not(:disabled), .otp-change:hover { color: #1a1a1a; }
        .otp-resend:disabled { cursor: default; }
        .otp-change { color: #1a1a1a; text-decoration: underline; }
      `}</style>
    </div>
  );
}
