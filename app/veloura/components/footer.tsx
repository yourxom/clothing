"use client";
import { useState } from "react";
import Link from "next/link";

type FooterLink = { label: string; href: string };

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "Shop All", href: "/shop" },
      { label: "Kurtas", href: "/collections/kurtas" },
      { label: "Dresses", href: "/collections/dresses" },
      { label: "Sarees", href: "/collections/sarees" },
      { label: "Lehengas", href: "/collections/lehengas" },
      { label: "Co-ords", href: "/collections/co-ord-sets" },
    ],
  },
  {
    title: "Customer Care",
    links: [
      { label: "My Account", href: "/account" },
      { label: "Track Order", href: "/account/orders" },
      { label: "Returns & Exchange", href: "/shipping-and-returns" },
      { label: "Shipping Policy", href: "/shipping-and-returns" },
      { label: "FAQs", href: "/help" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "The Journal", href: "/journal" },
      { label: "Stores", href: "/stores" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
    ],
  },
];

function Social({ label, path }: { label: string; path: React.ReactNode }) {
  return (
    <a href="#" aria-label={label}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">{path}</svg>
    </a>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="vl-footer__col">
      <h4>{title}</h4>
      <button
        type="button"
        className="vl-footer__accordion-btn"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <span aria-hidden="true">{open ? "–" : "+"}</span>
      </button>
      <div className={`vl-footer__col-links${open ? " vl-open" : ""}`}>
        {links.map((l) => (
          <Link key={l.label} href={l.href}>{l.label}</Link>
        ))}
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="vl-footer">
      <div className="vl-container">
        <div className="vl-footer__top">
          {/* Brand column */}
          <div className="vl-footer__brand">
            <span className="vl-logo">
              <svg className="vl-logo__icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                <path d="M12 2C7 6 5 11 6 18c5 1 10-1 14-6-3 1-6 1-9-1 3-1 5-3 6-6-3 2-6 2-9 0 2-1 3-2 4-3z" />
              </svg>
              AURELIA
            </span>
            <p className="vl-footer__desc">
              Modern fashion for the modern woman. Style, quality and confidence — all in one place.
            </p>
            <div className="vl-footer__social">
              <Social label="Instagram" path={<path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.3-2.2-.4a3.7 3.7 0 0 1-1.4-.9 3.7 3.7 0 0 1-.9-1.4c-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.5A6.3 6.3 0 1 0 18.3 12 6.3 6.3 0 0 0 12 5.7zm0 10.4A4.1 4.1 0 1 1 16.1 12 4.1 4.1 0 0 1 12 16.1zm6.5-10.6a1.5 1.5 0 1 0 1.5 1.5 1.5 1.5 0 0 0-1.5-1.5z" />} />
              <Social label="Facebook" path={<path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.8v8z" />} />
              <Social label="Pinterest" path={<path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 .0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.5 1.9-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.2-.9 3.5-.2 1 .5 1.9 1.6 1.9 1.9 0 3.2-2.4 3.2-5.3 0-2.2-1.5-3.8-4.1-3.8a4.7 4.7 0 0 0-4.9 4.7c0 .9.3 1.5.7 2 .2.2.2.3.1.5l-.2.9c-.1.3-.3.4-.6.2-1.1-.5-1.7-1.9-1.7-3.1 0-2.5 1.8-4.8 5.3-4.8 2.8 0 4.9 2 4.9 4.6 0 2.8-1.7 5-4.2 5-.8 0-1.6-.4-1.9-.9l-.5 2c-.2.7-.7 1.6-1 2.2A10 10 0 1 0 12 2z" />} />
              <Social label="YouTube" path={<path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.7-1.7C19.3 5.2 12 5.2 12 5.2s-7.3 0-8.9.4A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.7 1.7c1.6.4 8.9.4 8.9.4s7.3 0 8.9-.4a2.5 2.5 0 0 0 1.7-1.7C23 15.2 23 12 23 12zm-13.2 3V9l5.2 3z" />} />
            </div>
          </div>

          {COLUMNS.map((c) => (
            <FooterColumn key={c.title} title={c.title} links={c.links} />
          ))}

          {/* Payments + trust */}
          <div className="vl-footer__col vl-footer__pay-col">
            <h4>We Accept</h4>
            <div className="vl-pay" aria-label="Accepted payment methods">
              <span>VISA</span>
              <span>Mastercard</span>
              <span>UPI</span>
              <span>RuPay</span>
            </div>
            <div className="vl-trust">
              <span><TrustIcon /> Secure Payments</span>
              <span><TrustIcon /> Easy Returns</span>
              <span><TrustIcon /> Premium Quality</span>
            </div>
          </div>
        </div>

        <div className="vl-footer__bottom">
          <span>© 2019 AURELIA. All rights reserved.</span>
          <span className="vl-footer__bottom-links">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-and-conditions">Terms &amp; Conditions</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

function TrustIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 2l8 3v6c0 5-3.5 8-8 11-4.5-3-8-6-8-11V5z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
