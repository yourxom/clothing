"use client";
import { useEffect, useState } from "react";

// Floating WhatsApp button. Reads config from /api/whatsapp.
// On mobile, wa.me links open the WhatsApp app directly; on desktop, WhatsApp Web.
export function WhatsAppButton() {
  const [config, setConfig] = useState<{ enabled: boolean; number: string; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/whatsapp")
      .then(r => r.json())
      .then((data: { enabled?: boolean; number?: string; message?: string }) => {
        if (active && data.enabled && data.number) {
          setConfig({ enabled: true, number: data.number, message: data.message ?? "" });
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  if (!config?.enabled) return null;

  const href = `https://wa.me/${config.number}?text=${encodeURIComponent(config.message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-fab"
      aria-label="Chat with us on WhatsApp"
    >
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true" fill="currentColor">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.05 9.38L1.05 31.3l6.114-1.955A15.9 15.9 0 0 0 16.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0Zm9.312 22.598c-.386 1.09-1.92 1.996-3.144 2.26-.836.178-1.928.32-5.604-1.204-4.7-1.948-7.726-6.724-7.962-7.034-.226-.31-1.9-2.53-1.9-4.826 0-2.296 1.166-3.424 1.636-3.904.386-.394.844-.574 1.322-.574.154 0 .294.008.42.014.386.016.58.038.834.646.316.762 1.088 2.658 1.18 2.844.094.186.156.404.032.65-.116.246-.218.354-.404.57-.186.216-.362.382-.548.614-.17.216-.362.45-.148.822.214.364.95 1.564 2.038 2.532 1.404 1.25 2.542 1.638 2.95 1.808.304.126.666.096.888-.144.282-.31.63-.822.984-1.328.252-.362.57-.408.9-.284.336.116 2.124 1.002 2.49 1.184.366.184.61.272.7.424.09.156.09.898-.296 1.99Z"/>
      </svg>
    </a>
  );
}
