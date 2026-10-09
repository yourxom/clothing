import type { Metadata } from "next";
import Link from "next/link";
import { StoryMedia } from "@/components/story-media";
import { getSiteConfig } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Our Stores",
  description: "AURELIA store locations across India. Physical retail is coming soon — find out where we plan to be.",
};

const plannedCities = [
  {
    city: "Mumbai",
    area: "Bandra West",
    status: "Opening soon",
    note: "Our flagship store, set in the heart of Bandra's creative neighbourhood.",
    tone: "clay" as const,
    image: "/stores/mumbai.png",
  },
  {
    city: "Delhi",
    area: "Khan Market",
    status: "Opening soon",
    note: "A carefully considered space for the AURELIA edit in India's capital.",
    tone: "olive" as const,
    image: "/stores/delhi.png",
  },
  {
    city: "Bengaluru",
    area: "Indiranagar",
    status: "Planned",
    note: "A studio concept store planned for Indiranagar's design district.",
    tone: "blue" as const,
    image: "/stores/bengaluru.png",
  },
  {
    city: "Hyderabad",
    area: "Jubilee Hills",
    status: "Planned",
    note: "Planned for Jubilee Hills — the heart of Hyderabad's fashion scene.",
    tone: "plum" as const,
    image: "/stores/hyderabad.png",
  },
];

export default async function StoresPage() {
  const { domain } = await getSiteConfig();
  return (
    <main id="main-content">
      {/* Hero */}
      <section className="stores-hero">
        <div className="container stores-hero-inner">
          <div>
            <span className="eyebrow">Find AURELIA</span>
            <h1 className="serif">Made here.<br />Find us here.</h1>
            <p className="content-lead">
              AURELIA is online-first. Our physical stores are planned and will open alongside
              the full catalogue launch. Until then, explore the entire collection at {domain}.
            </p>
            <Link href="/shop" className="button" style={{ marginTop: "1.75rem" }}>Shop the preview online</Link>
          </div>
          <StoryMedia src="/stores/hero.png" label="AURELIA store concept" tone="sand" artwork="fold" />
        </div>
      </section>

      {/* Planned locations */}
      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Where we are going</span>
            <h2 className="serif">Planned locations.</h2>
          </div>
        </div>
        <p className="notice">
          No AURELIA stores are currently open. The locations below are planned — exact
          addresses, opening dates, and details will be confirmed closer to launch.
        </p>
        <div className="stores-grid">
          {plannedCities.map(store => (
            <div key={store.city} className="store-card">
              <div className="store-card-art">
                <StoryMedia src={store.image} label={`${store.city} store concept`} tone={store.tone} />
              </div>
              <div className="store-card-copy">
                <span className="store-status">{store.status}</span>
                <h3 className="serif">{store.city}</h3>
                <p className="store-area">{store.area}</p>
                <p>{store.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Online-first note */}
      <section className="section section--tinted">
        <div className="container">
          <div className="editorial" style={{ background: "transparent" }}>
            <div className="editorial-copy">
              <span className="eyebrow">Shop from anywhere</span>
              <h2 className="serif">Online first, always available.</h2>
              <p>
                While our physical stores are in development, the complete AURELIA collection
                will be available online across India. Fast delivery, easy returns, and the
                full catalogue at your fingertips.
              </p>
              <p style={{ marginTop: "1rem" }}>
                Sign up to be notified when stores open in your city.
              </p>
              <Link href="/#newsletter" className="button" style={{ marginTop: "1.5rem" }}>
                Get notified
              </Link>
            </div>
            <StoryMedia src="/stores/online.png" label="Online shopping concept" tone="olive" artwork="petal" />
          </div>
        </div>
      </section>

      {/* Store enquiries */}
      <section className="section container">
        <div className="store-enquiry">
          <span className="eyebrow">Get in touch</span>
          <h2 className="serif">Store enquiries &amp; pop-ups.</h2>
          <p>
            For wholesale, pop-up, or retail partnership enquiries — or if you&apos;d like to
            suggest a location — please reach out to our retail team.
          </p>
          <Link href="/contact" className="button button-outline" style={{ marginTop: "1.2rem" }}>
            Contact retail team
          </Link>
        </div>
      </section>
    </main>
  );
}
