// Admin reconciliation API — list all PaymentTransaction rows with filters.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const sp       = new URL(request.url).searchParams;
  const provider = sp.get("provider") ?? "";
  const status   = sp.get("status")   ?? "";
  const q        = sp.get("q")?.trim() ?? "";
  const page     = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const PAGE     = 50;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};
  if (provider) where.provider = provider.toLowerCase();
  if (status)   where.reconciliationStatus = status;
  if (q) {
    where.OR = [
      { providerTransactionId: { contains: q } },
      { rrn:   { contains: q } },
      { utr:   { contains: q } },
      { merchantReference: { contains: q } },
      { orderId: { contains: q } },
    ];
  }

  const [total, transactions] = await Promise.all([
    db.paymentTransaction.count({ where }),
    db.paymentTransaction.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      skip:  (page - 1) * PAGE,
      take:  PAGE,
      include: {
        bankAccount: { select: { id: true, displayName: true, provider: true, merchantVpa: true } },
        payment:     { select: { id: true, status: true, expectedAmountPaise: true } },
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    transactions,
    pagination: { total, page, pageSize: PAGE, pages: Math.ceil(total / PAGE) },
  });
}
