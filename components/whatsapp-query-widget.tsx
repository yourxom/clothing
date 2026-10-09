"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// General queries shown in the selector
const GENERAL_QUERIES = [
  {
    icon: "📦",
    label: "Track my order",
    message: "Hi AURELIA! I'd like to track my recent order. Could you please help me with the status?",
  },
  {
    icon: "↩️",
    label: "Return or exchange",
    message: "Hi AURELIA! I need help with a return or exchange for my recent order. Could you guide me through the process?",
  },
  {
    icon: "💳",
    label: "Payment issue",
    message: "Hi AURELIA! I'm facing an issue with a payment on my order. Could you please help me resolve it?",
  },
  {
    icon: "📏",
    label: "Size & fit advice",
    message: "Hi AURELIA! I need advice on sizing and fit before placing an order. Could you help me choose the right size?",
  },
  {
    icon: "🎁",
    label: "Gift wrapping",
    message: "Hi AURELIA! I'd like to know about gift wrapping options for my order. Could you please help?",
  },
  {
    icon: "✂️",
    label: "Custom / personalised order",
    message: "Hi AURELIA! I'd like to request a customised or personalised product.\n\nHere are my requirements:\n- Product / style: \n- Colour / fabric: \n- Size / measurements: \n- Any special instructions: \n\nCould you let me know if this is possible and the estimated cost and timeline?",
  },
  {
    icon: "🛍️",
    label: "About a product",
    message: null, // null = redirect to shop page instead of opening WhatsApp
    href: "/shop",
  },
];

export function WhatsAppQueryWidget() {
  const router = useRouter();
  const [config, setConfig] = useState<{ enabled: boolean; number: string } | null>(null);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/whatsapp")
      .then(r => r.json())
      .then((d: { enabled?: boolean; number?: string }) => {
        if (d.enabled && d.number) setConfig({ enabled: true, number: d.number });
      })
      .catch(() => {});
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!config?.enabled) return null;

  function handleQuery(q: typeof GENERAL_QUERIES[number]) {
    setOpen(false);
    if (!q.message && q.href) {
      // "About a product" → go to shop to pick a product
      router.push(q.href);
      return;
    }
    if (q.message && config?.number) {
      const href = `https://wa.me/${config.number}?text=${encodeURIComponent(q.message)}`;
      window.open(href, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="wa-query-widget" ref={panelRef}>
      {/* Query selector panel */}
      {open && (
        <div className="wa-query-panel" role="dialog" aria-label="WhatsApp queries">
          <div className="wa-query-panel__head">
            <div className="wa-query-panel__brand">
              <svg viewBox="0 0 32 32" width="20" height="20" fill="currentColor" aria-hidden="true">
                <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.05 9.38L1.05 31.3l6.114-1.955A15.9 15.9 0 0 0 16.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0Zm9.312 22.598c-.386 1.09-1.92 1.996-3.144 2.26-.836.178-1.928.32-5.604-1.204-4.7-1.948-7.726-6.724-7.962-7.034-.226-.31-1.9-2.53-1.9-4.826 0-2.296 1.166-3.424 1.636-3.904.386-.394.844-.574 1.322-.574.154 0 .294.008.42.014.386.016.58.038.834.646.316.762 1.088 2.658 1.18 2.844.094.186.156.404.032.65-.116.246-.218.354-.404.57-.186.216-.362.382-.548.614-.17.216-.362.45-.148.822.214.364.95 1.564 2.038 2.532 1.404 1.25 2.542 1.638 2.95 1.808.304.126.666.096.888-.144.282-.31.63-.822.984-1.328.252-.362.57-.408.9-.284.336.116 2.124 1.002 2.49 1.184.366.184.61.272.7.424.09.156.09.898-.296 1.99Z"/>
              </svg>
              <div>
                <p className="wa-query-panel__title">AURELIA Support</p>
                <p className="wa-query-panel__status">
                  <span className="wa-query-panel__dot" aria-hidden="true" />
                  Typically replies in minutes
                </p>
              </div>
            </div>
            <button type="button" className="wa-query-panel__close" onClick={() => setOpen(false)} aria-label="Close">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <p className="wa-query-panel__subtitle">What can we help you with today?</p>

          <div className="wa-query-list">
            {GENERAL_QUERIES.map((q, i) => (
              <button
                key={i}
                type="button"
                className={`wa-query-item${
                  q.icon === "✂️" ? " wa-query-item--custom"
                  : !q.message    ? " wa-query-item--product"
                  : ""
                }`}
                onClick={() => handleQuery(q)}
              >
                <span className="wa-query-item__icon" aria-hidden="true">{q.icon}</span>
                <span className="wa-query-item__label">{q.label}</span>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="wa-query-item__arrow" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            ))}
          </div>

          <p className="wa-query-panel__footer">
            Powered by WhatsApp
          </p>
        </div>
      )}

      {/* FAB button */}
      <button
        type="button"
        className={`whatsapp-fab wa-fab-btn${open ? " wa-fab-btn--open" : ""}`}
        aria-label={open ? "Close WhatsApp menu" : "Chat with us on WhatsApp"}
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        {/* WhatsApp icon (shown when closed) */}
        <svg viewBox="0 0 32 32" width="30" height="30" fill="currentColor"
          aria-hidden="true" className={`wa-fab-icon${open ? " wa-fab-icon--hidden" : ""}`}>
          <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.05 9.38L1.05 31.3l6.114-1.955A15.9 15.9 0 0 0 16.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0Zm9.312 22.598c-.386 1.09-1.92 1.996-3.144 2.26-.836.178-1.928.32-5.604-1.204-4.7-1.948-7.726-6.724-7.962-7.034-.226-.31-1.9-2.53-1.9-4.826 0-2.296 1.166-3.424 1.636-3.904.386-.394.844-.574 1.322-.574.154 0 .294.008.42.014.386.016.58.038.834.646.316.762 1.088 2.658 1.18 2.844.094.186.156.404.032.65-.116.246-.218.354-.404.57-.186.216-.362.382-.548.614-.17.216-.362.45-.148.822.214.364.95 1.564 2.038 2.532 1.404 1.25 2.542 1.638 2.95 1.808.304.126.666.096.888-.144.282-.31.63-.822.984-1.328.252-.362.57-.408.9-.284.336.116 2.124 1.002 2.49 1.184.366.184.61.272.7.424.09.156.09.898-.296 1.99Z"/>
        </svg>
        {/* Close icon (shown when open) */}
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"
          aria-hidden="true" className={`wa-fab-icon${!open ? " wa-fab-icon--hidden" : ""}`}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
