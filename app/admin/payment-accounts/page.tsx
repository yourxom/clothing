import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";
import { listBankAccounts } from "@/lib/payments/bank-account-service";
import { BankAccountsManager } from "@/components/bank-accounts-manager";

export const metadata: Metadata = { title: "Bank Payment Accounts — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminBankAccountsPage() {
  const session = await requireAdmin();
  if (!session) redirect("/login");
  const accounts = await listBankAccounts();
  return (
    <div className="admin-page">
      <div className="admin-heading-row">
        <div>
          <h1 className="admin-heading">Bank Payment Accounts</h1>
          <p className="muted" style={{ fontSize: ".82rem", marginTop: ".2rem" }}>
            Configure direct bank UPI merchant accounts. All API secrets are encrypted at rest
            and never exposed in browser responses.
          </p>
        </div>
      </div>
      <BankAccountsManager initial={accounts} />
    </div>
  );
}
