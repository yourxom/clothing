// Admin payments list — GET all payments with filters + search.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const method   = searchParams.get("method");   // MERCHANT_UPI | PERSONAL_UPI
  const status   = searchParams.get("status");   // any PaymentState
  const q        = searchParams.get("q")?.trim();
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = 25;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (method) where.paymentMethod = method;
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { order: { orderNumber: { contains: q } } },
      { utr:   { contains: q } },
      { providerPaymentId: { contains: q } },
      { order: { user: { email: { contains: q } } } },
    ];
  }

  const [total, payments] = await Promise.all([
    db.payment.count({ where }),
    db.payment.findMany({
      where,
      include: {
        order: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  // Aggregate stats for the stats cards.
  const [statTotal, statPaid, statUnderReview, statFailed, statRejected, statRefunded] = await Promise.all([
    db.payment.count(),
    db.payment.count({ where: { status: "PAID" } }),
    db.payment.count({ where: { status: "UNDER_REVIEW" } }),
    db.payment.count({ where: { status: "FAILED" } }),
    db.payment.count({ where: { status: "REJECTED" } }),
    db.payment.count({ where: { status: { in: ["REFUNDED", "PARTIALLY_REFUNDED"] } } }),
  ]);

  return NextResponse.json({
    ok: true,
    payments,
    pagination: { total, page, pageSize, pages: Math.ceil(total / pageSize) },
    stats: { total: statTotal, paid: statPaid, underReview: statUnderReview, failed: statFailed, rejected: statRejected, refunded: statRefunded },
  });
}
