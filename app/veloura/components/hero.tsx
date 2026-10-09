"use client";
import { useCallback, useEffect, useState } from "react";
import { heroSlides } from "../data";
import { FashionImage } from "./fashion-image";

export function Hero() {
  const [i, setI] = useState(0);
  // Slide indexes whose photo failed to load (broken/missing URL). Those slides
  // gracefully fall back to the art-directed illustration.
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const count = heroSlides.length;

  const go = useCallback((n: number) => setI(((n % count) + count) % count), [count]);
  const next = useCallback(() => go(i + 1), [go, i]);
  const prev = useCallback(() => go(i - 1), [go, i]);

  // Auto-advance every 6s; pauses if the user prefers reduced motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((p) => (p + 1) % count), 6000);
    return () => clearInterval(t);
  }, [count]);

  const slide = heroSlides[i];
  // Show the full-bleed photo only when a URL is set AND it hasn't failed to load.
  const hasPhoto = Boolean(slide.image) && !failed[i];

  // Full-bleed variant: a single edge-to-edge photograph with the text overlaid
  // on a soft gradient scrim. Used when the slide has a real image URL.
  if (hasPhoto) {
    return (
      <section className="vl-hero vl-hero--photo" aria-roledescription="carousel" aria-label="Featured collections">
        <div className="vl-hero__full vl-reveal" key={i}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="vl-hero__bg"
            src={slide.image as string}
            alt={`${slide.titleTop} ${slide.titleAccent} — AURELIA ${slide.eyebrow}`}
            onError={() => setFailed(prev => ({ ...prev, [i]: true }))}
          />
          <div className="vl-hero__scrim" aria-hidden="true" />
          <div className="vl-hero__overlay">
            <p className="vl-hero__eyebrow">{slide.eyebrow}</p>
            <h1 className="vl-hero__title">
              {slide.titleTop}
              <span className="vl-accent">{slide.titleAccent}</span>
            </h1>
            <p className="vl-hero__desc">{slide.desc}</p>
            <div className="vl-hero__actions">
              <a className="vl-btn" href={slide.primary.href}>{slide.primary.label} →</a>
              <a className="vl-btn vl-btn--outline" href={slide.secondary.href}>{slide.secondary.label}</a>
            </div>
          </div>
        </div>

        <button type="button" className="vl-hero__arrow vl-hero__arrow--prev" onClick={prev} aria-label="Previous slide">
          <Chevron dir="left" />
        </button>
        <button type="button" className="vl-hero__arrow vl-hero__arrow--next" onClick={next} aria-label="Next slide">
          <Chevron dir="right" />
        </button>
      </section>
    );
  }

  return (
    <section className="vl-hero" aria-roledescription="carousel" aria-label="Featured collections">
      <div className="vl-hero__slide vl-reveal" key={i}>
        <div className="vl-hero__content">
          <p className="vl-hero__eyebrow">{slide.eyebrow}</p>
          <h1 className="vl-hero__title">
            {slide.titleTop}
            <span className="vl-accent">{slide.titleAccent}</span>
          </h1>
          <p className="vl-hero__desc">{slide.desc}</p>
          <div className="vl-hero__actions">
            <a className="vl-btn" href={slide.primary.href}>{slide.primary.label} →</a>
            <a className="vl-btn vl-btn--outline" href={slide.secondary.href}>{slide.secondary.label}</a>
          </div>
        </div>

        <div className="vl-hero__media">
          <FashionImage
            tone={slide.tone}
            pose={slide.pose}
            uid={`hero-${i}`}
            alt={`${slide.titleTop} ${slide.titleAccent} — AURELIA ${slide.eyebrow}`}
            className="vl-hero__img"
          />
          <div className="vl-hero__badge" aria-hidden="true">
            <small>Up to</small>
            <b>50%</b>
            <small>Off</small>
          </div>
        </div>
      </div>

      <button type="button" className="vl-hero__arrow vl-hero__arrow--prev" onClick={prev} aria-label="Previous slide">
        <Chevron dir="left" />
      </button>
      <button type="button" className="vl-hero__arrow vl-hero__arrow--next" onClick={next} aria-label="Next slide">
        <Chevron dir="right" />
      </button>
    </section>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      {dir === "left" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 6l6 6-6 6" />}
    </svg>
  );
}
