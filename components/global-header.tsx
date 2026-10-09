import { Playfair_Display, Inter } from "next/font/google";
import "../app/veloura/veloura.css";
import { Header } from "../app/veloura/components/header";

// The premium AURELIA (Veloura) header, wrapped in the .vl-root scope + its
// fonts so it renders identically on every page — the same navbar the landing
// page uses.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--vl-serif",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--vl-sans",
  display: "swap",
});

export function GlobalHeader() {
  // `display: contents` so this wrapper doesn't become the containing block for
  // the sticky `.vl-header` — that lets the header stay stuck to the top of the
  // viewport while the page content below it scrolls. The .vl-root class + font
  // variables still cascade their CSS custom properties to the header.
  return (
    <div className={`vl-root ${playfair.variable} ${inter.variable}`} style={{ display: "contents" }}>
      <Header />
    </div>
  );
}
