/**
 * Shown while the server component awaits the database.
 *
 * On a Neon cold start that wait can be a couple of seconds. Without this the
 * browser sits on a blank document; with it the brand and page shape appear
 * immediately and fill in, so a slow start reads as loading rather than broken.
 *
 * Deliberately a server component with no client JS and no i18n context — it
 * has to render before anything else is ready.
 */
export default function Loading() {
  return (
    <div className="min-h-svh bg-sand-50 px-5 pt-32 sm:px-8" aria-busy="true">
      <span className="sr-only">جاري التحميل… / Loading…</span>

      <div className="mx-auto flex max-w-7xl flex-col items-center">
        {/* Brand disc */}
        <div className="size-26 animate-pulse rounded-full bg-gold-500/20" />

        {/* Headline */}
        <div className="mt-7 h-12 w-[min(22rem,80vw)] animate-pulse rounded-2xl bg-sand-200 sm:h-16" />
        <div className="mt-3 h-12 w-[min(18rem,68vw)] animate-pulse rounded-2xl bg-sand-200 sm:h-16" />

        {/* Subtitle */}
        <div className="mt-6 h-4 w-[min(34rem,90vw)] animate-pulse rounded-lg bg-sand-200/70" />
        <div className="mt-2 h-4 w-[min(26rem,72vw)] animate-pulse rounded-lg bg-sand-200/70" />

        {/* Buttons */}
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <div className="h-13 w-44 animate-pulse rounded-2xl bg-gold-500/20" />
          <div className="h-13 w-36 animate-pulse rounded-2xl bg-sand-200" />
        </div>

        {/* Menu card grid */}
        <div className="mt-16 grid w-full grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl border border-sand-300 bg-sand-100/60"
              style={{ animationDelay: `${i * 70}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
