"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout-form";
import type { Product } from "@/lib/catalog";

type DeliveryInfo = { minDays: number; maxDays: number; from: string; to: string };
type BagItem = { slug: string; size: string; color?: string; quantity: number };

// Matches the key + shape written by preview-store.tsx (parsePreviewList)
const STORAGE_KEY = "aurelia-preview-list-v1";

export function GuestCheckoutLoader({
  products,
  isLoggedIn,
  delivery,
  userEmail,
  userName,
  pointsBalancePaise = 0,
}: {
  products: Product[];
  isLoggedIn: boolean;
  delivery: DeliveryInfo;
  userEmail?: string;
  userName?: string;
  pointsBalancePaise?: number;
}) {
  const [lines, setLines] = useState<{ product: Product; size: string; color: string; quantity: number }[] | null>(null);

  useEffect(() => {
    try {
      // Read the preview store; support both the wrapped shape and a bare array.
      const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem("aurelia-bag-v1");
      let bag: BagItem[] = [];
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) bag = parsed;
        else if (parsed && Array.isArray(parsed.bag)) bag = parsed.bag;
      }
      const resolved = bag
        .map(item => {
          const product = products.find(p => p.slug === item.slug);
          return product && item.size ? { product, size: item.size, color: item.color ?? "", quantity: Math.max(1, item.quantity) } : null;
        })
        .filter((l): l is NonNullable<typeof l> => l !== null);
      setLines(resolved);
    } catch {
      setLines([]);
    }
  }, [products]);

  if (lines === null) {
    return (
      <div className="checkout-placing">
        <div className="checkout-placing-spinner" aria-hidden="true" />
        <p>Loading your bag…</p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div>
        <p className="notice">
          Your bag is empty.{" "}
          {!isLoggedIn && (
            <><Link href="/login">Sign in</Link> to load your saved bag, or </>
          )}
          <Link href="/shop">browse the collection ↗</Link>
        </p>
      </div>
    );
  }

  return (
    <CheckoutForm
      lines={lines}
      savedAddresses={[]}
      delivery={delivery}
      userEmail={userEmail}
      userName={userName}
      pointsBalancePaise={pointsBalancePaise}
    />
  );
}
