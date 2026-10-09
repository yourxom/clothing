import type { Metadata } from "next";
import Link from "next/link";
import { StoryMedia } from "@/components/story-media";

export const metadata: Metadata = {
  title: "About AURELIA",
  description: "Learn about AURELIA — a contemporary Indian fashion brand rooted in tradition, made for the rhythm of modern life.",
};

export default function AboutPage() {
  return (
    <main id="main-content" className="about-page">
      {/* Hero — full-bleed photo with the copy overlaid (same style as the landing hero) */}
      <section className="about-hero about-hero--photo">
        <StoryMedia src="/about/hero.png" label="AURELIA brand story" tone="sand" artwork="arch" className="about-hero__bg" />
        <div className="about-hero__scrim" aria-hidden="true" />
        <div className="container about-hero__overlay">
          <span className="eyebrow">Our story</span>
          <h1 className="serif">Made here.<br />Worn everywhere.</h1>
          <p className="content-lead">
            AURELIA is a contemporary Indian clothing brand drawing from the country&apos;s
            rich textile heritage — block prints from Jaipur, chanderi from Madhya Pradesh,
            handwoven linen from the coasts. Every piece carries that story forward.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">What we stand for</span>
            <h2 className="serif">The AURELIA promise.</h2>
          </div>
        </div>
        <div className="about-values">
          <div className="about-value-card">
            <span className="about-value-icon">✦</span>
            <h3>Responsibly made</h3>
            <p>Every piece is crafted with care for the artisan and the environment. We work directly with weavers and craftspeople across India.</p>
          </div>
          <div className="about-value-card">
            <span className="about-value-icon">✦</span>
            <h3>Ethically sourced</h3>
            <p>Fabrics and materials are chosen for quality, longevity, and sustainability. We prioritise natural fibres and low-impact processes.</p>
          </div>
          <div className="about-value-card">
            <span className="about-value-icon">✦</span>
            <h3>Transparent always</h3>
            <p>We label artwork, pricing, and availability honestly. You will never see manufactured urgency, invented reviews, or misleading claims here.</p>
          </div>
          <div className="about-value-card">
            <span className="about-value-icon">✦</span>
            <h3>Easy returns</h3>
            <p>Hassle-free returns within 15 days of delivery. Your satisfaction is non-negotiable — we will make it right.</p>
          </div>
        </div>
      </section>

      {/* Heritage */}
      <section className="section section--tinted">
        <div className="container">
          <div className="editorial" style={{ background: "transparent" }}>
            <StoryMedia src="/about/heritage.png" label="Indian textile heritage" tone="clay" artwork="fold" />
            <div className="editorial-copy">
              <span className="eyebrow">Heritage &amp; craft</span>
              <h2 className="serif">Tradition, with room to move.</h2>
              <p>
                India&apos;s textile traditions span thousands of years. Block printing, hand embroidery,
                natural dyeing, handloom weaving — each technique represents generations of knowledge
                passed down through families. AURELIA exists to honour that legacy while making it
                relevant for the way women live today.
              </p>
              <p style={{ marginTop: "1rem" }}>
                Our collections draw from regional craft clusters — the kalamkari artists of Andhra Pradesh,
                the phulkari embroiderers of Punjab, the bandhani dyers of Gujarat. Each piece is
                an original concept rooted in these living traditions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team note */}
      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Where we are</span>
            <h2 className="serif">A brand in the making.</h2>
          </div>
        </div>
        <div className="about-phase-note">
          <p>
            AURELIA is currently in its preview phase. Our catalogue is being developed, verified, and
            photographed. The designs you see are original concepts — each one will be produced in
            partnership with Indian artisans and craftspeople.
          </p>
          <p>
            Shopping, checkout, and delivery will launch in a future phase. Until then, explore the
            collection, save styles you love, and sign up to be the first to know when we open.
          </p>
          <div className="about-cta-row">
            <Link className="button" href="/shop">Explore the preview</Link>
            <Link className="button button-outline" href="/contact">Get in touch</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
