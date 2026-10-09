// Admin rejects a Personal UPI payment submission.
// The original record is NEVER deleted — only status changes to REJECTED.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { rejectPayment } from "@/lib/payments/payment-service";
import { db } from "@/lib/db";
import { sendPaymentRejectedEmail } from "@/lib/email";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;

  let body: { reason?: string };
  try { body = await request.json(); } catch { body = {}; }
  const reason = (body.reason ?? "").trim().slice(0, 300);
  if (!reason) return NextResponse.json({ error: "A rejection reason is required." }, { status: 422 });

  const payment = await db.payment.findUnique({
    where: { id },
    include: { order: { include: { user: { select: { email: true } } } } },
  });
  if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  if (payment.status === "PAID") {
    return NextResponse.json({ error: "Cannot reject an already-paid payment." }, { status: 400 });
  }

  await rejectPayment(id, session.user?.id ?? "unknown", reason);

  const email = payment.order.user?.email;
  if (email) {
    sendPaymentRejectedEmail(email, payment.order.orderNumber, reason)
      .catch(console.error);
  }

  return NextResponse.json({ ok: true });
}
