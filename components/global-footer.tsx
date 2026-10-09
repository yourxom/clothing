import { Playfair_Display, Inter } from "next/font/google";
import "../app/veloura/veloura.css";
import { Footer } from "../app/veloura/components/footer";

// The premium AURELIA footer, wrapped in the .vl-root scope + its fonts so it
// renders identically on every page (not just the homepage).
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

export function GlobalFooter() {
  return (
    <div className={`vl-root ${playfair.variable} ${inter.variable}`} style={{ background: "transparent" }}>
      <Footer />
    </div>
  );
}
