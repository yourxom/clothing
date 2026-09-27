"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { addToBag, emptyPreviewList, parsePreviewList, serializePreviewList, setBagQuantity, toggleWishlist, type PreviewList } from "@/lib/preview-list";

const KEY = "aurelia-preview-list-v1";
type Store = { ready: boolean; state: PreviewList; save: (slug: string) => void; add: (slug: string, size: string) => void; quantity: (slug: string, size: string, count: number) => void };
const PreviewContext = createContext<Store | null>(null);
export function PreviewStore({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PreviewList>(emptyPreviewList);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { setState(parsePreviewList(window.localStorage.getItem(KEY))); } catch { /* Storage may be unavailable; keep in-memory state. */ }
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.key === KEY || event.key === null) setState(parsePreviewList(event.key === null ? null : event.newValue));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(KEY, serializePreviewList(state)); } catch { /* Storage blocked; state remains usable until page reload. */ }
  }, [ready, state]);
  const value: Store = {
    ready, state,
    save: slug => { if (ready) setState(current => toggleWishlist(current, slug)); },
    add: (slug, size) => { if (ready) setState(current => addToBag(current, slug, size)); },
    quantity: (slug, size, count) => { if (ready) setState(current => setBagQuantity(current, slug, size, count)); },
  };
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}
export function usePreviewStore(): Store {
  const store = useContext(PreviewContext);
  if (!store) throw new Error("PreviewStore is required for preview actions");
  return store;
}
