// Next.js instrumentation hook — runs once when the server (or edge runtime) boots.
// Initializes Sentry only when a DSN is configured, so local dev is a no-op.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return; // No DSN → error monitoring disabled (dev/local default).

  const common = {
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
    // Don't send events unless a DSN is set (guarded above) and not in dev by default.
    enabled: process.env.NODE_ENV === "production",
  };

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init(common);
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init(common);
  }
}

// Captures errors from nested React Server Components (Next.js 15+).
export const onRequestError = Sentry.captureRequestError;
