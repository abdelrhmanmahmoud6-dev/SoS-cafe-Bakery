"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ErrorState";

/**
 * Route-level error boundary. Catches failures thrown while rendering any page
 * in this segment — in practice, a database call that timed out because the
 * Neon endpoint was resuming.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route error]", error.digest ?? "", error.message);
  }, [error]);

  return <ErrorState reset={reset} />;
}
