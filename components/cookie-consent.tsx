"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "aurelia-cookie-consent-v1";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(KEY)) setShow(true);
    } catch { /* storage unavailable — don't show */ }
  }, []);

  function decide(value: "accepted" | "rejected") {
    try { window.localStorage.setItem(KEY, value); } catch { /* ignore */ }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="cookie-consent" role="dialog" aria-label="Cookie consent" aria-live="polite">
      <div className="cookie-consent-inner">
        <p className="cookie-consent-text">
          We use only essential cookies to keep the site working. We don&apos;t track you or
          share your data. See our{" "}
          <Link href="/privacy-policy" className="cookie-consent-link">privacy policy</Link>.
        </p>
        <div className="cookie-consent-actions">
          <button type="button" className="button button-outline cookie-consent-btn"
            onClick={() => decide("rejected")}>
            Essential only
          </button>
          <button type="button" className="button cookie-consent-btn"
            onClick={() => decide("accepted")}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
