import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./veloura.css";

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

export const metadata: Metadata = {
  title: "AURELIA — Modern Women's Fashion",
  description:
    "AURELIA — modern women's fashion for confident, contemporary women. Shop dresses, tops, co-ords and accessories. New season, new you.",
};

export default function VelouraLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`vl-root ${playfair.variable} ${inter.variable}`}>
      {children}
    </div>
  );
}
