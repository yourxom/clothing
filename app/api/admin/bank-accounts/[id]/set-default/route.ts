import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { setDefaultBankAccount } from "@/lib/payments/bank-account-service";
import { db } from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  try {
    await setDefaultBankAccount(id, session.user?.id ?? "unknown");
    await db.adminAuditLog.create({ data: {
      adminId: session.user?.id ?? "unknown", action: "SET_DEFAULT_BANK_ACCOUNT",
      entityType: "BankPaymentAccount", entityId: id,
    }});
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 422 });
  }
}
