// Admin marks a reconciliation record as RESOLVED with a note.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  let body: { note?: string } = {};
  try { body = await request.json(); } catch { /* optional */ }
  const tx = await db.paymentTransaction.update({
    where: { id },
    data: {
      reconciliationStatus: "RESOLVED",
      reconciliationNote: (body.note ?? "Manually resolved by admin.").slice(0, 500),
    },
  });
  await db.adminAuditLog.create({ data: {
    adminId: session.user?.id ?? "unknown", action: "RESOLVE_RECONCILIATION",
    entityType: "PaymentTransaction", entityId: id,
    metadata: JSON.stringify({ note: body.note }),
  }});
  return NextResponse.json({ ok: true, status: tx.reconciliationStatus });
}
