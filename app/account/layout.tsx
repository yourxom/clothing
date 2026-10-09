import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AccountSidebar } from "@/components/account-sidebar";
import type { ReactNode } from "react";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { name: true, email: true, phone: true, createdAt: true },
  });

  // Session exists but no matching DB row (e.g. deleted account or a stale
  // token) — send them back to sign in rather than render a broken account.
  if (!user) redirect("/login");

  const [orderCount, wishlistCount, addressCount] = await Promise.all([
    db.order.count({ where: { userId: session.user.id } }),
    db.savedItem.count({ where: { userId: session.user.id, type: "WISHLIST" } }),
    db.address.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <div className="account-layout">
      <AccountSidebar
        user={{ name: user.name, email: user.email || (session.user.email ?? ""), phone: user.phone }}
        stats={{ orders: orderCount, wishlist: wishlistCount, addresses: addressCount }}
      />
      <div className="account-content">
        {children}
      </div>
    </div>
  );
}
