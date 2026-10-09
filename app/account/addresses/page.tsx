import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AddressBook } from "@/components/address-book";

export const metadata: Metadata = { title: "My Addresses — AURELIA" };
export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const addresses = await db.address.findMany({
    where:   { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="acct-page">
      <div className="acct-page-header">
        <h1 className="acct-page-title serif">Saved Addresses</h1>
        <p className="acct-page-sub">Manage your delivery addresses for faster checkout</p>
      </div>
      <AddressBook initialAddresses={addresses} />
    </div>
  );
}
