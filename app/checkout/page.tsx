import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPreviewProducts } from "@/lib/catalog-reader";
import { getDeliveryConfig, estimateDeliveryRange, getReferralConfig } from "@/lib/settings";
import { CheckoutForm } from "@/components/checkout-form";
import { GuestCheckoutLoader } from "@/components/guest-checkout-loader";

export const metadata: Metadata = {
  title: "Checkout — AURELIA",
  description: "Complete your AURELIA order.",
};
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session  = await auth();

  // Checkout requires an account. Send guests to sign in and return here after.
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/checkout");
  }

  const products = await getPreviewProducts();

  // Delivery estimate (admin-configurable)
  const del = await getDeliveryConfig();
  const range = estimateDeliveryRange(del.minDays, del.maxDays);
  const delivery = { minDays: del.minDays, maxDays: del.maxDays, from: range.from, to: range.to };

  // Points / store credit the shopper can redeem (only when the program is on).
  const referralCfg = await getReferralConfig();
  const me = await db.user.findUnique({ where: { id: session.user.id }, select: { pointsBalance: true } });
  const pointsBalancePaise = referralCfg.enabled ? (me?.pointsBalance ?? 0) : 0;

  // Load server-side bag for logged-in users
  let serverLines: { product: (typeof products)[number]; size: string; color: string; quantity: number }[] = [];
  let savedAddresses: { id: string; fullName: string; phone: string; line1: string; line2: string | null; city: string; state: string; pincode: string; isDefault: boolean }[] = [];

  if (session?.user?.id) {
    const [bagItems, addresses, latestOrder] = await Promise.all([
      db.savedItem.findMany({
        where:   { userId: session.user.id, type: "BAG" },
        include: { product: { select: { slug: true } } },
      }),
      db.address.findMany({
        where:   { userId: session.user.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        select:  { id: true, fullName: true, phone: true, line1: true, line2: true, city: true, state: true, pincode: true, isDefault: true },
      }),
      db.order.findFirst({
        where:   { userId: session.user.id, shippingAddressId: { not: null } },
        orderBy: { createdAt: "desc" },
        include: {
          shippingAddress: {
            select: { id: true, fullName: true, phone: true, line1: true, line2: true, city: true, state: true, pincode: true, isDefault: true },
          },
        },
      }),
    ]);

    serverLines = bagItems
      .map(item => {
        const product = products.find(p => p.slug === item.product.slug);
        return product ? { product, size: item.size ?? "", color: item.color ?? "", quantity: item.quantity } : null;
      })
      .filter((l): l is NonNullable<typeof l> => l !== null && l.size !== "");

    // Deduplicate addresses by normalized fields
    const normalize = (a: { fullName: string; line1: string; city: string; pincode: string }) =>
      `${a.fullName.trim().toLowerCase()}|${a.line1.trim().toLowerCase()}|${a.city.trim().toLowerCase()}|${a.pincode.trim()}`;

    const seen = new Set<string>();
    const uniqueSaved: typeof addresses = [];
    for (const a of addresses) {
      const key = normalize(a);
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSaved.push(a);
      }
    }

    // Default saved address or last used address
    const defaultSaved = uniqueSaved.find(a => a.isDefault);
    const lastUsed = latestOrder?.shippingAddress ?? uniqueSaved[0] ?? null;

    if (defaultSaved) {
      // If user has a default saved address, show default (and any other distinct saved address)
      savedAddresses = uniqueSaved;
    } else if (lastUsed) {
      // If no default address is explicitly saved, show ONLY the last one used
      savedAddresses = [lastUsed];
    } else {
      savedAddresses = [];
    }
  }

  return (
    <main id="main-content" className="container shop-page">
      <nav className="catalog-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span>
        <Link href="/bag">Bag</Link><span aria-hidden="true">/</span>
        Checkout
      </nav>

      <div className="shop-intro" style={{ paddingBottom: "1rem" }}>
        <span className="eyebrow">Secure checkout</span>
        <h1 className="serif">Complete your order.</h1>
      </div>

      {/* Signed-in user with a server-side bag */}
      {serverLines.length > 0 ? (
        <CheckoutForm
          lines={serverLines}
          savedAddresses={savedAddresses}
          userEmail={session.user.email ?? undefined}
          userName={session.user.name  ?? undefined}
          delivery={delivery}
          pointsBalancePaise={pointsBalancePaise}
        />
      ) : (
        /* Signed-in but empty server bag — hydrate from localStorage */
        <GuestCheckoutLoader
          products={products}
          isLoggedIn
          delivery={delivery}
          userEmail={session.user.email ?? undefined}
          userName={session.user.name ?? undefined}
          pointsBalancePaise={pointsBalancePaise}
        />
      )}
    </main>
  );
}
