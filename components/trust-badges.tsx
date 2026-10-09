// Trust/assurance badges shown on the product page under the buy box.
// Pure inline SVG icons — no external assets.

const iconProps = {
  width: 34,
  height: 34,
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const BADGES: { label: string; icon: React.ReactNode }[] = [
  {
    label: "15 Days Return",
    icon: (
      <svg {...iconProps}>
        <path d="M14 20a11 11 0 1 1-2 8" />
        <path d="M14 12v8h8" />
      </svg>
    ),
  },
  {
    label: "Free Shipping",
    icon: (
      <svg {...iconProps}>
        <path d="M6 16h20v16H6zM26 22h9l5 6v4h-14z" />
        <circle cx="14" cy="36" r="3" />
        <circle cx="33" cy="36" r="3" />
      </svg>
    ),
  },
  {
    label: "Quality Guaranteed",
    icon: (
      <svg {...iconProps}>
        <circle cx="24" cy="22" r="12" />
        <path d="M19 22l4 4 7-8" />
        <path d="M18 33l-2 8 8-4 8 4-2-8" />
      </svg>
    ),
  },
  {
    label: "Secure Checkout",
    icon: (
      <svg {...iconProps}>
        <rect x="10" y="20" width="28" height="18" rx="2" />
        <path d="M17 20v-4a7 7 0 0 1 14 0v4" />
        <circle cx="24" cy="29" r="2" />
      </svg>
    ),
  },
  {
    label: "Made In India",
    icon: (
      <svg {...iconProps}>
        <rect x="10" y="12" width="28" height="20" rx="1.5" />
        <path d="M10 18.5h28M10 25.5h28" />
        <path d="M14 36h20" />
      </svg>
    ),
  },
];

export function TrustBadges() {
  return (
    <section className="trust-badges" aria-label="Shopping assurances">
      <h2 className="trust-badges-title serif">Secure checkout with</h2>
      <ul className="trust-badges-grid">
        {BADGES.map(b => (
          <li key={b.label} className="trust-badge">
            <span className="trust-badge-icon">{b.icon}</span>
            <span className="trust-badge-label">{b.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
