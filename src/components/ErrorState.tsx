"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Phone, WifiOff } from "lucide-react";

/* ----------------------------------------------------------------------------
   Auto-retry budget.

   Calling reset() remounts this component, so a per-component useState counter
   resets too — a permanently failing page would retry forever. The budget
   therefore lives at module scope, outside the React tree, and is spent over a
   rolling window. One silent retry covers a Neon cold start; anything beyond
   that is a real fault and the user should be told.
   -------------------------------------------------------------------------- */
const MAX_AUTO_RETRIES = 1;
const WINDOW_MS = 30_000;

let retriesUsed = 0;
let windowOpenedAt = 0;

function claimAutoRetry(): boolean {
  const now = Date.now();
  if (now - windowOpenedAt > WINDOW_MS) {
    windowOpenedAt = now;
    retriesUsed = 0;
  }
  if (retriesUsed >= MAX_AUTO_RETRIES) return false;
  retriesUsed += 1;
  return true;
}

/**
 * Shared fallback for the App Router error boundaries.
 *
 * Copy is bilingual and hard-coded rather than read from the i18n context: an
 * error boundary can render when the tree above it failed, so it must not
 * depend on a provider being mounted.
 */
export function ErrorState({
  reset,
  showAutoRetry = true,
}: {
  reset: () => void;
  showAutoRetry?: boolean;
}) {
  // Decide once, during the first render, so the branch is stable.
  const [retrying, setRetrying] = useState(
    () => showAutoRetry && claimAutoRetry()
  );

  useEffect(() => {
    if (!retrying) return;
    const id = window.setTimeout(() => {
      setRetrying(false);
      reset();
    }, 1200);
    return () => window.clearTimeout(id);
  }, [retrying, reset]);

  if (retrying) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-ink-950 px-6 text-center">
        <RefreshCw aria-hidden className="size-8 animate-spin text-gold-500" />
        <p className="text-muted" role="status">
          جاري إعادة المحاولة…
          <span className="mx-2 opacity-40">·</span>
          <span className="font-en">Retrying…</span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-ink-950 px-6 py-16 text-center">
      <span className="flex size-20 items-center justify-center rounded-3xl bg-gold-500/10 text-gold-500 ring-1 ring-gold-500/25">
        <WifiOff aria-hidden className="size-9" />
      </span>

      <div className="max-w-md">
        <h1 className="text-2xl font-extrabold text-cream sm:text-3xl">
          في مشكلة مؤقتة في الاتصال
        </h1>
        <p className="mt-2 leading-relaxed text-muted">
          الصفحة اتأخرت في التحميل. جرّب تاني — غالبًا هتشتغل على طول.
        </p>

        {/* dir="ltr" so the trailing full stop renders at the end of the
            sentence rather than being reordered by the RTL context. */}
        <div dir="ltr">
          <p className="mt-5 font-en text-lg font-extrabold text-cream">
            Temporary connection problem
          </p>
          <p className="mt-1 font-en leading-relaxed text-muted">
            The page took too long to load. Please try again — it usually works
            straight away.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            // A manual press always gets a fresh attempt, and reopens the
            // window so a later cold start can auto-retry again.
            windowOpenedAt = 0;
            retriesUsed = 0;
            reset();
          }}
          className="flex min-h-13 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gold-500 px-7 font-extrabold text-ink-950 transition-colors duration-200 hover:bg-gold-400"
        >
          <RefreshCw aria-hidden className="size-5" />
          حاول تاني / Try again
        </button>

        <a
          href="tel:+201034326985"
          className="flex min-h-13 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-ink-600 px-7 font-bold text-cream transition-colors duration-200 hover:border-gold-500/60 hover:text-gold-500"
        >
          <Phone aria-hidden className="size-5" />
          <span dir="ltr" className="font-en num">
            01034326985
          </span>
        </a>
      </div>
    </div>
  );
}
