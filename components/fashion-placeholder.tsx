type Tone = "rose" | "olive" | "blue" | "clay" | "sand" | "plum";
type Artwork = "drape" | "fold" | "petal" | "arch";
const treatment: Record<Tone, Artwork> = { rose: "petal", olive: "fold", blue: "arch", clay: "drape", sand: "fold", plum: "petal" };

/** Abstract concept art, never a representation of an available garment. */
export function FashionPlaceholder({ label, tone = "sand", className = "", artwork }: {
  label: string;
  tone?: Tone;
  className?: string;
  artwork?: Artwork;
}) {
  const variant = artwork ?? treatment[tone];
  return (
    <div role="img" aria-label={`${label} — abstract concept artwork, not a product photograph`} className={`visual visual--${tone} visual--${variant} ${className}`}>
      <span className="visual-shape" aria-hidden="true" />
      <span className="visual-mark" aria-hidden="true">A</span>
      <span className="placeholder-caption" aria-hidden="true">Concept artwork · {label}</span>
    </div>
  );
}
