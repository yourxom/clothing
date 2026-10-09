import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";
import { getPaymentSettings } from "@/lib/payments/settings";
import { PaymentSettingsForm } from "@/components/payment-settings-form";

export const metadata: Metadata = { title: "Payment Settings — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPaymentSettingsPage() {
  const session = await requireAdmin();
  if (!session) redirect("/login");

  const settings = await getPaymentSettings();

  return (
    <div className="admin-page">
      <nav className="catalog-breadcrumb" style={{ marginBottom: "1rem" }}>
        <Link href="/admin/settings">Settings</Link>
        <span aria-hidden="true"> / </span>
        Payment Settings
      </nav>
      <h1 className="admin-heading">Payment Settings</h1>
      <p className="muted" style={{ marginBottom: "2rem", fontSize: ".85rem" }}>
        Configure how customers pay. You can enable Merchant UPI (automatic verification),
        Personal UPI (manual verification), or both. If both are enabled, customers choose
        at checkout. API secrets and webhook secrets are encrypted and are never sent to the browser.
      </p>

      <PaymentSettingsForm initial={settings} />
    </div>
  );
}
