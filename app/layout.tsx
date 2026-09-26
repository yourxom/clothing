import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import "./landing.css";
import "./catalog.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-serif", display: "swap" });
const sans = DM_Sans({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = { title: { default: "AURELIA | A softer way to dress", template: "%s | AURELIA" }, description: "Explore original contemporary Indian fashion concepts at AURELIA. The shopping experience is coming soon.", icons: { icon: "/icon.svg" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en-IN" className={`${serif.variable} ${sans.variable}`}><body><a className="skip-link" href="#main-content">Skip to content</a><SiteHeader />{children}<SiteFooter /></body></html>; }
