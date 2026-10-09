"use client";
import { useState } from "react";

type Coupon = {
  id: string; code: string; description: string | null;
  discountType: string; discountValue: number; minOrderPaise: number;
  usageLimit: number | null; usageCount: number; active: boolean;
  expiresAt: string | null; label: string;
  scope?: string; ownerLabel?: string | null;
};

type UserHit = { id: string; name: string | null; email: string | null; phone: string | null };

function userLabel(u: UserHit): string {
  return u.name || u.email || (u.phone ? `+91 ${u.phone}` : u.id);
}

type AnalyticsRow = {
  id: string; user: string; orderNumber: string; orderStatus: string;
  discountPaise: number; totalPaise: number; redeemedAt: string;
};
type Analytics = {
  coupon: { id: string; code: string; scope: string; usageLimit: number | null };
  stats: {
    redemptions: number; uniqueUsers: number;
    totalDiscountPaise: number; totalRevenuePaise: number;
    avgOrderPaise: number; countedOrders: number;
  };
  rows: AnalyticsRow[];
};

function rupees(paise: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
    .format(paise / 100);
}

const EMPTY_FORM = {
  code: "", description: "", discountType: "PERCENT",
  discountValue: "", minOrderRupees: "", usageLimit: "", expiresAt: "",
  scope: "GENERAL",
};

export function CouponManager({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  // Welcome-coupon backfill
  const [backfilling, setBackfilling] = useState(false);
  const [backfillMsg, setBackfillMsg] = useState("");

  // Per-coupon analytics (expandable panel)
  const [analyticsFor, setAnalyticsFor] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Personal-coupon user picker
  const [userQuery, setUserQuery] = useState("");
  const [userHits, setUserHits] = useState<UserHit[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserHit | null>(null);
  const [searching, setSearching] = useState(false);

  async function searchUsers(q: string) {
    setUserQuery(q);
    setSelectedUser(null);
    if (q.trim().length < 2) { setUserHits([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(q)}`);
      const json = await res.json() as { ok?: boolean; users?: UserHit[] };
      setUserHits(json.users ?? []);
    } catch {
      setUserHits([]);
    } finally {
      setSearching(false);
    }
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setUserQuery(""); setUserHits([]); setSelectedUser(null);
    setEditingId(null);
  }

  // Open the form prefilled with an existing coupon's values.
  function startEdit(c: Coupon) {
    setError("");
    setEditingId(c.id);
    setForm({
      code: c.code,
      description: c.description ?? "",
      discountType: c.discountType,
      // FIXED values are stored in paise → show rupees in the form.
      discountValue: c.discountType === "FIXED"
        ? String(c.discountValue / 100)
        : String(c.discountValue),
      minOrderRupees: c.minOrderPaise > 0 ? String(c.minOrderPaise / 100) : "",
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : "",
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "",
      scope: c.scope ?? "GENERAL",
    });
    setSelectedUser(null); setUserQuery(""); setUserHits([]);
    setShowForm(true);
  }

  function startCreate() {
    resetForm();
    setShowForm(true);
  }

  // Shared payload builder for create + update (scope/code only matter on create).
  function discountPayload() {
    return {
      description: form.description || undefined,
      discountType: form.discountType,
      // For FIXED, convert rupees to paise; for PERCENT, use as-is
      discountValue: form.discountType === "FIXED"
        ? Math.round(Number(form.discountValue) * 100)
        : Number(form.discountValue),
      minOrderPaise: form.minOrderRupees ? Math.round(Number(form.minOrderRupees) * 100) : 0,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      expiresAt: form.expiresAt || undefined,
    };
  }

  function rowLabel(): string {
    return form.discountType === "PERCENT"
      ? `${form.discountValue}% off`
      : `₹${form.discountValue} off`;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) { await update(); return; }
    await create();
  }

  async function create() {
    if (form.scope === "PERSONAL" && !selectedUser) {
      setError("Select the user this personal coupon is for."); return;
    }
    setSaving(true); setError("");
    const res = await fetch("/api/admin/coupons", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        scope: form.scope,
        targetUserId: form.scope === "PERSONAL" ? selectedUser?.id : undefined,
        ...discountPayload(),
      }),
    });
    const json = await res.json() as { ok?: boolean; coupon?: Coupon; error?: string };
    setSaving(false);
    if (!res.ok || !json.ok) { setError(json.error ?? "Could not create coupon."); return; }
    const ownerLabel = form.scope === "PERSONAL" && selectedUser ? userLabel(selectedUser) : null;
    setCoupons(prev => [{ ...json.coupon!, label: rowLabel(), scope: form.scope, ownerLabel }, ...prev]);
    resetForm();
    setShowForm(false);
  }

  async function update() {
    if (!editingId) return;
    setSaving(true); setError("");
    const res = await fetch(`/api/admin/coupons/${editingId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discountPayload()),
    });
    const json = await res.json() as { ok?: boolean; coupon?: Coupon; error?: string };
    setSaving(false);
    if (!res.ok || !json.ok) { setError(json.error ?? "Could not update coupon."); return; }
    // Merge updated fields into the row, preserving scope/owner/usage.
    setCoupons(prev => prev.map(c => c.id === editingId
      ? { ...c, ...json.coupon!, label: rowLabel(), scope: c.scope, ownerLabel: c.ownerLabel }
      : c));
    resetForm();
    setShowForm(false);
  }

  async function toggle(id: string, active: boolean) {
    await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active: !active } : c));
  }

  async function remove(id: string) {
    if (!confirm("Delete this coupon?")) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    setCoupons(prev => prev.filter(c => c.id !== id));
  }

  async function backfillWelcome() {
    if (!confirm("Grant the Rs 100 welcome coupon to all existing users who don't have one?")) return;
    setBackfilling(true); setBackfillMsg("");
    try {
      const res  = await fetch("/api/admin/coupons/backfill-welcome", { method: "POST" });
      const json = await res.json() as { ok?: boolean; granted?: number; scanned?: number; error?: string };
      if (res.ok && json.ok) {
        setBackfillMsg(`Granted ${json.granted} welcome coupon${json.granted === 1 ? "" : "s"} (${json.scanned} user${json.scanned === 1 ? "" : "s"} without one).`);
      } else {
        setBackfillMsg(json.error ?? "Backfill failed.");
      }
    } catch {
      setBackfillMsg("Backfill failed. Try again.");
    } finally {
      setBackfilling(false);
    }
  }

  async function viewAnalytics(id: string) {
    // Toggle closed if the same row is clicked again.
    if (analyticsFor === id) { setAnalyticsFor(null); setAnalytics(null); return; }
    setAnalyticsFor(id); setAnalytics(null); setAnalyticsLoading(true);
    try {
      const res  = await fetch(`/api/admin/coupons/${id}/analytics`);
      const json = await res.json() as { ok?: boolean } & Analytics;
      if (res.ok && json.ok) setAnalytics(json);
    } catch {
      /* leave analytics null → panel shows empty */
    } finally {
      setAnalyticsLoading(false);
    }
  }

  return (
    <div>
      {!showForm && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".7rem", alignItems: "center", marginBottom: "1.5rem" }}>
          <button type="button" className="button" onClick={startCreate}>
            + Create coupon
          </button>
          <button type="button" className="button button-outline" onClick={backfillWelcome} disabled={backfilling}>
            {backfilling ? "Granting…" : "Grant welcome coupons to existing users"}
          </button>
          {backfillMsg && <span className="muted" style={{ fontSize: ".8rem" }}>{backfillMsg}</span>}
        </div>
      )}

      {showForm && (
        <form className="coupon-form" onSubmit={submit}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700 }}>
            {editingId ? `Edit coupon · ${form.code}` : "New coupon"}
          </h3>
          {error && <p className="contact-field-error" style={{ marginBottom: ".8rem" }}>{error}</p>}
          <div className="coupon-form-grid">
            <div className="contact-field">
              <label>Code *</label>
              <input value={form.code} required maxLength={40} disabled={!!editingId}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="WELCOME10" />
              {editingId && <span className="muted" style={{ fontSize: ".68rem" }}>Code can&apos;t be changed.</span>}
            </div>
            <div className="contact-field">
              <label>Coupon scope</label>
              <select value={form.scope} disabled={!!editingId}
                onChange={e => setForm({ ...form, scope: e.target.value })}>
                <option value="GENERAL">General — any user, once each</option>
                <option value="PERSONAL">Personal — one specific user</option>
              </select>
              {editingId && <span className="muted" style={{ fontSize: ".68rem" }}>Scope can&apos;t be changed.</span>}
            </div>
            <div className="contact-field">
              <label>Discount type</label>
              <select value={form.discountType}
                onChange={e => setForm({ ...form, discountType: e.target.value })}>
                <option value="PERCENT">Percentage</option>
                <option value="FIXED">Fixed amount (₹)</option>
              </select>
            </div>
            <div className="contact-field">
              <label>{form.discountType === "PERCENT" ? "Percent off (1-100)" : "Amount off (₹)"} *</label>
              <input type="number" min={1} value={form.discountValue} required
                onChange={e => setForm({ ...form, discountValue: e.target.value })} />
            </div>
            <div className="contact-field">
              <label>Min order (₹)</label>
              <input type="number" min={0} value={form.minOrderRupees}
                onChange={e => setForm({ ...form, minOrderRupees: e.target.value })} placeholder="0" />
            </div>
            <div className="contact-field">
              <label>Usage limit</label>
              <input type="number" min={1} value={form.usageLimit}
                onChange={e => setForm({ ...form, usageLimit: e.target.value })} placeholder="Unlimited" />
            </div>
            <div className="contact-field">
              <label>Expires</label>
              <input type="date" value={form.expiresAt}
                onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
          </div>
          <div className="contact-field">
            <label>Description</label>
            <input value={form.description} maxLength={200}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. 10% off your first order" />
          </div>

          {/* Personal coupons must be bound to one user (only when creating —
              scope/owner are immutable on edit). */}
          {form.scope === "PERSONAL" && !editingId && (
            <div className="contact-field" style={{ marginTop: ".2rem" }}>
              <label>Assign to user *</label>
              {selectedUser ? (
                <div className="coupon-user-chip">
                  <span>{userLabel(selectedUser)}</span>
                  <button type="button" onClick={() => { setSelectedUser(null); setUserQuery(""); }}>
                    Change
                  </button>
                </div>
              ) : (
                <div className="coupon-user-search">
                  <input value={userQuery}
                    onChange={e => searchUsers(e.target.value)}
                    placeholder="Search by name, email or phone" />
                  {searching && <p className="muted" style={{ fontSize: ".72rem", margin: ".3rem 0 0" }}>Searching…</p>}
                  {userHits.length > 0 && (
                    <ul className="coupon-user-results">
                      {userHits.map(u => (
                        <li key={u.id}>
                          <button type="button" onClick={() => { setSelectedUser(u); setUserHits([]); }}>
                            <strong>{u.name || "Unnamed"}</strong>
                            <span>{u.email || (u.phone ? `+91 ${u.phone}` : u.id)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!searching && userQuery.trim().length >= 2 && userHits.length === 0 && (
                    <p className="muted" style={{ fontSize: ".72rem", margin: ".3rem 0 0" }}>No matching users.</p>
                  )}
                </div>
              )}
            </div>
          )}

          <p className="muted" style={{ fontSize: ".72rem", margin: ".6rem 0 0" }}>
            {form.scope === "PERSONAL"
              ? "Only the selected user can redeem this code, once."
              : "Any signed-in user can redeem this code — but each user only once."}
          </p>

          <div style={{ display: "flex", gap: ".7rem", marginTop: ".8rem" }}>
            <button type="submit" className="button" disabled={saving}>
              {saving
                ? (editingId ? "Saving…" : "Creating…")
                : (editingId ? "Save changes" : "Create coupon")}
            </button>
            <button type="button" className="button button-outline" onClick={() => { resetForm(); setShowForm(false); }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {coupons.length === 0 ? (
        <p className="notice">No coupons yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Code</th><th>Type</th><th>Discount</th><th>Min order</th><th>Used</th><th>Status</th><th>Expires</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.code}</strong>{c.description && <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>{c.description}</div>}</td>
                  <td>
                    {c.scope === "PERSONAL" ? (
                      <>
                        <span className="coupon-scope-tag coupon-scope-tag--personal">Personal</span>
                        {c.ownerLabel && <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: ".2rem" }}>{c.ownerLabel}</div>}
                      </>
                    ) : (
                      <span className="coupon-scope-tag">General</span>
                    )}
                  </td>
                  <td>{c.label}</td>
                  <td>{c.minOrderPaise > 0 ? `₹${c.minOrderPaise / 100}` : "—"}</td>
                  <td>{c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                  <td>
                    <span className={`admin-role-badge${c.active ? " admin-role-badge--admin" : ""}`}>
                      {c.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ fontSize: ".78rem", color: "var(--muted)" }}>
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN") : "Never"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: ".4rem" }}>
                      <button type="button" className="addrbook-btn" onClick={() => viewAnalytics(c.id)}>
                        {analyticsFor === c.id ? "Hide stats" : "Analytics"}
                      </button>
                      <button type="button" className="addrbook-btn" onClick={() => startEdit(c)}>
                        Edit
                      </button>
                      <button type="button" className="addrbook-btn" onClick={() => toggle(c.id, c.active)}>
                        {c.active ? "Disable" : "Enable"}
                      </button>
                      <button type="button" className="addrbook-btn addrbook-btn--danger" onClick={() => remove(c.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )).reduce<React.ReactNode[]>((acc, rowEl, i) => {
                const c = coupons[i];
                acc.push(rowEl);
                if (analyticsFor === c.id) {
                  acc.push(
                    <tr key={`${c.id}-analytics`} className="coupon-analytics-row">
                      <td colSpan={8}>
                        {analyticsLoading ? (
                          <p className="muted" style={{ margin: ".5rem 0" }}>Loading usage…</p>
                        ) : analytics ? (
                          <div className="coupon-analytics">
                            <div className="coupon-stat-grid">
                              <div className="coupon-stat">
                                <span className="coupon-stat-num">{analytics.stats.redemptions}</span>
                                <span className="coupon-stat-lbl">Redemptions</span>
                              </div>
                              <div className="coupon-stat">
                                <span className="coupon-stat-num">{analytics.stats.uniqueUsers}</span>
                                <span className="coupon-stat-lbl">Unique users</span>
                              </div>
                              <div className="coupon-stat">
                                <span className="coupon-stat-num">{rupees(analytics.stats.totalDiscountPaise)}</span>
                                <span className="coupon-stat-lbl">Total discount given</span>
                              </div>
                              <div className="coupon-stat">
                                <span className="coupon-stat-num">{rupees(analytics.stats.totalRevenuePaise)}</span>
                                <span className="coupon-stat-lbl">Revenue from these orders</span>
                              </div>
                              <div className="coupon-stat">
                                <span className="coupon-stat-num">{rupees(analytics.stats.avgOrderPaise)}</span>
                                <span className="coupon-stat-lbl">Avg order value</span>
                              </div>
                            </div>

                            {analytics.rows.length === 0 ? (
                              <p className="muted" style={{ margin: ".6rem 0 0" }}>Not redeemed yet.</p>
                            ) : (
                              <table className="admin-table coupon-analytics-table">
                                <thead>
                                  <tr><th>User</th><th>Order</th><th>Status</th><th>Discount</th><th>Order total</th><th>Redeemed</th></tr>
                                </thead>
                                <tbody>
                                  {analytics.rows.map(r => (
                                    <tr key={r.id}>
                                      <td>{r.user}</td>
                                      <td>{r.orderNumber}</td>
                                      <td>{r.orderStatus.charAt(0) + r.orderStatus.slice(1).toLowerCase()}</td>
                                      <td>{rupees(r.discountPaise)}</td>
                                      <td>{rupees(r.totalPaise)}</td>
                                      <td style={{ fontSize: ".76rem", color: "var(--muted)" }}>
                                        {new Date(r.redeemedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        ) : (
                          <p className="muted" style={{ margin: ".5rem 0" }}>Could not load usage.</p>
                        )}
                      </td>
                    </tr>
                  );
                }
                return acc;
              }, [])}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
