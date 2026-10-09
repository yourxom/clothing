import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

// Security headers applied to every response. Defense-in-depth for production.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Fix: tell Next.js the correct workspace root to silence multi-lockfile warning
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      // Picsum placeholder images used by the seed before real photos are wired.
      { protocol: "https", hostname: "picsum.photos" },
      // Common CDN/storage options for product images
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// Only enable Sentry's build-time plugin (source-map upload, etc.) when configured.
// Without SENTRY_AUTH_TOKEN this is effectively a pass-through, so local builds are unaffected.
const sentryEnabled = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      // Upload source maps only when an auth token is present.
      sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
      // Route Sentry requests through a Next.js rewrite to bypass ad-blockers.
      tunnelRoute: "/monitoring",
      disableLogger: true,
      // Avoid failing the build if Sentry's plugin hits an issue.
      widenClientFileUpload: true,
    })
  : nextConfig;
