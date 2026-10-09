// bank-accounts-manager.tsx — no type-narrowing issues with provider field
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BankAccountPublic } from "@/lib/payments/bank-account-service";

const PROVIDERS = [
  { value: "AXIS",  label: "Axis Bank",            vpaHint: "e.g. business@axisbank" },
  { value: "ICICI", label: "ICICI Bank",            vpaHint: "e.g. business@icici" },
  { value: "HDFC",  label: "HDFC Bank",             vpaHint: "e.g. business@hdfcbank" },
  { value: "KOTAK", label: "Kotak Mahindra Bank",   vpaHint: "e.g. business@kotak" },
  { value: "BOB",   label: "Bank of Baroda",        vpaHint: "e.g. business@barodampay" },
];

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "#2e7d32", INACTIVE: "#706b62", PENDING_VERIFICATION: "#b77b00",
};

type Mode = "list" | "create" | "edit";

// Form state uses string for provider so Prisma's BankProvider enum and our
// local string values are both assignable without casts throughout the component.
type FormState = {
  provider: string; displayName: string; merchantVpa: string; merchantName: string;
  environment: string; isActive: boolean; isDefault: boolean;
  callbackUrl: string; webhookUrl: string; notes: string;
  apiKey: string; apiSecret: string; webhookSecret: string; merchantId: string;
};

const EMPTY_FORM: FormState = {
  provider: "AXIS", displayName: "", merchantVpa: "", merchantName: "",
  environment: "test", isActive: false, isDefault: false,
  callbackUrl: "", webhookUrl: "", notes: "",
  apiKey: "", apiSecret: "", webhookSecret: "", merchantId: "",
};

export function BankAccountsManager({ initial }: { initial: BankAccountPublic[] }) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(initial);
  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState<BankAccountPublic | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [busy, setBusy] = useState<string | null>(null); // which action is in progress
  const [msg,  setMsg]  = useState<{ text: string; ok: boolean } | null>(null);
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  function set(k: keyof FormState, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function refresh() {
    const res = await fetch("/api/admin/bank-accounts");
    const json = await res.json() as { accounts?: BankAccountPublic[] };
    if (json.accounts) setAccounts(json.accounts);
  }

  function openCreate() {
    setForm({ ...EMPTY_FORM }); setEditing(null); setMode("create"); setMsg(null);
  }

  function openEdit(acc: BankAccountPublic) {
    setForm({
      provider: acc.provider as string,
      displayName: acc.displayName, merchantVpa: acc.merchantVpa,
      merchantName: acc.merchantName, environment: acc.environment,
      isActive: acc.isActive, isDefault: acc.isDefault,
      callbackUrl: acc.callbackUrl ?? "", webhookUrl: acc.webhookUrl ?? "",
      notes: acc.notes ?? "",
      apiKey: "", apiSecret: "", webhookSecret: "", merchantId: "",
    });
    setEditing(acc); setMode("edit"); setMsg(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy("save"); setMsg(null);
    const payload: Record<string, unknown> = { ...form };
    // Don't send empty secret fields — leave existing encrypted values untouched.
    if (!form.apiKey.trim())       delete payload.apiKey;
    if (!form.apiSecret.trim())    delete payload.apiSecret;
    if (!form.webhookSecret.trim()) delete payload.webhookSecret;
    if (!form.merchantId.trim())   delete payload.merchantId;

    const url    = mode === "create" ? "/api/admin/bank-accounts" : `/api/admin/bank-accounts/${editing!.id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json   = await res.json() as { ok?: boolean; error?: string };
    setBusy(null);
    if (res.ok && json.ok) {
      setMsg({ text: mode === "create" ? "Account created." : "Account updated.", ok: true });
      await refresh(); setMode("list"); router.refresh();
    } else {
      setMsg({ text: json.error ?? "Save failed.", ok: false });
    }
  }

  async function testConnection(id: string) {
    setBusy(`test-${id}`);
    setTestResults(r => ({ ...r, [id]: "Testing…" }));
    const res  = await fetch(`/api/admin/bank-accounts/${id}/test`, { method: "POST" });
    const json = await res.json() as { ok?: boolean; message?: string };
    setBusy(null);
    setTestResults(r => ({ ...r, [id]: json.ok ? "✓ " + (json.message ?? "OK") : "✗ " + (json.message ?? "Failed") }));
  }

  async function setDefault(id: string) {
    setBusy(`default-${id}`);
    await fetch(`/api/admin/bank-accounts/${id}/set-default`, { method: "POST" });
    await refresh(); setBusy(null); router.refresh();
  }

  async function toggleActive(acc: BankAccountPublic) {
    setBusy(`toggle-${acc.id}`);
    await fetch(`/api/admin/bank-accounts/${acc.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !acc.isActive }),
    });
    await refresh(); setBusy(null); router.refresh();
  }

  const providerLabel = (p: string) => PROVIDERS.find(x => x.value === p)?.label ?? p;

  if (mode !== "list") {
    const isCreate = mode === "create";
    const hint = PROVIDERS.find(p => p.value === form.provider)?.vpaHint ?? "";
    return (
      <form onSubmit={save} style={{ maxWidth: "680px" }}>
        <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <button type="button" className="button button-outline" style={{ fontSize: ".78rem" }}
            onClick={() => { setMode("list"); setMsg(null); }}>
            ← Back
          </button>
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
            {isCreate ? "Add bank payment account" : `Edit — ${editing?.displayName}`}
          </h2>
        </div>

        <div className="admin-settings-section">
          <div className="admin-settings-form">
            <div className="contact-field">
              <label>Bank / Provider *</label>
              <select value={form.provider} onChange={e => set("provider", e.target.value)} className="admin-settings-input" disabled={!isCreate}>
                {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              {!isCreate && <span className="admin-settings-hint">Provider cannot be changed after creation.</span>}
            </div>
            <div className="contact-field">
              <label>Display name *</label>
              <input type="text" value={form.displayName} onChange={e => set("displayName", e.target.value)}
                placeholder="e.g. AURELIA Axis Merchant" required maxLength={120} className="admin-settings-input" />
            </div>
            <div className="contact-field">
              <label>Merchant UPI ID (VPA) *</label>
              <input type="text" value={form.merchantVpa} onChange={e => set("merchantVpa", e.target.value)}
                placeholder={hint} required maxLength={100} className="admin-settings-input" autoComplete="off" />
              <span className="admin-settings-hint">Your registered merchant UPI ID with this bank.</span>
            </div>
            <div className="contact-field">
              <label>Merchant / payee name</label>
              <input type="text" value={form.merchantName} onChange={e => set("merchantName", e.target.value)}
                placeholder="AURELIA" maxLength={100} className="admin-settings-input" />
              <span className="admin-settings-hint">Name shown to customers in their UPI app.</span>
            </div>
            <div className="contact-field">
              <label>Environment</label>
              <select value={form.environment} onChange={e => set("environment", e.target.value as "test"|"production")} className="admin-settings-input">
                <option value="test">Test / UAT</option>
                <option value="production">Production</option>
              </select>
            </div>
          </div>
        </div>

        <div className="admin-settings-section" style={{ marginTop: "1rem" }}>
          <div className="admin-settings-head">
            <span className="admin-settings-icon">🔐</span>
            <div>
              <h3 className="admin-settings-title">API Credentials</h3>
              <p className="admin-settings-sub">Encrypted at rest — never stored in plaintext. Leave blank to keep existing values.</p>
            </div>
          </div>
          <div className="admin-settings-form">
            {[
              { k: "apiKey" as const, label: "API Key / Client ID",
                ph: editing?.hasApiKey ? `Saved (${editing.apiKeyMasked}) — leave blank to keep` : "Paste API key from bank portal" },
              { k: "apiSecret" as const, label: "API Secret / Client Secret",
                ph: editing?.hasApiSecret ? `Saved (${editing.apiSecretMasked}) — leave blank to keep` : "Paste API secret from bank portal" },
              { k: "webhookSecret" as const, label: "Webhook Signing Secret",
                ph: editing?.hasWebhookSecret ? `Saved (${editing.webhookSecretMasked}) — leave blank to keep` : "HMAC key from bank webhook config" },
              { k: "merchantId" as const, label: "Merchant ID / MID",
                ph: editing?.hasMerchantId ? `Saved (${editing.merchantIdMasked}) — leave blank to keep` : "Merchant code assigned by the bank" },
            ].map(({ k, label, ph }) => (
              <div className="contact-field" key={k}>
                <label>{label}</label>
                <input type="password" value={form[k]} onChange={e => set(k, e.target.value)}
                  placeholder={ph} autoComplete="off" className="admin-settings-input" />
              </div>
            ))}
          </div>
        </div>

        <div className="admin-settings-section" style={{ marginTop: "1rem" }}>
          <div className="admin-settings-form">
            <div className="contact-field">
              <label>Callback / redirect URL</label>
              <input type="url" value={form.callbackUrl} onChange={e => set("callbackUrl", e.target.value)}
                placeholder="https://yourdomain.com/..." maxLength={500} className="admin-settings-input" />
              <span className="admin-settings-hint">Configure this in your bank merchant dashboard.</span>
            </div>
            <div className="contact-field">
              <label>Webhook URL (configure in bank dashboard)</label>
              <input type="text" readOnly value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/bank/${form.provider.toLowerCase()}`}
                className="admin-settings-input" style={{ background: "var(--canvas)", color: "var(--muted)", cursor: "copy" }}
                onClick={e => (e.target as HTMLInputElement).select()} />
              <span className="admin-settings-hint">Copy this URL into your bank&apos;s webhook / callback configuration.</span>
            </div>
            <div className="contact-field">
              <label>Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)}
                maxLength={1000} className="admin-settings-input" />
            </div>
            <label className="admin-toggle-row">
              <input type="checkbox" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} />
              <span>Active (enable for new payment sessions)</span>
            </label>
            <label className="admin-toggle-row">
              <input type="checkbox" checked={form.isDefault} onChange={e => set("isDefault", e.target.checked)} />
              <span>Set as default account for this bank</span>
            </label>
          </div>
        </div>

        {msg && <p className={msg.ok ? "newsletter-success" : "contact-field-error"} role="status">{msg.text}</p>}
        <div style={{ display: "flex", gap: ".8rem", marginTop: "1.5rem" }}>
          <button type="submit" className="button" disabled={busy === "save"}>
            {busy === "save" ? "Saving…" : isCreate ? "Create account" : "Save changes"}
          </button>
          <button type="button" className="button button-outline" onClick={() => { setMode("list"); setMsg(null); }}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "1.2rem", display: "flex", gap: ".8rem", flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" className="button" onClick={openCreate}>+ Add bank account</button>
        <p className="muted" style={{ fontSize: ".78rem", margin: 0 }}>
          Add one account per bank. Set one as default — new payment sessions use the default account.
          Changing defaults only affects future payments; existing sessions keep their original account.
        </p>
      </div>

      {accounts.length === 0 && (
        <div className="admin-empty-state">
          No bank accounts configured yet. Click &quot;Add bank account&quot; to get started.
        </div>
      )}

      <div className="bank-accounts-list">
        {accounts.map(acc => (
          <div key={acc.id} className={`bank-account-card${acc.isDefault ? " bank-account-card--default" : ""}${!acc.isActive ? " bank-account-card--inactive" : ""}`}>
            <div className="bank-account-header">
              <div>
                <span className="bank-account-provider">{providerLabel(acc.provider)}</span>
                {acc.isDefault && <span className="bank-account-badge bank-account-badge--default">Default</span>}
                {!acc.isActive && <span className="bank-account-badge bank-account-badge--inactive">Inactive</span>}
                <h3 className="bank-account-name">{acc.displayName}</h3>
                <p className="bank-account-vpa">{acc.merchantVpa}</p>
              </div>
              <div>
                <span className="payment-status" style={{ color: STATUS_COLOR[acc.status] ?? "#706b62", background: "#f5f5f0", fontSize: ".7rem" }}>
                  {acc.status.replace(/_/g, " ")}
                </span>
                <span style={{ display: "block", fontSize: ".7rem", color: "var(--muted)", marginTop: ".2rem" }}>
                  {acc.environment === "production" ? "🟢 Production" : "🟡 Test / UAT"}
                </span>
              </div>
            </div>

            <div className="bank-account-creds">
              {[
                { label: "API Key",      has: acc.hasApiKey,        masked: acc.apiKeyMasked },
                { label: "API Secret",   has: acc.hasApiSecret,     masked: acc.apiSecretMasked },
                { label: "Webhook Key",  has: acc.hasWebhookSecret, masked: acc.webhookSecretMasked },
                { label: "Merchant ID",  has: acc.hasMerchantId,    masked: acc.merchantIdMasked },
              ].map(c => (
                <span key={c.label} className={`bank-cred-tag${c.has ? " bank-cred-tag--set" : " bank-cred-tag--missing"}`}>
                  {c.has ? `✓ ${c.label}: ${c.masked}` : `✗ ${c.label} not set`}
                </span>
              ))}
            </div>

            {acc.lastTestedAt && (
              <p className="bank-account-test-result" style={{ color: acc.lastTestResult === "ok" ? "#2e7d32" : "#c0392b" }}>
                Last test: {new Date(acc.lastTestedAt).toLocaleString("en-IN")} — {acc.lastTestResult ?? ""}
              </p>
            )}
            {testResults[acc.id] && (
              <p className="bank-account-test-result" style={{ color: testResults[acc.id].startsWith("✓") ? "#2e7d32" : "#c0392b" }}>
                {testResults[acc.id]}
              </p>
            )}

            <div className="bank-account-actions">
              <button type="button" className="button" style={{ fontSize: ".73rem", padding: ".4rem .8rem" }}
                onClick={() => openEdit(acc)}>Edit</button>
              <button type="button" className="button button-outline" style={{ fontSize: ".73rem", padding: ".4rem .8rem" }}
                disabled={busy === `test-${acc.id}`}
                onClick={() => testConnection(acc.id)}>
                {busy === `test-${acc.id}` ? "Testing…" : "Test connection"}
              </button>
              {!acc.isDefault && (
                <button type="button" className="button button-outline" style={{ fontSize: ".73rem", padding: ".4rem .8rem" }}
                  disabled={busy === `default-${acc.id}`}
                  onClick={() => setDefault(acc.id)}>
                  Set default
                </button>
              )}
              <button type="button" className="button button-outline" style={{ fontSize: ".73rem", padding: ".4rem .8rem",
                color: acc.isActive ? "#c0392b" : "#2e7d32", borderColor: acc.isActive ? "#c0392b" : "#2e7d32" }}
                disabled={busy === `toggle-${acc.id}`}
                onClick={() => toggleActive(acc)}>
                {acc.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
