// Client-side Sentry initialization (browser). Loaded automatically by Next.js.
// No-op unless NEXT_PUBLIC_SENTRY_DSN is set, so local dev is unaffected.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === "production",
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
    // Session Replay — only capture on errors to keep quota low. Disabled if unset.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_REPLAY_ERROR_RATE ?? "0"),
  });
}
