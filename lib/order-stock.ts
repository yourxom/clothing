import type { Prisma } from "@prisma/client";

type OrderLineStock = { variantSku: string; quantity: number };

/**
 * Returns previously-reserved stock back to inventory for a set of order lines.
 * Used when a reserved order (COD, or a paid order) is cancelled or refunded.
 *
 * Must run inside a transaction. Matches variants by their unique SKU snapshot
 * stored on each order line. Silently skips lines whose variant/inventory no
 * longer exists (e.g. the product was deleted after the order was placed).
 */
export async function restoreOrderStock(
  tx: Prisma.TransactionClient,
  lines: readonly OrderLineStock[]
): Promise<void> {
  for (const line of lines) {
    const variant = await tx.productVariant.findUnique({
      where:  { sku: line.variantSku },
      select: { inventory: { select: { id: true, quantity: true } } },
    });
    if (variant?.inventory) {
      await tx.inventory.update({
        where: { id: variant.inventory.id },
        data:  { quantity: variant.inventory.quantity + line.quantity },
      });
    }
  }
}
