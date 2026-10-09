import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Props) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const { status, adminNote, refundPaise } = (body as Record<string, unknown>) ?? {};
  const valid = ["REQUESTED", "APPROVED", "REJECTED", "RECEIVED", "REFUNDED"];
  if (!valid.includes(String(status))) {
    return NextResponse.json({ error: "Invalid status." }, { status: 422 });
  }

  const data: Record<string, unknown> = { status: String(status) };
  if (adminNote !== undefined)   data.adminNote   = String(adminNote).slice(0, 2000);
  if (refundPaise !== undefined) data.refundPaise = Math.max(0, Math.floor(Number(refundPaise) || 0));

  const returnRequest = await db.returnRequest.update({ where: { id }, data });

  // If refunded, mark the order as refunded too
  if (status === "REFUNDED") {
    await db.order.update({
      where: { id: returnRequest.orderId },
      data:  { status: "REFUNDED", paymentStatus: "REFUNDED" },
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, returnRequest });
}
