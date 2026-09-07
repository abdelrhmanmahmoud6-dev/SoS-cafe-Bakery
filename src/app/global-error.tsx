"use client";

import { ErrorState } from "@/components/ErrorState";
import "./globals.css";

/**
 * Last-resort boundary: replaces the root layout, so it must render its own
 * <html> and <body>. No auto-retry here — if the root layout itself failed,
 * retrying in a loop would just thrash.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-ink-950 text-cream antialiased">
        <ErrorState reset={reset} showAutoRetry={false} />
      </body>
    </html>
  );
}
