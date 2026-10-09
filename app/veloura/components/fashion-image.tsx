import type { Pose } from "../data";

// Art-directed fashion illustration used in place of stock photography so every
// card belongs to one consistent campaign (shared palette, lighting, styling).
// Renders a soft editorial scene: warm backdrop, a stylised female figure, and
// subtle botanical/arch elements — never a plain gray placeholder.

type Palette = { bg: string; bg2: string; skin: string; hair: string; outfit: string; outfit2: string };

const palettes: Record<string, Palette> = {
  blush:    { bg: "#F8E4DD", bg2: "#F3D2CB", skin: "#E7BFA6", hair: "#3A2A22", outfit: "#E7A3A0", outfit2: "#F4E2D8" },
  coral:    { bg: "#F7D9D2", bg2: "#F3C4BC", skin: "#E6BBA2", hair: "#2E2019", outfit: "#C85B5B", outfit2: "#E8B4AE" },
  cream:    { bg: "#FAF3EA", bg2: "#F1E6D6", skin: "#E8C3A8", hair: "#4A3324", outfit: "#FFFFFF", outfit2: "#E9DDC9" },
  beige:    { bg: "#F3E8DB", bg2: "#E9D8C4", skin: "#E4BC9E", hair: "#3B2A1E", outfit: "#D8C3A5", outfit2: "#BBA588" },
  sand:     { bg: "#F5ECDD", bg2: "#EADDC6", skin: "#E7C1A3", hair: "#43301F", outfit: "#CBB392", outfit2: "#F0E6D5" },
  mauve:    { bg: "#F1E2EA", bg2: "#E4CDD9", skin: "#E6BBA2", hair: "#2C2028", outfit: "#C9A9BE", outfit2: "#EBD8E1" },
  olive:    { bg: "#EEEBDC", bg2: "#DED9C0", skin: "#E4BC9E", hair: "#33291B", outfit: "#8E946F", outfit2: "#CBCDA9" },
  charcoal: { bg: "#EAE7E4", bg2: "#D6D1CC", skin: "#E4BC9E", hair: "#20242A", outfit: "#3F4650", outfit2: "#9BA6B2" },
  // Aliases for the real DB catalogue tones (rose/olive/blue/clay/sand/plum).
  rose:     { bg: "#F8E4DD", bg2: "#F0CFC7", skin: "#E7BFA6", hair: "#3A2A22", outfit: "#C98A80", outfit2: "#EBD3CB" },
  blue:     { bg: "#E5EDF1", bg2: "#CFDCE4", skin: "#E4BC9E", hair: "#26313A", outfit: "#7C97A8", outfit2: "#CBD8E0" },
  clay:     { bg: "#F3E2D5", bg2: "#E6C9B4", skin: "#E4BC9E", hair: "#33231A", outfit: "#B07E63", outfit2: "#E4C6B0" },
  plum:     { bg: "#F0E2E9", bg2: "#DDC5D2", skin: "#E6BBA2", hair: "#2A1F27", outfit: "#98788A", outfit2: "#E0CBD6" },
};

export function FashionImage({
  tone,
  pose,
  alt,
  uid,
  className,
}: {
  tone: string;
  pose: Pose;
  alt: string;
  uid: string;
  className?: string;
}) {
  const p = palettes[tone] ?? palettes.blush;
  const gid = `${tone}-${pose}-${uid}`;

  return (
    <svg
      className={className}
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={alt}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <linearGradient id={`bg-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.bg} />
          <stop offset="1" stopColor={p.bg2} />
        </linearGradient>
        <clipPath id={`clip-${gid}`}><rect width="400" height="500" /></clipPath>
      </defs>

      <g clipPath={`url(#clip-${gid})`}>
        {/* Backdrop */}
        <rect width="400" height="500" fill={`url(#bg-${gid})`} />
        {/* Soft arch */}
        <path d="M60 500 V220 a140 140 0 0 1 280 0 V500 Z" fill="#ffffff" opacity="0.18" />
        {/* Botanical accents */}
        <g opacity="0.16" fill={p.hair}>
          <path d="M356 70 q30 40 6 96 q-24 -46 -6 -96 Z" />
          <path d="M30 400 q34 -34 88 -24 q-40 36 -88 24 Z" />
        </g>

        <Figure pose={pose} p={p} />

        {/* Foreground grain / vignette */}
        <rect width="400" height="500" fill="#000" opacity="0.04" />
        <rect x="0" y="430" width="400" height="70" fill="#000" opacity="0.05" />
      </g>
    </svg>
  );
}

function Figure({ pose, p }: { pose: Pose; p: { skin: string; hair: string; outfit: string; outfit2: string } }) {
  const { skin, hair, outfit, outfit2 } = p;

  if (pose === "detail") {
    // Accessory / flat-lay composition (bag + sunglasses)
    return (
      <g>
        <ellipse cx="200" cy="470" rx="150" ry="26" fill="#000" opacity="0.06" />
        <rect x="120" y="200" width="160" height="130" rx="10" fill={outfit} />
        <rect x="120" y="200" width="160" height="34" rx="10" fill={outfit2} opacity="0.6" />
        <path d="M150 200 q50 -60 100 0" fill="none" stroke={hair} strokeWidth="6" opacity="0.5" />
        <circle cx="160" cy="130" r="26" fill="none" stroke={hair} strokeWidth="7" opacity="0.7" />
        <circle cx="230" cy="130" r="26" fill="none" stroke={hair} strokeWidth="7" opacity="0.7" />
        <line x1="186" y1="130" x2="204" y2="130" stroke={hair} strokeWidth="7" opacity="0.7" />
      </g>
    );
  }

  // Shared head + hair helper positions differ slightly by pose
  const headX = pose === "profile" ? 214 : pose === "walk" ? 190 : 200;

  return (
    <g>
      <ellipse cx="200" cy="482" rx="120" ry="20" fill="#000" opacity="0.06" />
      {/* Hair back */}
      <path d={`M${headX - 42} 150 q0 -78 42 -78 q42 0 42 78 q0 70 -20 120 q-22 -18 -44 0 q-20 -50 -20 -120 Z`} fill={hair} />
      {/* Neck */}
      <rect x={headX - 12} y="150" width="24" height="34" fill={skin} />
      {/* Head */}
      <ellipse cx={headX} cy="118" rx="34" ry="40" fill={skin} />
      {/* Hair front */}
      <path d={`M${headX - 36} 112 q6 -46 36 -46 q30 0 36 46 q-16 -20 -36 -20 q-20 0 -36 20 Z`} fill={hair} />

      {/* Body / outfit — varies by pose */}
      {pose === "portrait" && (
        <>
          <path d="M150 184 q50 -20 100 0 l26 150 q-76 26 -152 0 Z" fill={outfit} />
          <path d="M150 184 q50 -20 100 0 l10 60 q-60 18 -120 0 Z" fill={outfit2} opacity="0.5" />
          <rect x="128" y="330" width="144" height="150" fill={outfit} opacity="0.92" />
        </>
      )}
      {pose === "seated" && (
        <>
          <path d="M150 186 q50 -18 100 0 l30 130 q-80 24 -160 0 Z" fill={outfit} />
          <path d="M120 316 q80 26 160 0 l4 90 q-84 22 -168 0 Z" fill={outfit2} />
        </>
      )}
      {pose === "walk" && (
        <>
          <path d="M150 184 q40 -18 90 0 l20 120 q-66 22 -132 0 Z" fill={outfit} />
          <path d="M128 300 l30 180 h24 l4 -150 l6 150 h24 l18 -180 q-64 22 -106 0 Z" fill={outfit2} />
        </>
      )}
      {pose === "profile" && (
        <>
          <path d="M168 184 q54 -18 96 6 l14 140 q-70 22 -128 0 Z" fill={outfit} />
          <rect x="150" y="322" width="128" height="158" fill={outfit2} opacity="0.9" />
        </>
      )}
      {pose === "duo" && (
        <>
          <path d="M150 184 q50 -18 100 0 l24 150 q-74 24 -148 0 Z" fill={outfit} />
          <rect x="132" y="330" width="136" height="150" fill={outfit2} opacity="0.9" />
        </>
      )}
    </g>
  );
}
