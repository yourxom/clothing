"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type StrengthLevel = "weak" | "fair" | "good" | "strong";

export function getPasswordStrength(password: string): { level: StrengthLevel; score: number; label: string } {
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: "weak",   score, label: "Weak" };
  if (score === 2) return { level: "fair",   score, label: "Fair" };
  if (score === 3) return { level: "good",   score, label: "Good" };
  return              { level: "strong", score, label: "Strong" };
}

export function PasswordInput({
  id,
  name,
  label,
  autoComplete = "new-password",
  placeholder = "Min. 8 characters",
  showStrength = false,
  required = true,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete?: string;
  placeholder?: string;
  showStrength?: boolean;
  required?: boolean;
  onChange?: (value: string) => void;
}) {
  const [visible,  setVisible]  = useState(false);
  const [value,    setValue]    = useState("");
  const strength = showStrength && value ? getPasswordStrength(value) : null;

  return (
    <div className="contact-field">
      <label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
      <div className="pw-input-wrap">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          maxLength={72}
          value={value}
          onChange={e => {
            setValue(e.target.value);
            onChange?.(e.target.value);
          }}
          className="pw-input"
          aria-describedby={showStrength ? `${id}-strength` : undefined}
        />
        <button
          type="button"
          className="pw-toggle"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible(v => !v)}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {strength && (
        <div id={`${id}-strength`} className="pw-strength" aria-live="polite">
          <div className="pw-strength-bar">
            {[1,2,3,4].map(i => (
              <div
                key={i}
                className={`pw-strength-segment${strength.score >= i ? ` pw-strength-segment--${strength.level}` : ""}`}
              />
            ))}
          </div>
          <span className={`pw-strength-label pw-strength-label--${strength.level}`}>
            {strength.label}
          </span>
        </div>
      )}
    </div>
  );
}

/* Simpler read-only show/hide for current password fields */
export function CurrentPasswordInput({ id, name, label }: { id: string; name: string; label: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="contact-field">
      <label htmlFor={id}>{label}</label>
      <div className="pw-input-wrap">
        <input id={id} name={name} type={visible ? "text" : "password"}
          autoComplete="current-password" required className="pw-input" />
        <button type="button" className="pw-toggle"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible(v => !v)} tabIndex={-1}>
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
