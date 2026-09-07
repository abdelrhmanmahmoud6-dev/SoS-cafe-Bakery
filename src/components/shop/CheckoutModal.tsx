"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Store,
  Bike,
  Banknote,
  Smartphone,
  Check,
  Copy,
  AlertCircle,
  Loader2,
  PackageCheck,
} from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useCart, cartSubtotal, cartDeliveryFee } from "@/store/cart";
import { placeOrder } from "@/app/actions/orders";
import { VODAFONE_CASH_NUMBER, type PaymentMethod } from "@/lib/order-types";
import { cn, formatEGP } from "@/lib/utils";

export function CheckoutModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { sh, lang } = useI18n();
  const lines = useCart((s) => s.lines);
  const orderType = useCart((s) => s.orderType);
  const setOrderType = useCart((s) => s.setOrderType);
  const clear = useCart((s) => s.clear);
  const closeCart = useCart((s) => s.close);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("CASH");
  const [paymentRef, setPaymentRef] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedCode, setPlacedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const subtotal = cartSubtotal(lines);
  const delivery = cartDeliveryFee(orderType, lines);
  const total = subtotal + delivery;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => firstFieldRef.current?.focus(), 80);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      window.clearTimeout(timer);
    };
  }, [open, onClose, submitting]);

  // Reset for a fresh order whenever the modal is reopened.
  useEffect(() => {
    if (open) {
      setError(null);
      setPlacedCode(null);
      setCopied(false);
    }
  }, [open]);

  function translateError(code: string): string {
    if (code.startsWith("UNAVAILABLE:")) {
      return `${sh.checkout.errors.UNAVAILABLE} ${code.split(":")[1]}`;
    }
    const map = sh.checkout.errors as unknown as Record<string, string>;
    return map[code] ?? map.DEFAULT;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const result = await placeOrder({
        customerName: name,
        customerPhone: phone,
        orderType,
        paymentMethod: payment,
        address: orderType === "DELIVERY" ? address : undefined,
        notes: notes || undefined,
        paymentRef: payment === "VODAFONE_CASH" ? paymentRef : undefined,
        lines: lines.map((l) => ({
          itemId: l.itemId,
          size: l.size,
          quantity: l.quantity,
          addonIds: l.addons.map((a) => a.id),
        })),
      });

      if (result.ok) {
        setPlacedCode(result.code);
        clear();
        closeCart();
      } else {
        setError(translateError(result.error));
      }
    } catch (err) {
      console.error(err);
      setError(sh.checkout.errors.SERVER_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyCode() {
    if (!placedCode) return;
    try {
      await navigator.clipboard.writeText(placedCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the code is on screen to copy by hand */
    }
  }

  const inputClass =
    "h-13 w-full rounded-xl border border-ink-600 bg-ink-800 px-4 text-cream placeholder:text-muted-dim transition-colors duration-200 focus:border-gold-500/60 focus:outline-none";
  const labelClass = "mb-1.5 block text-sm font-bold text-cream";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-80 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !submitting && onClose()}
            className="absolute inset-0 bg-ink-950/88 backdrop-blur-md"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 330, damping: 30 }}
            className="relative flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-ink-700 bg-ink-900 shadow-float sm:rounded-3xl"
          >
            {placedCode ? (
              /* ---------------- SUCCESS ---------------- */
              <div className="flex flex-col items-center gap-5 p-8 text-center">
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 16 }}
                  className="flex size-20 items-center justify-center rounded-3xl bg-emerald-400/12 text-emerald-300 ring-1 ring-emerald-400/30"
                >
                  <PackageCheck aria-hidden className="size-10" />
                </motion.span>

                <div>
                  <h2 id="checkout-title" className="text-2xl font-extrabold text-cream">
                    {sh.checkout.successTitle}
                  </h2>
                  <p className="mt-2 leading-relaxed text-muted">
                    {sh.checkout.successBody}
                  </p>
                </div>

                <div className="w-full rounded-2xl border border-gold-500/30 bg-gold-500/[0.07] p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-gold-500">
                    {sh.checkout.orderCode}
                  </p>
                  <p className="mt-1.5 font-en text-3xl font-extrabold text-cream num">
                    {placedCode}
                  </p>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-ink-600 px-4 text-sm font-bold text-muted transition-colors duration-200 hover:border-gold-500/60 hover:text-gold-500"
                  >
                    {copied ? (
                      <Check aria-hidden className="size-4" />
                    ) : (
                      <Copy aria-hidden className="size-4" />
                    )}
                    {copied ? sh.checkout.copied : sh.checkout.copyCode}
                  </button>
                </div>

                <div className="flex w-full flex-col gap-2.5 sm:flex-row">
                  <Link
                    href={`/track?code=${placedCode}`}
                    className="flex min-h-13 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gold-500 px-5 font-extrabold text-ink-950 transition-colors duration-200 hover:bg-gold-400"
                  >
                    {sh.checkout.trackNow}
                  </Link>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex min-h-13 cursor-pointer items-center justify-center rounded-2xl border border-ink-600 px-5 font-bold text-cream transition-colors duration-200 hover:border-gold-500/60 hover:text-gold-500"
                  >
                    {sh.checkout.newOrder}
                  </button>
                </div>
              </div>
            ) : (
              /* ---------------- FORM ---------------- */
              <>
                <header className="flex shrink-0 items-center justify-between gap-3 border-b border-ink-700 p-5">
                  <h2 id="checkout-title" className="text-xl font-extrabold text-cream">
                    {sh.checkout.title}
                  </h2>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    aria-label={sh.cart.close}
                    className="flex size-11 cursor-pointer items-center justify-center rounded-xl border border-ink-600 text-cream transition-colors duration-200 hover:border-gold-500/60 hover:text-gold-500 disabled:opacity-50"
                  >
                    <X aria-hidden className="size-5" />
                  </button>
                </header>

                <form
                  onSubmit={handleSubmit}
                  className="flex flex-1 flex-col overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto p-5">
                    {/* Contact */}
                    <section>
                      <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-gold-500">
                        {sh.checkout.step1}
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label htmlFor="co-name" className={labelClass}>
                            {sh.checkout.name}
                          </label>
                          <input
                            ref={firstFieldRef}
                            id="co-name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={sh.checkout.namePlaceholder}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label htmlFor="co-phone" className={labelClass}>
                            {sh.checkout.phone}
                          </label>
                          <input
                            id="co-phone"
                            required
                            type="tel"
                            inputMode="numeric"
                            dir="ltr"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder={sh.checkout.phonePlaceholder}
                            className={cn(inputClass, "font-en text-start")}
                          />
                        </div>
                      </div>
                    </section>

                    {/* Order type */}
                    <section className="mt-6">
                      <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-gold-500">
                        {sh.checkout.step2}
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(
                          [
                            {
                              key: "TAKEAWAY",
                              icon: Store,
                              label: sh.checkout.takeaway,
                              hint: sh.checkout.takeawayHint,
                            },
                            {
                              key: "DELIVERY",
                              icon: Bike,
                              label: sh.checkout.delivery,
                              hint: sh.checkout.deliveryHint,
                            },
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
                                "flex cursor-pointer flex-col items-start gap-1 rounded-2xl border p-4 text-start transition-colors duration-200",
                                active
                                  ? "border-gold-500 bg-gold-500/12"
                                  : "border-ink-600 bg-ink-800 hover:border-ink-500"
                              )}
                            >
                              <Icon
                                aria-hidden
                                className={cn(
                                  "size-5",
                                  active ? "text-gold-500" : "text-muted"
                                )}
                              />
                              <span className="font-extrabold text-cream">
                                {opt.label}
                              </span>
                              <span className="text-xs text-muted-dim">
                                {opt.hint}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {orderType === "DELIVERY" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 overflow-hidden"
                        >
                          <label htmlFor="co-address" className={labelClass}>
                            {sh.checkout.address}
                          </label>
                          <textarea
                            id="co-address"
                            required
                            rows={2}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder={sh.checkout.addressPlaceholder}
                            className={cn(inputClass, "h-auto py-3 leading-relaxed")}
                          />
                        </motion.div>
                      )}
                    </section>

                    {/* Payment */}
                    <section className="mt-6">
                      <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-gold-500">
                        {sh.checkout.step3}
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(
                          [
                            {
                              key: "CASH",
                              icon: Banknote,
                              label: sh.checkout.cash,
                              hint: sh.checkout.cashHint,
                            },
                            {
                              key: "VODAFONE_CASH",
                              icon: Smartphone,
                              label: sh.checkout.vodafone,
                              hint: sh.checkout.vodafoneHint,
                            },
                          ] as const
                        ).map((opt) => {
                          const active = payment === opt.key;
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => setPayment(opt.key)}
                              aria-pressed={active}
                              className={cn(
                                "flex cursor-pointer flex-col items-start gap-1 rounded-2xl border p-4 text-start transition-colors duration-200",
                                active
                                  ? "border-gold-500 bg-gold-500/12"
                                  : "border-ink-600 bg-ink-800 hover:border-ink-500"
                              )}
                            >
                              <Icon
                                aria-hidden
                                className={cn(
                                  "size-5",
                                  active ? "text-gold-500" : "text-muted"
                                )}
                              />
                              <span className="font-extrabold text-cream">
                                {opt.label}
                              </span>
                              <span className="text-xs text-muted-dim">
                                {opt.hint}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {payment === "VODAFONE_CASH" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 overflow-hidden"
                        >
                          <div className="rounded-2xl border border-gold-500/25 bg-gold-500/[0.07] p-4">
                            <p className="text-sm leading-relaxed text-cream">
                              {sh.checkout.vodafoneInstructions}
                            </p>
                            <p
                              dir="ltr"
                              className="my-2 font-en text-2xl font-extrabold text-gold-500 num"
                            >
                              {VODAFONE_CASH_NUMBER}
                            </p>
                            <p className="text-xs leading-relaxed text-muted">
                              {sh.checkout.vodafoneThen}
                            </p>
                          </div>

                          <div className="mt-3">
                            <label htmlFor="co-ref" className={labelClass}>
                              {sh.checkout.paymentRef}
                            </label>
                            <input
                              id="co-ref"
                              required
                              dir="ltr"
                              inputMode="numeric"
                              value={paymentRef}
                              onChange={(e) => setPaymentRef(e.target.value)}
                              placeholder={sh.checkout.paymentRefPlaceholder}
                              className={cn(inputClass, "font-en text-start")}
                            />
                          </div>
                        </motion.div>
                      )}
                    </section>

                    {/* Notes */}
                    <section className="mt-6">
                      <label htmlFor="co-notes" className={labelClass}>
                        {sh.checkout.notes}
                      </label>
                      <textarea
                        id="co-notes"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={sh.checkout.notesPlaceholder}
                        className={cn(inputClass, "h-auto py-3 leading-relaxed")}
                      />
                    </section>

                    {/* Error — shown next to the submit button, not only at the top */}
                    {error && (
                      <motion.p
                        role="alert"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-5 flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3.5 text-sm font-semibold leading-relaxed text-rose-200"
                      >
                        <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
                        {error}
                      </motion.p>
                    )}
                  </div>

                  {/* Sticky totals + submit */}
                  <footer className="shrink-0 border-t border-ink-700 bg-ink-900 p-5">
                    <dl className="mb-3.5 flex flex-col gap-1 text-sm">
                      <div className="flex items-center justify-between">
                        <dt className="text-muted">{sh.cart.subtotal}</dt>
                        <dd className="font-en font-bold text-cream num">
                          {formatEGP(subtotal, lang)}
                        </dd>
                      </div>
                      {delivery > 0 && (
                        <div className="flex items-center justify-between">
                          <dt className="text-muted">{sh.cart.deliveryFee}</dt>
                          <dd className="font-en font-bold text-cream num">
                            {formatEGP(delivery, lang)}
                          </dd>
                        </div>
                      )}
                      <div className="mt-1 flex items-center justify-between border-t border-ink-700 pt-2">
                        <dt className="font-extrabold text-cream">{sh.cart.total}</dt>
                        <dd className="font-en text-xl font-extrabold text-gold-500 num">
                          {formatEGP(total, lang)}
                        </dd>
                      </div>
                    </dl>

                    <button
                      type="submit"
                      disabled={submitting || lines.length === 0}
                      className="flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gold-500 px-5 font-extrabold text-ink-950 shadow-glow transition-colors duration-200 hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting && (
                        <Loader2 aria-hidden className="size-5 animate-spin" />
                      )}
                      {submitting ? sh.checkout.submitting : sh.checkout.submit}
                    </button>
                  </footer>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
