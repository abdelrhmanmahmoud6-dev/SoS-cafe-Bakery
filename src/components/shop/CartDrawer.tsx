"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  Store,
  Bike,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  useCart,
  cartSubtotal,
  cartCount,
  cartDeliveryFee,
  linePrice,
} from "@/store/cart";
import { cn, formatEGP } from "@/lib/utils";
import { isCourierPriced } from "@/lib/order-types";
import { CheckoutModal } from "./CheckoutModal";

export function CartDrawer() {
  const { sh, lang, isRTL } = useI18n();
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const lines = useCart((s) => s.lines);
  const orderType = useCart((s) => s.orderType);
  const setOrderType = useCart((s) => s.setOrderType);
  const deliveryArea = useCart((s) => s.deliveryArea);
  const setDeliveryArea = useCart((s) => s.setDeliveryArea);
  const increment = useCart((s) => s.increment);
  const decrement = useCart((s) => s.decrement);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);

  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const subtotal = cartSubtotal(lines);
  const delivery = cartDeliveryFee(orderType, lines, deliveryArea);
  const total = subtotal + delivery;
  const courierPriced = isCourierPriced(orderType, deliveryArea);
  const count = cartCount(lines);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
              className="fixed inset-0 z-60 bg-ink-950/80 backdrop-blur-sm"
            />

            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={sh.cart.title}
              initial={{ x: isRTL ? "-100%" : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? "-100%" : "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 end-0 z-70 flex w-[min(28rem,100vw)] flex-col border-s border-ink-700 bg-ink-900 shadow-float"
            >
              {/* Header */}
              <header className="flex shrink-0 items-center justify-between gap-3 border-b border-ink-700 p-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-gold-500/12 text-gold-500 ring-1 ring-gold-500/25">
                    <ShoppingBag aria-hidden className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-extrabold text-cream">
                      {sh.cart.title}
                    </h2>
                    <p className="text-xs font-semibold text-muted-dim">
                      <span className="num">{count}</span> {sh.cart.items}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label={sh.cart.close}
                  className="flex size-11 cursor-pointer items-center justify-center rounded-xl border border-ink-600 text-cream transition-colors duration-200 hover:border-gold-500/60 hover:text-gold-500"
                >
                  <X aria-hidden className="size-5" />
                </button>
              </header>

              {lines.length === 0 ? (
                /* Empty state */
                <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                  <span className="flex size-16 items-center justify-center rounded-2xl bg-ink-800 text-muted-dim">
                    <ShoppingBag aria-hidden className="size-8" />
                  </span>
                  <h3 className="text-lg font-extrabold text-cream">
                    {sh.cart.empty}
                  </h3>
                  <p className="max-w-xs leading-relaxed text-muted">
                    {sh.cart.emptyHint}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      document
                        .getElementById("menu")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="mt-1 flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl bg-gold-500 px-6 font-extrabold text-ink-950 transition-colors duration-200 hover:bg-gold-400"
                  >
                    {sh.cart.browseMenu}
                  </button>
                </div>
              ) : (
                <>
                  {/* Lines */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <ul className="flex flex-col gap-3">
                      <AnimatePresence initial={false}>
                        {lines.map((line) => (
                          <motion.li
                            key={line.key}
                            layout
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.22 }}
                            className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-800/70 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h3 className="text-pretty font-extrabold leading-snug text-cream">
                                  {lang === "ar" ? line.nameAr : line.nameEn}
                                </h3>

                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  {line.size && (
                                    <span className="rounded-md bg-gold-500/12 px-2 py-0.5 font-en text-[11px] font-extrabold text-gold-500">
                                      {line.size}
                                    </span>
                                  )}
                                  <span className="font-en text-xs text-muted-dim num">
                                    {formatEGP(line.unitPrice, lang)}
                                  </span>
                                </div>

                                {line.addons.length > 0 && (
                                  <p className="mt-1.5 text-xs leading-relaxed text-muted-dim">
                                    <span className="font-bold">
                                      {sh.cart.addons}:{" "}
                                    </span>
                                    {line.addons
                                      .map(
                                        (a) =>
                                          `${lang === "ar" ? a.nameAr : a.nameEn} (+${a.price})`
                                      )
                                      .join("، ")}
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => remove(line.key)}
                                aria-label={`${sh.cart.remove} ${lang === "ar" ? line.nameAr : line.nameEn}`}
                                className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-dim transition-colors duration-200 hover:bg-rose-400/10 hover:text-rose-300"
                              >
                                <Trash2 aria-hidden className="size-4" />
                              </button>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => decrement(line.key)}
                                  aria-label={sh.cart.decrease}
                                  className="flex size-11 cursor-pointer items-center justify-center rounded-xl bg-ink-700 text-cream transition-colors duration-200 hover:bg-ink-600"
                                >
                                  <Minus aria-hidden className="size-4" />
                                </button>
                                <span className="w-8 text-center font-en font-extrabold text-cream num">
                                  {line.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => increment(line.key)}
                                  aria-label={sh.cart.increase}
                                  className="flex size-11 cursor-pointer items-center justify-center rounded-xl bg-ink-700 text-cream transition-colors duration-200 hover:bg-ink-600"
                                >
                                  <Plus aria-hidden className="size-4" />
                                </button>
                              </div>

                              <span className="font-en text-lg font-extrabold text-gold-500 num">
                                {formatEGP(linePrice(line), lang)}
                              </span>
                            </div>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>

                    <button
                      type="button"
                      onClick={clear}
                      className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-bold text-muted-dim transition-colors duration-200 hover:text-rose-300"
                    >
                      <Trash2 aria-hidden className="size-3.5" />
                      {sh.cart.clear}
                    </button>
                  </div>

                  {/* Footer: order type + totals */}
                  <footer className="shrink-0 border-t border-ink-700 bg-ink-900 p-5">
                    <div
                      role="group"
                      aria-label={sh.checkout.orderType}
                      className="mb-4 grid grid-cols-2 gap-2"
                    >
                      {(
                        [
                          { key: "TAKEAWAY", icon: Store, label: sh.checkout.takeaway },
                          { key: "DELIVERY", icon: Bike, label: sh.checkout.delivery },
                        ] as const
                      ).map((opt) => {
                        const active = orderType === opt.key;
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setOrderType(opt.key)}
                            aria-pressed={active}
                            className={cn(
                              "flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-bold transition-colors duration-200",
                              active
                                ? "border-gold-500 bg-gold-500/12 text-gold-500"
                                : "border-ink-600 bg-ink-800 text-muted hover:text-cream"
                            )}
                          >
                            <Icon aria-hidden className="size-4" />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>

                    {orderType === "DELIVERY" && (
                      <div
                        role="group"
                        aria-label={sh.checkout.deliveryArea}
                        className="mb-4 grid grid-cols-2 gap-2"
                      >
                        {(
                          [
                            { key: "INSIDE", label: sh.checkout.areaInside },
                            { key: "OUTSIDE", label: sh.checkout.areaOutside },
                          ] as const
                        ).map((opt) => {
                          const active = deliveryArea === opt.key;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => setDeliveryArea(opt.key)}
                              aria-pressed={active}
                              className={cn(
                                "flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-2 text-center text-xs font-bold leading-tight transition-colors duration-200",
                                active
                                  ? "border-gold-500 bg-gold-500/12 text-gold-500"
                                  : "border-ink-600 bg-ink-800 text-muted hover:text-cream"
                              )}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <dl className="mb-4 flex flex-col gap-1.5 text-sm">
                      <div className="flex items-center justify-between">
                        <dt className="text-muted">{sh.cart.subtotal}</dt>
                        <dd className="font-en font-bold text-cream num">
                          {formatEGP(subtotal, lang)}
                        </dd>
                      </div>
                      {courierPriced ? (
                        <div className="flex items-center justify-between gap-3">
                          <dt className="text-muted">{sh.cart.deliveryFee}</dt>
                          <dd className="text-end text-xs font-bold text-amber-300">
                            {sh.checkout.courierPriced}
                          </dd>
                        </div>
                      ) : (
                        delivery > 0 && (
                          <div className="flex items-center justify-between">
                            <dt className="text-muted">{sh.cart.deliveryFee}</dt>
                            <dd className="font-en font-bold text-cream num">
                              {formatEGP(delivery, lang)}
                            </dd>
                          </div>
                        )
                      )}
                      <div className="mt-1.5 flex items-center justify-between border-t border-ink-700 pt-2.5">
                        <dt className="font-extrabold text-cream">
                          {courierPriced ? sh.checkout.foodTotal : sh.cart.total}
                        </dt>
                        <dd className="font-en text-xl font-extrabold text-gold-500 num">
                          {formatEGP(total, lang)}
                        </dd>
                      </div>
                    </dl>

                    <button
                      type="button"
                      onClick={() => setCheckoutOpen(true)}
                      className="flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gold-500 px-5 font-extrabold text-ink-950 shadow-glow transition-colors duration-200 hover:bg-gold-400"
                    >
                      {sh.cart.checkout}
                      <Arrow aria-hidden className="size-5" />
                    </button>
                  </footer>
                </>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  );
}
