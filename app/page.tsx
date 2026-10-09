import { Playfair_Display, Inter } from "next/font/google";
import "./veloura/veloura.css";
import { getPreviewProducts } from "@/lib/catalog-reader";
import { toVProduct } from "./veloura/data";
import { AnnouncementBar, Header } from "./veloura/components/header";
import { Hero } from "./veloura/components/hero";
import {
  CategorySection,
  TrendingSection,
  SaleBanner,
  OccasionSection,
  BestSellersSection,
  EditorialSection,
} from "./veloura/components/sections";
import { TestimonialsSection } from "./veloura/components/testimonials";
import { NewsletterSection } from "./veloura/components/newsletter";
import { Footer } from "./veloura/components/footer";
import { WhatsAppQueryWidget } from "@/components/whatsapp-query-widget";

export const dynamic = "force-dynamic";

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

export default async function Home() {
  // Real, published products from the database (falls back to demo if DB offline).
  const products = await getPreviewProducts();

  // Products arrive grouped by category, so a naive slice would make Trending and
  // Best Sellers look near-identical. Instead, pick ONE product per category and
  // split those picks between the two rows so each shows a distinct, varied mix.
  const byCategory = new Map<string, typeof products>();
  for (const p of products) {
    const list = byCategory.get(p.category) ?? [];
    list.push(p);
    byCategory.set(p.category, list);
  }
  const categoriesList = [...byCategory.values()];

  // Trending: first item of each category. Best Sellers: a later item of each.
  const trendingPicks = categoriesList.map((list) => list[0]).filter(Boolean);
  const bestPicks = categoriesList
    .map((list) => list[Math.min(2, list.length - 1)] ?? list[list.length - 1])
    .filter(Boolean);

  const trending = trendingPicks.slice(0, 6).map(toVProduct);
  const bestSellers = bestPicks.slice(0, 6).map((p, i) => ({
    ...toVProduct(p, i + 20), // offset the pseudo-rating seed so ratings differ
    badge: i === 0 ? "Bestseller" : undefined,
  }));

  return (
    <div id="top" className={`vl-root ${playfair.variable} ${inter.variable}`}>
      {/* 1. Promotional announcement bar */}
      <AnnouncementBar />
      {/* 2. Main navigation header */}
      <Header />

      <main id="main-content">
        {/* 3. Hero */}
        <Hero />
        {/* 4. Shop by Category */}
        <CategorySection />
        {/* 5. Trending Now — real products */}
        <TrendingSection products={trending} />
        {/* 6. Mid Season Sale */}
        <SaleBanner />
        {/* 7. Shop by Occasion */}
        <OccasionSection />
        {/* 8. Best Sellers — real products */}
        <BestSellersSection products={bestSellers} />
        {/* 9. Brand Story / Editorial */}
        <EditorialSection />
        {/* 10. Customer Testimonials */}
        <TestimonialsSection />
        {/* 11. Newsletter */}
        <NewsletterSection />
      </main>

      {/* 12. Footer */}
      <Footer />

      {/* Floating WhatsApp query widget */}
      <WhatsAppQueryWidget />
    </div>
  );
}
