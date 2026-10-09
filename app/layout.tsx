import type { Metadata } from "next";
import Script from "next/script";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import "./landing.css";
import "./catalog.css";
import { GlobalHeader } from "@/components/global-header";
import { GlobalFooter } from "@/components/global-footer";
import { PreviewStore } from "@/components/preview-store";
import { SessionProvider } from "@/components/session-provider";
import { ToastProvider } from "@/components/toast";
import { PreviewSync } from "@/components/preview-sync";
import { CookieConsent } from "@/components/cookie-consent";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { SiteChrome } from "@/components/site-chrome";
import { Analytics } from "@vercel/analytics/next";
import { organizationSchema, webSiteSchema } from "@/lib/structured-data";
import { getSiteConfig } from "@/lib/settings";
import type { Viewport } from "next";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-serif", display: "swap" });
const sans = DM_Sans({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-sans", display: "swap" });

// Explicit viewport so mobile devices scale the layout correctly.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const { siteUrl } = await getSiteConfig();
  return {
    metadataBase: new URL(siteUrl),
    title: { default: "AURELIA | A softer way to dress", template: "%s | AURELIA" },
    description: "Shop contemporary Indian womenswear at AURELIA — kurtas, kurta sets, suits, sarees, lehengas and co-ords crafted in breathable fabrics for everyday life and celebration.",
    keywords: ["Indian fashion", "kurtas", "sarees", "lehengas", "contemporary Indian clothing", "AURELIA"],
    authors: [{ name: "AURELIA" }],
    creator: "AURELIA",
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: siteUrl,
      siteName: "AURELIA",
      title: "AURELIA | A softer way to dress",
      description: "Contemporary Indian dressing imagined for every version of your day. Discover the first AURELIA collection.",
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "AURELIA — Contemporary Indian Fashion" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "AURELIA | A softer way to dress",
      description: "Contemporary Indian dressing imagined for every version of your day.",
      images: ["/og-image.jpg"],
    },
    icons: { icon: "/icon.svg" },
    robots: { index: true, follow: true },
  };
}
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { siteUrl, contactEmail } = await getSiteConfig();
  return (
    <html lang="en-IN" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <Script
          id="org-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema(siteUrl, contactEmail)) }}
        />
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema(siteUrl)) }}
        />
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SessionProvider>
          <ToastProvider>
            <PreviewStore>
              <PreviewSync />
              <SiteChrome
                header={<GlobalHeader />}
                footer={<GlobalFooter />}
                extras={<><CookieConsent /><WhatsAppButton /></>}
              >
                {children}
              </SiteChrome>
              <Analytics />
            </PreviewStore>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
