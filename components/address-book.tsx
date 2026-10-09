"use client";
import { useState } from "react";
import type { Address } from "@prisma/client";

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Puducherry","Chandigarh",
];

const emptyForm = {
  fullName: "", phone: "", line1: "", line2: "",
  city: "", state: "", pincode: "", isDefault: false,
};

export function AddressBook({ initialAddresses }: { initialAddresses: Address[] }) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(emptyForm);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [error,     setError]     = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.line1 || !form.city || !form.state || !form.pincode) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!/^\d{6}$/.test(form.pincode)) {
      setError("Please enter a valid 6-digit PIN code.");
      return;
    }
    setSaving(true);
    setError("");
    const res  = await fetch("/api/addresses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json() as { ok?: boolean; address?: Address; error?: string };
    setSaving(false);
    if (!res.ok) { setError(json.error ?? "Could not save address."); return; }
    setAddresses(prev =>
      form.isDefault
        ? [json.address!, ...prev.map(a => ({ ...a, isDefault: false }))]
        : [...prev, json.address!]
    );
    setForm(emptyForm);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    setAddresses(prev => prev.filter(a => a.id !== id));
    setDeleting(null);
  }

  async function handleSetDefault(id: string) {
    await fetch(`/api/addresses/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
  }

  return (
    <div>
      {/* Address cards grid */}
      <div className="addrbook-grid">
        {addresses.map(addr => (
          <div key={addr.id} className={`addrbook-card${addr.isDefault ? " addrbook-card--default" : ""}`}>
            {addr.isDefault && (
              <div className="addrbook-default-tag">
                <span>✓</span> Default address
              </div>
            )}
            <div className="addrbook-card-body">
              <p className="addrbook-name">{addr.fullName}</p>
              <p className="addrbook-line">{addr.phone}</p>
              <p className="addrbook-line">{addr.line1}</p>
              {addr.line2 && <p className="addrbook-line">{addr.line2}</p>}
              <p className="addrbook-line">{addr.city}, {addr.state}</p>
              <p className="addrbook-line">{addr.pincode} · India</p>
            </div>
            <div className="addrbook-actions">
              {!addr.isDefault && (
                <button type="button" className="addrbook-btn"
                  onClick={() => handleSetDefault(addr.id)}>
                  Set as default
                </button>
              )}
              <button type="button" className="addrbook-btn addrbook-btn--danger"
                disabled={deleting === addr.id}
                onClick={() => handleDelete(addr.id)}>
                {deleting === addr.id ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        ))}

        {/* Add new card */}
        {!showForm && (
          <button type="button" className="addrbook-card addrbook-card--add"
            onClick={() => setShowForm(true)}>
            <span className="addrbook-add-icon" aria-hidden="true">+</span>
            <span>Add new address</span>
          </button>
        )}
      </div>

      {/* Add address form */}
      {showForm && (
        <div className="addrbook-form-wrap">
          <div className="addrbook-form-header">
            <h2 className="serif" style={{ fontSize: "1.25rem", margin: 0 }}>Add new address</h2>
            <button type="button" className="addrbook-close"
              onClick={() => { setShowForm(false); setError(""); setForm(emptyForm); }}
              aria-label="Close form">✕</button>
          </div>

          {error && <p className="contact-field-error" role="alert" style={{ marginBottom: "1rem" }}>{error}</p>}

          <form className="addrbook-form" onSubmit={handleAdd} noValidate>
            <div className="addrbook-row-2">
              <div className="contact-field">
                <label htmlFor="addr-name">Full name *</label>
                <input id="addr-name" name="fullName" required
                  value={form.fullName} onChange={handleChange} maxLength={100}
                  placeholder="As per delivery preference" />
              </div>
              <div className="contact-field">
                <label htmlFor="addr-phone">Phone number *</label>
                <input id="addr-phone" name="phone" type="tel" required
                  value={form.phone} onChange={handleChange} maxLength={10}
                  placeholder="10-digit mobile number" />
              </div>
            </div>

            <div className="contact-field">
              <label htmlFor="addr-line1">House / Flat no., Building, Street *</label>
              <input id="addr-line1" name="line1" required
                value={form.line1} onChange={handleChange} maxLength={200} />
            </div>

            <div className="contact-field">
              <label htmlFor="addr-line2">Area, Landmark <span className="addrbook-optional">(optional)</span></label>
              <input id="addr-line2" name="line2"
                value={form.line2} onChange={handleChange} maxLength={200} />
            </div>

            <div className="addrbook-row-3">
              <div className="contact-field">
                <label htmlFor="addr-city">City *</label>
                <input id="addr-city" name="city" required
                  value={form.city} onChange={handleChange} maxLength={100} />
              </div>
              <div className="contact-field">
                <label htmlFor="addr-state">State *</label>
                <select id="addr-state" name="state" required
                  value={form.state} onChange={handleChange}>
                  <option value="">Select</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="contact-field">
                <label htmlFor="addr-pin">PIN code *</label>
                <input id="addr-pin" name="pincode" required
                  value={form.pincode} onChange={handleChange} maxLength={6}
                  placeholder="6 digits" />
              </div>
            </div>

            <label className="addrbook-default-toggle">
              <input type="checkbox" name="isDefault"
                checked={form.isDefault} onChange={handleChange} />
              <span>Make this my default delivery address</span>
            </label>

            <div className="addrbook-form-actions">
              <button type="submit" className="button" disabled={saving}>
                {saving ? "Saving…" : "Save address"}
              </button>
              <button type="button" className="button button-outline"
                onClick={() => { setShowForm(false); setError(""); setForm(emptyForm); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
