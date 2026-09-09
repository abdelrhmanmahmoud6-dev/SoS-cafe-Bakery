"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  PackageSearch,
  Check,
  ChefHat,
  Bike,
  Store,
  PartyPopper,
  XCircle,
  RefreshCw,
  MapPin,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { trackOrder, type TrackedOrder } from "@/app/actions/orders";
import {
  TRACKING_STEPS,
  statusLabel,
  ORDER_TYPE_LABELS,
  DELIVERY_AREA_LABELS,
  PAYMENT_LABELS,
  isCourierPriced,
  type DeliveryArea,
  type OrderStatus,
  type OrderType,
  type PaymentMethod,
} from "@/lib/order-types";
import { cn, formatEGP, formatDateTime } from "@/lib/utils";

const STEP_ICONS = [PackageSearch, ChefHat, Bike, PartyPopper];

export function TrackClient({ initialCode }: { initialCode: string }) {
  const { sh, lang } = useI18n();
  const [code, setCode] = useState(initialCode);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const lookup = useCallback(
    async (value: string, showSpinner = true) => {
      const trimmed = value.trim().toUpperCase();
      if (!trimmed) return;
      if (showSpinner) setLoading(true);
      try {
        const found = await trackOrder(trimmed);
        setOrder(found);
      } catch (err) {
        console.error(err);
        setOrder(null);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    },
    []
  );

  // Deep link: /track?code=SOS-XXXXXX looks up immediately.
  useEffect(() => {
    if (initialCode) void lookup(initialCode);
  }, [initialCode, lookup]);

  // Poll while an order is still in flight. Stops once it's terminal, so a
  // finished order doesn't keep hitting the server forever.
  useEffect(() => {
    if (!order) return;
    if (order.status === "DELIVERED" || order.status === "CANCELLED") return;

    const id = window.setInterval(() => {
      void lookup(order.code, false);
    }, 10_000);
    return () => window.clearInterval(id);
  }, [order, lookup]);

  const isCancelled = order?.status === "CANCELLED";
  const currentStep = order ? TRACKING_STEPS.indexOf(order.status) : -1;

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Lookup */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(code);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <label htmlFor="track-code" className="sr-only">
            {sh.track.orderCode}
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-dim"
          />
          <input
            id="track-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={sh.track.placeholder}
            dir="ltr"
            className="h-14 w-full rounded-2xl border border-sand-300 bg-sand-100/80 ps-12 pe-4 font-en text-base uppercase tracking-wider text-espresso placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-dim transition-colors duration-200 focus:border-gold-500/60 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-full btn-espresso px-8 font-extrabold transition-colors duration-200 hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 aria-hidden className="size-5 animate-spin" />
          ) : (
            <Search aria-hidden className="size-5" />
          )}
          {loading ? sh.track.searching : sh.track.button}
        </button>
      </form>

      {/* Not found */}
      <AnimatePresence mode="wait">
        {searched && !order && !loading && (
          <motion.div
            key="notfound"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-sand-400 bg-sand-100/50 px-6 py-14 text-center"
          >
            <span className="flex size-16 items-center justify-center rounded-2xl bg-sand-200 text-muted-dim">
              <PackageSearch aria-hidden className="size-8" />
            </span>
            <h2 className="text-xl font-extrabold text-espresso">
              {sh.track.notFound}
            </h2>
            <p className="max-w-sm leading-relaxed text-muted">
              {sh.track.notFoundHint}
            </p>
          </motion.div>
        )}

        {/* Result */}
        {order && (
          <motion.div
            key={order.code}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex flex-col gap-5"
          >
            {/* Summary header */}
            <div className="rounded-3xl border border-sand-300 bg-sand-100/70 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gold-800">
                    {sh.track.orderCode}
                  </p>
                  <p className="mt-1 font-en text-2xl font-extrabold text-espresso num">
                    {order.code}
                  </p>
                  <p className="mt-1 text-sm text-muted-dim">
                    {sh.track.placedAt}: {formatDateTime(order.createdAt, lang)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 text-end">
                  <span className="rounded-full border border-sand-400 bg-sand-200 px-3 py-1.5 text-xs font-bold text-muted">
                    {ORDER_TYPE_LABELS[order.orderType as OrderType]?.[lang]}
                    {order.deliveryArea &&
                      ` · ${
                        DELIVERY_AREA_LABELS[order.deliveryArea as DeliveryArea]?.[
                          lang
                        ]
                      }`}
                  </span>
                  <span className="rounded-full border border-sand-400 bg-sand-200 px-3 py-1.5 text-xs font-bold text-muted">
                    {PAYMENT_LABELS[order.paymentMethod as PaymentMethod]?.[lang]}
                  </span>
                </div>
              </div>

              {order.address && (
                <p className="mt-4 flex items-start gap-2 border-t border-sand-300 pt-4 text-sm leading-relaxed text-muted">
                  <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-800" />
                  <span>
                    <span className="font-bold text-espresso">
                      {sh.track.deliverTo}:{" "}
                    </span>
                    {order.address}
                  </span>
                </p>
              )}
            </div>

            {/* Timeline / cancelled */}
            {isCancelled ? (
              <div className="flex items-start gap-4 rounded-3xl border border-rose-400/30 bg-rose-400/10 p-6">
                <XCircle aria-hidden className="mt-0.5 size-6 shrink-0 text-rose-300" />
                <div>
                  <h2 className="text-lg font-extrabold text-rose-200">
                    {sh.track.cancelled}
                  </h2>
                  <p className="mt-1 leading-relaxed text-rose-200/80">
                    {sh.track.cancelledHint}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-sand-300 bg-sand-100/70 p-6">
                <ol className="flex flex-col gap-0">
                  {TRACKING_STEPS.map((step, i) => {
                    const done = i <= currentStep;
                    const active = i === currentStep;
                    const Icon = STEP_ICONS[i] ?? Check;
                    // Step 3's icon depends on delivery vs pickup.
                    const StepIcon =
                      i === 2
                        ? order.orderType === "DELIVERY"
                          ? Bike
                          : Store
                        : Icon;
                    const isLast = i === TRACKING_STEPS.length - 1;

                    return (
                      <li key={step} className="flex gap-4">
                        {/* Rail */}
                        <div className="flex flex-col items-center">
                          <motion.span
                            initial={false}
                            animate={{
                              scale: active ? [1, 1.08, 1] : 1,
                            }}
                            transition={
                              active
                                ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                                : { duration: 0.2 }
                            }
                            className={cn(
                              "relative flex size-12 shrink-0 items-center justify-center rounded-2xl border transition-colors duration-300",
                              done
                                ? "border-gold-500 bg-gold-500 text-espresso"
                                : "border-sand-400 bg-sand-200 text-muted-dim"
                            )}
                          >
                            <StepIcon aria-hidden className="size-5" />
                            {active && (
                              <motion.span
                                animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeOut",
                                }}
                                className="absolute inset-0 -z-10 rounded-2xl bg-gold-500"
                              />
                            )}
                          </motion.span>

                          {!isLast && (
                            <span className="relative my-1 w-0.5 flex-1 overflow-hidden rounded-full bg-sand-300">
                              <motion.span
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: i < currentStep ? 1 : 0 }}
                                transition={{ duration: 0.5, delay: 0.15 }}
                                style={{ transformOrigin: "top" }}
                                className="absolute inset-0 bg-gold-500"
                              />
                            </span>
                          )}
                        </div>

                        {/* Label */}
                        <div className={cn("pb-8", isLast && "pb-0")}>
                          <p
                            className={cn(
                              "pt-3 font-extrabold transition-colors duration-300",
                              done ? "text-espresso" : "text-muted-dim"
                            )}
                          >
                            {
                              statusLabel(step, order.orderType as OrderType)[
                                lang
                              ]
                            }
                          </p>
                          {(() => {
                            const event = order.events.find(
                              (e) => e.status === step
                            );
                            return event ? (
                              <p className="mt-0.5 text-xs text-muted-dim">
                                {formatDateTime(event.createdAt, lang)}
                              </p>
                            ) : null;
                          })()}
                        </div>
                      </li>
                    );
                  })}
                </ol>

                <p className="mt-2 flex items-center gap-2 border-t border-sand-300 pt-4 text-xs font-semibold text-muted-dim">
                  <RefreshCw aria-hidden className="size-3.5" />
                  {sh.track.autoRefresh}
                </p>
              </div>
            )}

            {/* Items */}
            <div className="rounded-3xl border border-sand-300 bg-sand-100/70 p-6">
              <h2 className="mb-4 text-lg font-extrabold text-espresso">
                {sh.track.items}
              </h2>
              <ul className="flex flex-col gap-3">
                {order.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-4 border-b border-sand-200 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-espresso">
                        <span className="font-en text-gold-800 num">
                          {item.quantity}×
                        </span>{" "}
                        {lang === "ar" ? item.nameAr : item.nameEn}
                        {item.size && (
                          <span className="ms-1.5 rounded bg-gold-500/12 px-1.5 py-0.5 font-en text-[10px] font-extrabold text-gold-800">
                            {item.size}
                          </span>
                        )}
                      </p>
                      {item.addons.length > 0 && (
                        <p className="mt-0.5 text-xs text-muted-dim">
                          {item.addons
                            .map((a) => (lang === "ar" ? a.nameAr : a.nameEn))
                            .join("، ")}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 font-en font-bold text-espresso num">
                      {formatEGP(item.lineTotal, lang)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 flex flex-col gap-1.5 border-t border-sand-300 pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">{sh.cart.subtotal}</dt>
                  <dd className="font-en font-bold text-espresso num">
                    {formatEGP(order.subtotal, lang)}
                  </dd>
                </div>
                {isCourierPriced(
                  order.orderType as OrderType,
                  order.deliveryArea as DeliveryArea | null
                ) ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">{sh.cart.deliveryFee}</dt>
                    <dd className="text-end text-xs font-bold text-amber-300">
                      {sh.checkout.courierPriced}
                    </dd>
                  </div>
                ) : (
                  order.deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted">{sh.cart.deliveryFee}</dt>
                      <dd className="font-en font-bold text-espresso num">
                        {formatEGP(order.deliveryFee, lang)}
                      </dd>
                    </div>
                  )
                )}
                <div className="mt-1 flex justify-between border-t border-sand-300 pt-2">
                  <dt className="font-extrabold text-espresso">{sh.cart.total}</dt>
                  <dd className="font-en text-xl font-extrabold text-gold-800 num">
                    {formatEGP(order.total, lang)}
                  </dd>
                </div>
              </dl>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Narrow helper so `[lang]` indexing on the bilingual label maps type-checks. */
export type { OrderStatus };
