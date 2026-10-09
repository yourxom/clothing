// Indian GST for apparel (HSN 61/62):
//  - 5% GST on items priced up to ₹1,000 (per unit)
//  - 12% GST on items priced above ₹1,000 (per unit)
// All amounts in paise (integer).

const THRESHOLD_PAISE = 100000; // ₹1,000

export function gstRateForUnitPaise(unitPaise: number): number {
  return unitPaise > THRESHOLD_PAISE ? 0.12 : 0.05;
}

/**
 * Calculates total GST across order lines.
 * Prices are treated as GST-inclusive is FALSE here — tax is added on top of subtotal.
 * Returns tax in paise, rounded to nearest paise.
 */
export function calculateGst(
  lines: { unitPaise: number; quantity: number }[]
): number {
  let tax = 0;
  for (const line of lines) {
    const rate = gstRateForUnitPaise(line.unitPaise);
    tax += Math.round(line.unitPaise * line.quantity * rate);
  }
  return tax;
}
