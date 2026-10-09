"use client";
import { useEffect, useState } from "react";

// Per-product WhatsApp buttons on the product detail page.
// 1. "WhatsApp query" — ask about the product as-is
// 2. "Request customization" — ask for a custom/personalised version
export function ProductWhatsAppButton({
  productName,
  productSlug,
  productDescription,
  siteUrl,
}: {
  productName:        string;
  productSlug:        string;
  productDescription: string;
  siteUrl:            string;
}) {
  const [config, setConfig] = useState<{ enabled: boolean; number: string } | null>(null);
  const [hovered, setHovered] = useState(false);
  const [hoveredCustom, setHoveredCustom] = useState(false);

  useEffect(() => {
    fetch("/api/whatsapp")
      .then(r => r.json())
      .then((d: { enabled?: boolean; number?: string }) => {
        if (d.enabled && d.number) setConfig({ enabled: true, number: d.number });
      })
      .catch(() => {});
  }, []);

  if (!config?.enabled) return null;

  const productUrl = `${siteUrl}/p/${productSlug}`;
  const snippet = productDescription.length > 120
    ? productDescription.slice(0, 120).replace(/\s+\S*$/, "") + "…"
    : productDescription;

  // Message 1: general product query
  const queryMessage = [
    `Hi AURELIA! I'm interested in this product:`,
    ``,
    `*${productName}*`,
    `${productUrl}`,
    ``,
    `_${snippet}_`,
    ``,
    `Could you please give me more information about this item?`,
  ].join("\n");

  // Message 2: customization request pre-filled with the product
  const customMessage = [
    `Hi AURELIA! I'd like to request a *custom / personalised* version of this product:`,
    ``,
    `*${productName}*`,
    `${productUrl}`,
    ``,
    `Here are my customisation requirements:`,
    `- Colour / fabric change: `,
    `- Size / measurements: `,
    `- Embroidery / print changes: `,
    `- Any other special instructions: `,
    ``,
    `Could you please let me know if this is possible, and share the estimated cost and timeline?`,
  ].join("\n");

  const queryHref  = `https://wa.me/${config.number}?text=${encodeURIComponent(queryMessage)}`;
  const customHref = `https://wa.me/${config.number}?text=${encodeURIComponent(customMessage)}`;

  const WaIcon = () => (
    <svg viewBox="0 0 32 32" width="17" height="17" fill="currentColor" aria-hidden="true">
      <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.05 9.38L1.05 31.3l6.114-1.955A15.9 15.9 0 0 0 16.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0Zm9.312 22.598c-.386 1.09-1.92 1.996-3.144 2.26-.836.178-1.928.32-5.604-1.204-4.7-1.948-7.726-6.724-7.962-7.034-.226-.31-1.9-2.53-1.9-4.826 0-2.296 1.166-3.424 1.636-3.904.386-.394.844-.574 1.322-.574.154 0 .294.008.42.014.386.016.58.038.834.646.316.762 1.088 2.658 1.18 2.844.094.186.156.404.032.65-.116.246-.218.354-.404.57-.186.216-.362.382-.548.614-.17.216-.362.45-.148.822.214.364.95 1.564 2.038 2.532 1.404 1.25 2.542 1.638 2.95 1.808.304.126.666.096.888-.144.282-.31.63-.822.984-1.328.252-.362.57-.408.9-.284.336.116 2.124 1.002 2.49 1.184.366.184.61.272.7.424.09.156.09.898-.296 1.99Z"/>
    </svg>
  );

  return (
    <div className="product-wa-actions">
      {/* Button 1: general product query */}
      <a
        href={queryHref}
        target="_blank"
        rel="noopener noreferrer"
        className="product-wa-btn"
        aria-label="Ask about this product on WhatsApp"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <WaIcon />
        <span>{hovered ? "Ask on WhatsApp" : "WhatsApp query"}</span>
      </a>

      {/* Button 2: request customization */}
      <a
        href={customHref}
        target="_blank"
        rel="noopener noreferrer"
        className="product-wa-btn product-wa-btn--custom"
        aria-label="Request a customised version of this product on WhatsApp"
        onMouseEnter={() => setHoveredCustom(true)}
        onMouseLeave={() => setHoveredCustom(false)}
      >
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        <span>{hoveredCustom ? "Request on WhatsApp" : "Request customization"}</span>
      </a>
    </div>
  );
}
