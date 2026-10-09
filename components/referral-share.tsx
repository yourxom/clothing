"use client";
import { useState } from "react";

// Copyable referral code + link. Client-only so it can use the clipboard API.
export function ReferralShare({ code, link }: { code: string; link: string }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  async function copy(value: string, which: "code" | "link") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard blocked — user can select manually */
    }
  }

  return (
    <div className="refer-share">
      <div className="refer-share-row">
        <div className="refer-share-field">
          <span className="refer-share-label">Your code</span>
          <code className="refer-share-code">{code}</code>
        </div>
        <button type="button" className="button button-outline" onClick={() => copy(code, "code")}>
          {copied === "code" ? "Copied ✓" : "Copy code"}
        </button>
      </div>
      <div className="refer-share-row">
        <div className="refer-share-field">
          <span className="refer-share-label">Your link</span>
          <span className="refer-share-link">{link}</span>
        </div>
        <button type="button" className="button" onClick={() => copy(link, "link")}>
          {copied === "link" ? "Copied ✓" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
