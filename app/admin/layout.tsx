import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";
import { AdminNav } from "@/components/admin-nav";
import type { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();
  if (!session) {
    redirect("/login");
  }
  return (
    <div className="admin-layout">
      <AdminNav />
      <main className="admin-main">{children}</main>
    </div>
  );
}
