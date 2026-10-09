"use client";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePreviewStore } from "./preview-store";

/**
 * When a user is logged in, mirror their localStorage wishlist + bag to the
 * server (DB) so it persists across devices. Runs a one-time push on login,
 * then keeps pushing on subsequent changes (debounced).
 * Guests are unaffected — everything stays in localStorage.
 */
export function PreviewSync() {
  const { data: session, status } = useSession();
  const { ready, state } = usePreviewStore();
  const lastPushed = useRef<string>("");
  const debounce   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inFlight   = useRef(false);

  const userId = session?.user?.id;

  useEffect(() => {
    if (status !== "authenticated" || !userId || !ready) return;

    // Serialize current local state to detect changes
    const snapshot = JSON.stringify({ wishlist: state.wishlist, bag: state.bag });
    if (snapshot === lastPushed.current) return;

    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        // Push wishlist items
        for (const slug of state.wishlist) {
          await fetch("/api/saved", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productSlug: slug, type: "WISHLIST" }),
          }).catch(() => {});
        }
        // Push bag items (including chosen color)
        for (const item of state.bag) {
          if (!item.size) continue;
          await fetch("/api/saved", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productSlug: item.slug,
              type: "BAG",
              size: item.size,
              color: item.color || "",
              quantity: item.quantity,
            }),
          }).catch(() => {});
        }
        lastPushed.current = snapshot;
      } catch { /* silent — sync is best-effort */ } finally {
        inFlight.current = false;
      }
    }, 800);

    return () => clearTimeout(debounce.current);
  }, [status, userId, ready, state]);

  return null;
}
