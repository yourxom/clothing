import Link from "next/link";
import { NewsletterForm } from "./newsletter-form";

const linkGroups = [
  {
    title: "Shop",
    items: [
      { name: "Shop all styles",    href: "/shop" },
      { name: "Search",             href: "/search" },
      { name: "Kurtas",             href: "/collections/kurtas" },
      { name: "Sarees",             href: "/collections/sarees" },
      { name: "Lehengas",           href: "/collections/lehengas" },
      { name: "Dresses",            href: "/collections/dresses" },
      { name: "New arrivals",       href: "/#new-arrivals" },
    ],
  },
  {
    title: "The brand",
    items: [
      { name: "Our story",          href: "/about" },
      { name: "The journal",        href: "/journal" },
      { name: "Stores",             href: "/stores" },
      { name: "Compare styles",     href: "/compare" },
      { name: "Saved styles",       href: "/wishlist" },
      { name: "Demo bag",           href: "/bag" },
    ],
  },
  {
    title: "Help",
    items: [
      { name: "Help & FAQ",        href: "/help" },
      { name: "Contact us",         href: "/contact" },
      { name: "Shipping & returns", href: "/shipping-and-returns" },
      { name: "Privacy policy",     href: "/privacy-policy" },
      { name: "Terms & conditions", href: "/terms-and-conditions" },
      { name: "My account",         href: "/account" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        {/* Newsletter row */}
        <div className="footer-newsletter">
          <div className="footer-newsletter-copy">
            <span className="eyebrow footer-eyebrow">Stay in the know</span>
            <h2 className="serif footer-newsletter-heading">A little more AURELIA.</h2>
            <p>Be first to know when we launch. No spam, ever.</p>
          </div>
          <div className="footer-newsletter-form">
            <NewsletterForm compact />
          </div>
        </div>

        {/* Main grid */}
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="footer-brand-name serif" aria-label="AURELIA home">
              AURELIA
            </Link>
            <p>
              A considered wardrobe for modern life, rooted in the beauty of Indian dressing.
            </p>
            <div className="footer-social" aria-label="Follow AURELIA">
              {/* Social links — placeholder hrefs until accounts are live */}
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="AURELIA on Instagram">
                Instagram
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" aria-label="AURELIA on Pinterest">
                Pinterest
              </a>
            </div>
          </div>

          {linkGroups.map(group => (
            <nav key={group.title} aria-label={`${group.title} links`}>
              <h3>{group.title}</h3>
              {group.items.map(item => (
                <Link href={item.href} key={item.name}>{item.name}</Link>
              ))}
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} AURELIA. An original concept storefront.</span>
          <span className="footer-bottom-links">
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/terms-and-conditions">Terms</Link>
            <Link href="/shipping-and-returns">Shipping</Link>
            <Link href="/contact">Contact</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
