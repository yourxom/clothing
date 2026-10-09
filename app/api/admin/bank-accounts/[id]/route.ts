// Admin: get, update, or soft-delete a specific bank payment account.
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import {
  getBankAccount, updateBankAccount, deleteBankAccount,
  type UpdateBankAccountInput,
} from "@/lib/payments/bank-account-service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  const account = await getBankAccount(id);
  if (!account) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true, account });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const b = (body as Record<string, unknown>) ?? {};

  if (b.merchantVpa && typeof b.merchantVpa === "string") {
    if (!/^[\w.+-]{2,256}@[\w.-]{2,64}$/.test(b.merchantVpa.trim())) {
      return NextResponse.json({ error: "merchantVpa must be a valid UPI ID." }, { status: 422 });
    }
  }

  const input: UpdateBankAccountInput = { id, ...b as Omit<UpdateBankAccountInput, "id"> };
  try {
    const account = await updateBankAccount(input, session.user?.id ?? "unknown");
    return NextResponse.json({ ok: true, account });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 422 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  try {
    await deleteBankAccount(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 422 });
  }
}
