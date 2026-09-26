import type { Metadata } from "next";
import "./globals.css";
import "./landing.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
export const metadata: Metadata = { title: { default: "AURELIA | A softer way to dress", template: "%s | AURELIA" }, description: "Discover original contemporary Indian fashion at AURELIA. The new collection is coming soon.", icons: { icon: "/icon.svg" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en-IN"><body><a className="skip-link" href="#main-content">Skip to content</a><SiteHeader />{children}<SiteFooter /></body></html>; }
