// Stock level thresholds — adjust when real inventory is wired up.
export type StockLevel = "in_stock" | "low_stock" | "out_of_stock" | "preview";

export function getStockLevel(quantity: number | null | undefined): StockLevel {
  if (quantity === null || quantity === undefined) return "preview"; // demo/preview product
  if (quantity <= 0)  return "out_of_stock";
  if (quantity <= 3)  return "low_stock";
  return "in_stock";
}

const LABELS: Record<StockLevel, string> = {
  in_stock:      "In stock",
  low_stock:     "Only a few left",
  out_of_stock:  "Out of stock",
  preview:       "Preview only",
};

export function StockIndicator({
  level, showLabel = true, size = "md",
}: {
  level: StockLevel;
  showLabel?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`stock-indicator stock-indicator--${level} stock-indicator--${size}`}
      aria-label={LABELS[level]}
    >
      <span className="stock-dot" aria-hidden="true" />
      {showLabel && <span>{LABELS[level]}</span>}
    </span>
  );
}
