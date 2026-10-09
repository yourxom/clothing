"use client";
import { useState } from "react";

type EmailInit = { enabled: boolean; from: string; apiKeyMasked: string; hasApiKey: boolean };
type SmsInit = {
  enabled: boolean; provider: string; senderId: string;
  dltTemplateId: string; authTemplate: string; apiKeyMasked: string; hasApiKey: boolean;
};

export function IntegrationsSettingsForm({ email, sms }: { email: EmailInit; sms: SmsInit }) {
  // Email state
  const [emailEnabled, setEmailEnabled] = useState(email.enabled);
  const [emailFrom,    setEmailFrom]    = useState(email.from);
  const [emailApiKey,  setEmailApiKey]  = useState("");

  // SMS state
  const [smsEnabled,      setSmsEnabled]      = useState(sms.enabled);
  const [smsProvider,     setSmsProvider]     = useState(sms.provider || "smshorizon");
  const [smsSenderId,     setSmsSenderId]     = useState(sms.senderId);
  const [smsDltTemplateId,setSmsDltTemplateId]= useState(sms.dltTemplateId || "");
  const [smsTemplate,     setSmsTemplate]     = useState(sms.authTemplate);
  const [smsApiKey,       setSmsApiKey]       = useState("");

  const [status, setStatus] = useState<"idle"|"saving"|"done"|"error">("idle");
  const [msg,    setMsg]    = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving"); setMsg("");
    const payload: Record<string, unknown> = {
      emailEnabled,
      emailFrom,
      smsEnabled,
      smsProvider,
      smsSenderId,
      smsDltTemplateId,
      smsAuthTemplate: smsTemplate,
    };
    if (emailApiKey.trim()) payload.emailApiKey    = emailApiKey.trim();
    if (smsApiKey.trim())   payload.smsApiKey      = smsApiKey.trim();

    const res  = await fetch("/api/admin/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json() as { ok?: boolean; error?: string };
    if (res.ok && json.ok) {
      setStatus("done"); setMsg("Integration settings saved.");
      setEmailApiKey(""); setSmsApiKey("");
    } else {
      setStatus("error"); setMsg(json.error ?? "Could not save settings.");
    }
  }

  const isSmsHorizon = smsProvider === "smshorizon";
  const isTwilio     = smsProvider === "twilio";

  return (
    <form className="admin-settings-form" onSubmit={save}>
      {/* ── EMAIL ─────────────────────────────────────────── */}
      <h3 className="admin-settings-title" style={{ fontSize: "1rem" }}>Email (Brevo &amp; Gmail SMTP)</h3>
      <label className="admin-toggle-row">
        <input type="checkbox" checked={emailEnabled} onChange={e => setEmailEnabled(e.target.checked)} />
        <span>Send transactional emails (orders, OTP, password reset, restock)</span>
      </label>

      <div className="contact-field">
        <label htmlFor="email-from">From address</label>
        <input id="email-from" type="text" value={emailFrom}
          onChange={e => setEmailFrom(e.target.value)}
          placeholder="AURELIA <inaureliaa@gmail.com>" maxLength={200}
          className="admin-settings-input" />
        <span className="admin-settings-hint">Must match your verified sender in Brevo (e.g. AURELIA &lt;inaureliaa@gmail.com&gt;).</span>
      </div>

      <div className="contact-field">
        <label htmlFor="email-key">Brevo API key</label>
        <input id="email-key" type="password" value={emailApiKey}
          onChange={e => setEmailApiKey(e.target.value)}
          placeholder={email.hasApiKey ? `Saved (${email.apiKeyMasked}) — leave blank to keep` : "xkeysib-..."}
          autoComplete="off" className="admin-settings-input" />
        <span className="admin-settings-hint">
          {email.hasApiKey ? "A key is stored. Enter a new one only to replace it." : "From app.brevo.com → SMTP & API → API Keys tab."}
        </span>
      </div>

      {/* ── SMS ──────────────────────────────────────────── */}
      <h3 className="admin-settings-title" style={{ fontSize: "1rem", marginTop: "1.5rem" }}>
        SMS (phone OTP)
      </h3>
      <label className="admin-toggle-row">
        <input type="checkbox" checked={smsEnabled} onChange={e => setSmsEnabled(e.target.checked)} />
        <span>Send verification codes by SMS (registration, login, password reset, checkout)</span>
      </label>

      <div className="contact-field">
        <label htmlFor="sms-provider">Provider</label>
        <select id="sms-provider" value={smsProvider}
          onChange={e => setSmsProvider(e.target.value)} className="admin-settings-input">
          <option value="smshorizon">SMS Horizon — smshorizon.in (recommended for India)</option>
          <option value="msg91">MSG91 (India)</option>
          <option value="twilio">Twilio (international)</option>
        </select>
        {isSmsHorizon && (
          <span className="admin-settings-hint">
            Sign up at{" "}
            <a href="https://www.smshorizon.in" target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--accent)" }}>smshorizon.in</a>
            {" "}→ get your API key from the dashboard. 500 free SMS credits on signup, no card required.
          </span>
        )}
      </div>

      <div className="contact-field">
        <label htmlFor="sms-key">
          {isTwilio ? "Twilio credentials (AccountSID:AuthToken)" : "API key / auth key"}
        </label>
        <input id="sms-key" type="password" value={smsApiKey}
          onChange={e => setSmsApiKey(e.target.value)}
          placeholder={
            sms.hasApiKey
              ? `Saved (${sms.apiKeyMasked}) — leave blank to keep`
              : isTwilio
                ? "AC...:your_token"
                : isSmsHorizon
                  ? "Bearer token from smshorizon.in dashboard"
                  : "MSG91 auth key"
          }
          autoComplete="off" className="admin-settings-input" />
        <span className="admin-settings-hint">
          {isTwilio
            ? "Format: AccountSID:AuthToken (colon-separated)."
            : isSmsHorizon
              ? "Copy your API key from smshorizon.in → Dashboard → API Keys."
              : "Your MSG91 authkey from the MSG91 dashboard."}
        </span>
      </div>

      <div className="contact-field">
        <label htmlFor="sms-sender">
          {isTwilio ? "Twilio from-number" : "Sender ID (DLT registered header)"}
        </label>
        <input id="sms-sender" type="text" value={smsSenderId}
          onChange={e => setSmsSenderId(e.target.value)}
          placeholder={isTwilio ? "+1..." : isSmsHorizon ? "HORIZN" : "AURLIA"}
          maxLength={isTwilio ? 20 : 6}
          className="admin-settings-input" />
        <span className="admin-settings-hint">
          {isTwilio
            ? "Your Twilio phone number in E.164 format."
            : "6-character alphanumeric sender ID registered on the TRAI DLT portal (mandatory in India)."}
        </span>
      </div>

      {!isTwilio && (
        <div className="contact-field">
          <label htmlFor="sms-dlt">DLT Template ID</label>
          <input id="sms-dlt" type="text" value={smsDltTemplateId}
            onChange={e => setSmsDltTemplateId(e.target.value)}
            placeholder="1107160521253456789" maxLength={50}
            className="admin-settings-input" />
          <span className="admin-settings-hint">
            The numeric template ID from the TRAI DLT portal for your OTP message template.
            Required by TRAI since October 2020 — SMS will fail without it.
            {isSmsHorizon && (
              <> SMS Horizon provides this during DLT registration assistance.</>
            )}
          </span>
        </div>
      )}

      <div className="contact-field">
        <label htmlFor="sms-template">OTP message template</label>
        <textarea id="sms-template" rows={2} value={smsTemplate} maxLength={300}
          onChange={e => setSmsTemplate(e.target.value)}
          placeholder="{code} is your AURELIA verification code. Valid for 10 minutes. Do not share."
          className="admin-settings-input" />
        <span className="admin-settings-hint">
          Use <code>{"{code}"}</code> where the 6-digit code should appear.
          This must exactly match your DLT-registered template (variable parts go in {"{#var#}"} blocks per DLT rules).
        </span>
      </div>

      {msg && (
        <p className={status === "done" ? "newsletter-success" : "contact-field-error"} role="status">
          {msg}
        </p>
      )}

      <button type="submit" className="button" disabled={status === "saving"} style={{ marginTop: ".5rem" }}>
        {status === "saving" ? "Saving…" : "Save integration settings"}
      </button>
    </form>
  );
}
