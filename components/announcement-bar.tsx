"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const messages = [
  { text: "Free shipping on orders above ₹2,000 — launching soon", href: "/shipping-and-returns" },
  { text: "New collection dropping in 2026 — be first to know",    href: "/#newsletter" },
  { text: "Responsibly made · Ethically sourced · Easy returns",   href: "/about" },
  { text: "Explore the preview catalogue — 54 original concepts",  href: "/shop" },
];

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setIndex(i => (i + 1) % messages.length),
      5000
    );
    return () => window.clearInterval(timer);
  }, []);

  const { text, href } = messages[index];

  return (
    <div className="announcement" role="status" aria-live="polite" aria-atomic="true">
      <Link href={href} className="announcement-link">
        {text}
      </Link>
    </div>
  );
}
