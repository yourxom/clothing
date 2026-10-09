"use client";

// App Router global error boundary. Reports uncaught render errors to Sentry
// (no-op when Sentry has no DSN) and shows a minimal recovery UI.
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en-IN">
      <body>
        <main
          style={{
            minHeight: "70vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "2rem",
            fontFamily: "Georgia, serif",
            color: "#29251f",
          }}
        >
          <h1 style={{ fontSize: "2rem", marginBottom: ".75rem" }}>
            Something went wrong.
          </h1>
          <p style={{ color: "#706b62", maxWidth: "32rem", lineHeight: 1.7 }}>
            We hit an unexpected error. Our team has been notified. Please try again.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: "1.5rem",
              padding: ".85rem 1.6rem",
              background: "#29251f",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontSize: ".8rem",
              letterSpacing: ".13em",
              textTransform: "uppercase",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
