"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { addToBag, emptyPreviewList, parsePreviewList, serializePreviewList, setBagQuantity, toggleWishlist, parseComparison, serializeComparison, toggleComparison, type PreviewList } from "@/lib/preview-list";

const KEY = "aurelia-preview-list-v1";
const COMPARE_KEY = "aurelia-preview-compare-v1";
type Store = { ready: boolean; persistent: boolean; state: PreviewList; comparison: string[]; compare: (slug: string) => void; save: (slug: string) => void; add: (slug: string, size: string, color?: string) => void; quantity: (slug: string, size: string, color: string, count: number) => void; clearBag: () => void };
const PreviewContext = createContext<Store | null>(null);
export function PreviewStore({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PreviewList>(emptyPreviewList);
  const [comparison, setComparison] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [persistent, setPersistent] = useState(true);
  useEffect(() => {
    try { setState(parsePreviewList(window.localStorage.getItem(KEY))); setComparison(parseComparison(window.localStorage.getItem(COMPARE_KEY))); } catch { setPersistent(false); /* Storage may be unavailable; keep in-memory state. */ }
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) return;
      if (event.key === KEY || event.key === null) setState(parsePreviewList(event.key === null ? null : event.newValue));
      if (event.key === COMPARE_KEY || event.key === null) setComparison(parseComparison(event.key === null ? null : event.newValue));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(KEY, serializePreviewList(state)); window.localStorage.setItem(COMPARE_KEY, serializeComparison(comparison)); } catch { setPersistent(false); /* Continue as an in-memory planning list. */ }
  }, [ready, state, comparison]);
  const value: Store = {
    ready, persistent, state, comparison,
    compare: slug => { if (ready) setComparison(current => toggleComparison(current, slug)); },
    save: slug => { if (ready) setState(current => toggleWishlist(current, slug)); },
    add: (slug, size, color = "") => { if (ready) setState(current => addToBag(current, slug, size, color)); },
    quantity: (slug, size, color, count) => { if (ready) setState(current => setBagQuantity(current, slug, size, color, count)); },
    clearBag: () => { if (ready) setState(current => ({ ...current, bag: [] })); },
  };
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}
export function usePreviewStore(): Store {
  const store = useContext(PreviewContext);
  if (!store) throw new Error("PreviewStore is required for preview actions");
  return store;
}
