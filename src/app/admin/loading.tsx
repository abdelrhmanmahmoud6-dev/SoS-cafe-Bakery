/** Skeleton for the admin shell while orders/menu/report data loads. */
export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <span className="sr-only">جاري التحميل… / Loading…</span>
      <div className="h-9 w-56 animate-pulse rounded-xl bg-sand-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-sand-300 bg-sand-100/60"
            style={{ animationDelay: `${i * 70}ms` }}
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl border border-sand-300 bg-sand-100/60" />
    </div>
  );
}
