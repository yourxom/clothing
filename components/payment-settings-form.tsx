"use client";
import { useState, useRef } from "react";
import type { PaymentSettingsPublic } from "@/lib/payments/settings";

export function PaymentSettingsForm({ initial }: { initial: PaymentSettingsPublic }) {
  // ── Global toggles ──────────────────────────────────────────────
  const [merchantEnabled, setMerchantEnabled] = useState(initial.merchantUpiEnabled);
  const [personalEnabled, setPersonalEnabled] = useState(initial.personalUpiEnabled);
  const [defaultMethod,   setDefaultMethod]   = useState<"MERCHANT_UPI" | "PERSONAL_UPI">(initial.defaultMethod);

  // ── Merchant UPI ─────────────────────────────────────────────────
  const [provider,       setProvider]       = useState(initial.merchant.provider || "razorpay");
  const [merchantName,   setMerchantName]   = useState(initial.merchant.name);
  const [merchantId,     setMerchantId]     = useState(initial.merchant.merchantId);
  const [merchantVpa,    setMerchantVpa]    = useState(initial.merchant.vpa);
  const [environment,    setEnvironment]    = useState(initial.merchant.environment);
  const [autoVerify,     setAutoVerify]     = useState(initial.merchant.autoVerify);
  const [apiKey,         setApiKey]         = useState("");
  const [apiSecret,      setApiSecret]      = useState("");
  const [webhookSecret,  setWebhookSecret]  = useState("");

  // ── Personal UPI ─────────────────────────────────────────────────
  const [accountName,  setAccountName]  = useState(initial.personal.accountName);
  const [upiId,         setUpiId]        = useState(initial.personal.upiId);
  const [bankName,      setBankName]     = useState(initial.personal.bankName);
  const [instructions,  setInstructions] = useState(initial.personal.instructions);
  const [useDynamicQr,  setUseDynamicQr] = useState(initial.personal.useDynamicQr);
  const [qrImageUrl,    setQrImageUrl]   = useState(initial.personal.qrImageUrl);
  const [qrUploading,   setQrUploading]  = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<"idle"|"saving"|"done"|"error">("idle");
  const [msg,    setMsg]    = useState("");

  async function uploadQr(file: File) {
    setQrUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/settings/payments/qr-upload", { method: "POST", body: fd });
      const json = await res.json() as { ok?: boolean; url?: string; error?: string };
      if (res.ok && json.ok && json.url) {
        setQrImageUrl(json.url);
      } else {
        setMsg(json.error ?? "QR upload failed.");
        setStatus("error");
      }
    } catch {
      setMsg("Network error during QR upload.");
      setStatus("error");
    } finally {
      setQrUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving"); setMsg("");

    const payload: Record<string, unknown> = {
      merchantUpiEnabled: merchantEnabled,
      personalUpiEnabled: personalEnabled,
      defaultMethod,

      merchantProvider: provider,
      merchantName,
      merchantMerchantId: merchantId,
      merchantVpa,
      merchantEnvironment: environment,
      merchantAutoVerify: autoVerify,

      personalAccountName: accountName,
      personalUpiId: upiId,
      personalQrImageUrl: qrImageUrl,
      personalBankName: bankName,
      personalInstructions: instructions,
      personalUseDynamicQr: useDynamicQr,
    };
    // Only send secrets when the admin actually typed something new.
    if (apiKey.trim()) payload.merchantApiKey = apiKey.trim();
    if (apiSecret.trim()) payload.merchantApiSecret = apiSecret.trim();
    if (webhookSecret.trim()) payload.merchantWebhookSecret = webhookSecret.trim();

    try {
      const res = await fetch("/api/admin/settings/payments", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (res.ok && json.ok) {
        setStatus("done"); setMsg("Payment settings saved.");
        setApiKey(""); setApiSecret(""); setWebhookSecret("");
      } else {
        setStatus("error"); setMsg(json.error ?? "Could not save settings.");
      }
    } catch {
      setStatus("error"); setMsg("Network error. Try again.");
    }
  }

  const merchantCredsReady = initial.merchant.hasApiKey && initial.merchant.hasApiSecret;

  return (
    <form onSubmit={save}>
      {/* ── Method selection ──────────────────────────────────────── */}
      <div className="admin-settings-section" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-settings-head">
          <span className="admin-settings-icon" aria-hidden="true">💳</span>
          <div>
            <h2 className="admin-settings-title">Active payment methods</h2>
            <p className="admin-settings-sub">
              Enable one or both. If both are enabled, the customer picks at checkout.
            </p>
          </div>
        </div>
        <div className="admin-settings-form">
          <label className="admin-toggle-row">
            <input type="checkbox" checked={merchantEnabled} onChange={e => setMerchantEnabled(e.target.checked)} />
            <span>
              Enable Merchant UPI (automatic verification)
              {merchantEnabled && !merchantCredsReady && (
                <strong style={{ color: "#b77b00", display: "block", fontSize: ".74rem", fontWeight: 500 }}>
                  ⚠ Not usable yet — API key &amp; secret are not configured below.
                </strong>
              )}
            </span>
          </label>
          <label className="admin-toggle-row">
            <input type="checkbox" checked={personalEnabled} onChange={e => setPersonalEnabled(e.target.checked)} />
            <span>
              Enable Personal UPI (manual verification)
              {personalEnabled && !upiId && (
                <strong style={{ color: "#b77b00", display: "block", fontSize: ".74rem", fontWeight: 500 }}>
                  ⚠ Not usable yet — UPI ID is not set below.
                </strong>
              )}
            </span>
          </label>

          <div className="contact-field">
            <label htmlFor="default-method">Default method shown first at checkout</label>
            <select id="default-method" value={defaultMethod}
              onChange={e => setDefaultMethod(e.target.value as "MERCHANT_UPI" | "PERSONAL_UPI")}
              className="admin-settings-input">
              <option value="PERSONAL_UPI">Personal UPI</option>
              <option value="MERCHANT_UPI">Merchant UPI</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Merchant UPI settings ──────────────────────────────────── */}
      <div className="admin-settings-section" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-settings-head">
          <span className="admin-settings-icon" aria-hidden="true">⚡</span>
          <div>
            <h2 className="admin-settings-title">Merchant UPI — automatic verification</h2>
            <p className="admin-settings-sub">
              Connects to a payment provider (e.g. Razorpay) so payments are confirmed automatically
              via a verified webhook. Credentials below are encrypted at rest and never sent to the browser.
            </p>
          </div>
        </div>
        <div className="admin-settings-form">
          <div className="contact-field">
            <label htmlFor="mp-provider">Provider</label>
            <select id="mp-provider" value={provider} onChange={e => setProvider(e.target.value)}
              className="admin-settings-input">
              <option value="razorpay">Razorpay</option>
              <option value="axis">Axis Bank (direct UPI)</option>
              <option value="icici">ICICI Bank (direct UPI)</option>
              <option value="hdfc">HDFC Bank (direct UPI)</option>
              <option value="kotak">Kotak Mahindra Bank (direct UPI)</option>
              <option value="bob">Bank of Baroda (direct UPI)</option>
            </select>
            <span className="admin-settings-hint">
              For direct bank UPI, configure credentials in{" "}
              <a href="/admin/payment-accounts" style={{ color: "var(--accent)" }}>Bank Payment Accounts →</a>
            </span>
          </div>

          <div className="contact-field">
            <label htmlFor="mp-name">Display name</label>
            <input id="mp-name" type="text" value={merchantName} onChange={e => setMerchantName(e.target.value)}
              placeholder="UPI — Instant Confirmation" maxLength={100} className="admin-settings-input" />
            <span className="admin-settings-hint">Shown to customers at checkout as the method name.</span>
          </div>

          <div className="contact-field">
            <label htmlFor="mp-merchant-id">Merchant ID</label>
            <input id="mp-merchant-id" type="text" value={merchantId} onChange={e => setMerchantId(e.target.value)}
              maxLength={100} className="admin-settings-input" />
          </div>

          <div className="contact-field">
            <label htmlFor="mp-vpa">UPI ID / VPA (optional, provider-dependent)</label>
            <input id="mp-vpa" type="text" value={merchantVpa} onChange={e => setMerchantVpa(e.target.value)}
              placeholder="business@upi" maxLength={100} className="admin-settings-input" />
          </div>

          <div className="contact-field">
            <label htmlFor="mp-key">API key</label>
            <input id="mp-key" type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder={initial.merchant.hasApiKey ? `Saved (${initial.merchant.apiKeyMasked}) — leave blank to keep` : "rzp_test_... / rzp_live_..."}
              autoComplete="off" className="admin-settings-input" />
          </div>

          <div className="contact-field">
            <label htmlFor="mp-secret">API secret</label>
            <input id="mp-secret" type="password" value={apiSecret} onChange={e => setApiSecret(e.target.value)}
              placeholder={initial.merchant.hasApiSecret ? `Saved (${initial.merchant.apiSecretMasked}) — leave blank to keep` : "Your API secret"}
              autoComplete="off" className="admin-settings-input" />
          </div>

          <div className="contact-field">
            <label htmlFor="mp-webhook-secret">Webhook secret</label>
            <input id="mp-webhook-secret" type="password" value={webhookSecret} onChange={e => setWebhookSecret(e.target.value)}
              placeholder={initial.merchant.hasWebhookSecret ? `Saved (${initial.merchant.webhookSecretMasked}) — leave blank to keep` : "Set in your provider's webhook dashboard"}
              autoComplete="off" className="admin-settings-input" />
            <span className="admin-settings-hint">
              Used to verify that webhook calls genuinely came from the provider. Configure the same
              secret in your provider's dashboard when you set up the webhook URL (see below).
            </span>
          </div>

          <div className="contact-field">
            <label htmlFor="mp-env">Environment</label>
            <select id="mp-env" value={environment} onChange={e => setEnvironment(e.target.value as "test" | "production")}
              className="admin-settings-input">
              <option value="test">Test</option>
              <option value="production">Production</option>
            </select>
          </div>

          <label className="admin-toggle-row">
            <input type="checkbox" checked={autoVerify} onChange={e => setAutoVerify(e.target.checked)} />
            <span>Enable automatic verification (via webhook/API)</span>
          </label>

          <p className="admin-settings-hint">
            Webhook URL to configure in your provider&apos;s dashboard:{" "}
            <code style={{ fontSize: ".78rem", background: "var(--canvas)", padding: ".1rem .3rem", borderRadius: "3px" }}>
              {typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/{provider || "razorpay"}
            </code>
          </p>
        </div>
      </div>

      {/* ── Personal UPI settings ──────────────────────────────────── */}
      <div className="admin-settings-section" style={{ marginBottom: "1.5rem" }}>
        <div className="admin-settings-head">
          <span className="admin-settings-icon" aria-hidden="true">🧾</span>
          <div>
            <h2 className="admin-settings-title">Personal UPI — manual verification</h2>
            <p className="admin-settings-sub">
              Customer pays directly to your UPI ID and submits the UTR for you to verify by hand
              against your bank/UPI app.
            </p>
          </div>
        </div>
        <div className="admin-settings-form">
          <div className="contact-field">
            <label htmlFor="pp-account-name">Account holder name</label>
            <input id="pp-account-name" type="text" value={accountName} onChange={e => setAccountName(e.target.value)}
              maxLength={100} className="admin-settings-input" />
          </div>

          <div className="contact-field">
            <label htmlFor="pp-upi-id">UPI ID</label>
            <input id="pp-upi-id" type="text" value={upiId} onChange={e => setUpiId(e.target.value)}
              placeholder="example@upi" maxLength={100} className="admin-settings-input" />
          </div>

          <div className="contact-field">
            <label htmlFor="pp-bank">Bank name (optional)</label>
            <input id="pp-bank" type="text" value={bankName} onChange={e => setBankName(e.target.value)}
              maxLength={100} className="admin-settings-input" />
          </div>

          <div className="contact-field">
            <label htmlFor="pp-instructions">Payment instructions (shown to customer)</label>
            <textarea id="pp-instructions" rows={3} value={instructions} maxLength={1000}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Scan the QR or pay to the UPI ID above, then submit your UTR."
              className="admin-settings-input" />
          </div>

          <label className="admin-toggle-row">
            <input type="checkbox" checked={useDynamicQr} onChange={e => setUseDynamicQr(e.target.checked)} />
            <span>Generate QR dynamically from the UPI ID + exact order amount (recommended)</span>
          </label>

          {!useDynamicQr && (
            <div className="contact-field">
              <label htmlFor="pp-qr-upload">Upload a static QR image instead</label>
              <input ref={fileInputRef} id="pp-qr-upload" type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadQr(f); }}
                className="admin-settings-input" disabled={qrUploading} />
              {qrUploading && <span className="admin-settings-hint">Uploading…</span>}
              {qrImageUrl && !qrUploading && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrImageUrl} alt="Uploaded UPI QR" style={{ marginTop: ".6rem", width: "140px", border: "1px solid var(--line)", borderRadius: "4px" }} />
              )}
              <span className="admin-settings-hint">
                Note: a static QR encodes no amount — customers must enter it manually in their UPI app.
                Dynamic QR (above) is strongly preferred since it fills the exact order amount automatically.
              </span>
            </div>
          )}
        </div>
      </div>

      {msg && (
        <p className={status === "done" ? "newsletter-success" : "contact-field-error"} role="status">
          {msg}
        </p>
      )}

      <button type="submit" className="button" disabled={status === "saving"}>
        {status === "saving" ? "Saving…" : "Save payment settings"}
      </button>
    </form>
  );
}
