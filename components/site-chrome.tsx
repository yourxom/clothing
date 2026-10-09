"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Renders the global AURELIA site chrome (header, footer, cookie consent,
 * WhatsApp button) on every route EXCEPT standalone landing routes like
 * /veloura, which ship their own header/footer and must not inherit ours.
 */
export function SiteChrome({
  header,
  footer,
  extras,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  extras: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  // The homepage and the /veloura route ship their own header/footer, so they
  // must not inherit the global AURELIA chrome.
  const standalone = pathname === "/" || pathname === "/veloura" || pathname.startsWith("/veloura/");

  if (standalone) {
    return <>{children}</>;
  }

  return (
    <>
      {header}
      {children}
      {footer}
      {extras}
    </>
  );
}
