import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { sendRestockEmail } from "@/lib/email";

export async function PATCH(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { variantId, quantity } = (body as Record<string, unknown>) ?? {};
  if (!variantId || typeof variantId !== "string") {
    return NextResponse.json({ error: "variantId required." }, { status: 422 });
  }
  const qty = Math.max(0, Math.min(9999, parseInt(String(quantity ?? 0)) || 0));

  // Snapshot the previous quantity so we can detect a 0 -> positive restock.
  const previous = await db.inventory.findUnique({
    where: { variantId: String(variantId) },
    select: { quantity: true },
  });
  const previousQty = previous?.quantity ?? 0;

  const inventory = await db.inventory.upsert({
    where:  { variantId: String(variantId) },
    update: { quantity: qty, updatedAt: new Date() },
    create: { variantId: String(variantId), quantity: qty },
  });

  // Fire restock alerts when stock crosses from 0 into positive. Non-blocking.
  if (previousQty === 0 && qty > 0) {
    void dispatchRestockAlerts(String(variantId)).catch(err =>
      console.error("[inventory] restock alert dispatch failed:", err)
    );
  }

  return NextResponse.json({ ok: true, inventory });
}

/**
 * Finds pending StockAlerts for the variant's product+size and emails each one,
 * marking them notified so they only fire once.
 */
async function dispatchRestockAlerts(variantId: string) {
  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    select: { size: true, product: { select: { slug: true, name: true } } },
  });
  if (!variant?.product) return;

  const { slug, name } = variant.product;

  // Match alerts for this exact size, plus size-agnostic alerts (size = null).
  const alerts = await db.stockAlert.findMany({
    where: {
      productSlug: slug,
      notified: false,
      OR: [{ size: variant.size }, { size: null }],
    },
  });
  if (alerts.length === 0) return;

  await Promise.all(
    alerts.map(async (alert) => {
      const res = await sendRestockEmail(alert.email, name, slug, alert.size ?? variant.size);
      if (res?.ok) {
        await db.stockAlert.update({ where: { id: alert.id }, data: { notified: true } });
      }
    })
  );
}
