"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ErrorState";

/** Keeps an admin-side database hiccup from blanking the dashboard. */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin error]", error.digest ?? "", error.message);
  }, [error]);

  return <ErrorState reset={reset} />;
}
