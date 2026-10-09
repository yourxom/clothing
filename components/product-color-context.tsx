"use client";
import { createContext, useContext, useState, type ReactNode } from "react";

type Ctx = {
  color: string;
  setColor: (c: string) => void;
};

const ProductColorContext = createContext<Ctx | null>(null);

/**
 * Shares the currently-selected colourway between the product photo and the
 * buy box, so picking a colour can swap the displayed image. Wraps the whole
 * product-detail block. `initialColor` should be the buy box's default colour.
 */
export function ProductColorProvider({
  initialColor,
  children,
}: {
  initialColor: string;
  children: ReactNode;
}) {
  const [color, setColor] = useState(initialColor);
  return (
    <ProductColorContext.Provider value={{ color, setColor }}>
      {children}
    </ProductColorContext.Provider>
  );
}

/** Read/update the shared selected colour. Safe to call outside a provider. */
export function useProductColor(): Ctx {
  const ctx = useContext(ProductColorContext);
  // Always call hooks unconditionally (rules of hooks). This local state is only
  // used as a defensive fallback when there's no provider above.
  const [local, setLocal] = useState("");
  return ctx ?? { color: local, setColor: setLocal };
}
