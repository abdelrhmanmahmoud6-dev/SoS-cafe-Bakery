"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, ShoppingBag, Check, Ban } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { CategoryDTO, MenuItemDTO } from "@/lib/menu-service";
import { useCart, type CartAddon } from "@/store/cart";
import type { SizeKey } from "@/lib/order-types";
import { cn, formatEGP } from "@/lib/utils";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { ItemImage } from "@/components/ui/ItemImage";

/**
 * Quick-view + customiser. Handles size choice, add-ons and quantity, then
 * pushes a configured line into the cart.
 */
export function ItemSheet({
  item,
  category,
  addons,
  onClose,
}: {
  item: MenuItemDTO | null;
  category: CategoryDTO | null;
  addons: MenuItemDTO[];
  onClose: () => void;
}) {
  const { sh, lang, pick } = useI18n();
  const add = useCart((s) => s.add);

  const [size, setSize] = useState<SizeKey | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset the configuration each time a different item is opened.
  useEffect(() => {
    if (!item) return;
    setSize(item.sizes ? "L" : null);
    setChosen([]);
    setQuantity(1);
    setJustAdded(false);
  }, [item]);

  // Escape to close, lock background scroll, move focus into the dialog.
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => closeRef.current?.focus(), 60);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      window.clearTimeout(timer);
    };
  }, [item, onClose]);

  // Focus trap.
  useEffect(() => {
    if (!item) return;
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panelRef.current) return;
      const f = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      );
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onTab);
    return () => window.removeEventListener("keydown", onTab);
  }, [item]);

  const unitPrice = useMemo(() => {
    if (!item) return 0;
    if (item.sizes) return size === "XL" ? item.sizes.XL : item.sizes.L;
    return item.price ?? 0;
  }, [item, size]);

  const selectedAddons: CartAddon[] = useMemo(
    () =>
      addons
        .filter((a) => chosen.includes(a.id))
        .map((a) => ({
          id: a.id,
          nameAr: a.ar,
          nameEn: a.en,
          price: a.price ?? 0,
        })),
    [addons, chosen]
  );

  const lineTotal =
    (unitPrice + selectedAddons.reduce((s, a) => s + a.price, 0)) * quantity;

  // Add-ons only make sense on food, not on a cup of tea.
  const showAddons =
    item != null &&
    ["waffle", "pancake", "freska", "fattah", "rice-pudding"].includes(item.cat);

  function handleAdd() {
    if (!item || !item.available) return;
    add(
      {
        itemId: item.id,
        slug: item.slug,
        nameAr: item.ar,
        nameEn: item.en,
        size,
        unitPrice,
        addons: selectedAddons,
      },
      quantity
    );
    setJustAdded(true);
    window.setTimeout(onClose, 450);
  }

  return (
    <AnimatePresence>
      {item && category && (
        <div className="fixed inset-0 z-80 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink-950/85 backdrop-blur-md"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="item-sheet-title"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 330, damping: 30 }}
            className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-ink-700 bg-ink-900 shadow-float sm:rounded-3xl"
          >
            {/* Product photo, when the item has one */}
            {item.imageUrl && (
              <ItemImage
                src={item.imageUrl}
                alt={pick(item)}
                icon={category.icon}
                className="aspect-[16/9] w-full shrink-0"
                iconClassName="size-12"
              />
            )}

            {/* Header */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-gold-500 to-gold-600 px-6 pb-6 pt-5">
              <div className="relative flex items-start justify-between gap-4">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-ink-950/12 text-ink-950">
                  <CategoryIcon name={category.icon} className="size-6" />
                </span>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  aria-label={sh.cart.close}
                  className="flex size-11 cursor-pointer items-center justify-center rounded-xl bg-ink-950/12 text-ink-950 transition-colors duration-200 hover:bg-ink-950 hover:text-gold-500"
                >
                  <X aria-hidden className="size-5" />
                </button>
              </div>

              <h2
                id="item-sheet-title"
                className="relative mt-4 text-pretty text-2xl font-extrabold leading-tight text-ink-950"
              >
                {pick(item)}
              </h2>
              <p className="relative mt-1 text-sm font-semibold text-ink-950/65 [unicode-bidi:isolate]">
                {lang === "ar" ? item.en : item.ar}
              </p>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {!item.available && (
                <p className="mb-4 flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3.5 text-sm font-bold text-rose-300">
                  <Ban aria-hidden className="size-4 shrink-0" />
                  {sh.item.unavailable}
                </p>
              )}

              <p className="leading-relaxed text-muted">
                {lang === "ar"
                  ? item.descAr || category.blurbAr
                  : item.descEn || category.blurbEn}
              </p>

              {/* Size */}
              {item.sizes && (
                <fieldset className="mt-6">
                  <legend className="mb-2.5 text-sm font-extrabold text-cream">
                    {sh.item.chooseSize}
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    {(["L", "XL"] as const).map((key) => {
                      const active = size === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSize(key)}
                          aria-pressed={active}
                          className={cn(
                            "flex min-h-16 cursor-pointer flex-col items-start justify-center gap-0.5 rounded-2xl border px-4 transition-colors duration-200",
                            active
                              ? "border-gold-500 bg-gold-500/12"
                              : "border-ink-600 bg-ink-800 hover:border-ink-500"
                          )}
                        >
                          <span
                            className={cn(
                              "text-xs font-bold",
                              active ? "text-gold-500" : "text-muted"
                            )}
                          >
                            {key === "L" ? "وسط L" : "كبير XL"}
                          </span>
                          <span className="font-en text-lg font-extrabold text-cream num">
                            {formatEGP(item.sizes![key], lang)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {/* Add-ons */}
              {showAddons && addons.length > 0 && (
                <fieldset className="mt-6">
                  <legend className="mb-2.5 text-sm font-extrabold text-cream">
                    {sh.item.addons}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {addons.map((a) => {
                      const active = chosen.includes(a.id);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() =>
                            setChosen((prev) =>
                              prev.includes(a.id)
                                ? prev.filter((x) => x !== a.id)
                                : [...prev, a.id]
                            )
                          }
                          aria-pressed={active}
                          className={cn(
                            "flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3.5 text-sm font-bold transition-colors duration-200",
                            active
                              ? "border-gold-500 bg-gold-500/12 text-gold-500"
                              : "border-ink-600 bg-ink-800 text-muted hover:border-ink-500 hover:text-cream"
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-4 items-center justify-center rounded border",
                              active
                                ? "border-gold-500 bg-gold-500 text-ink-950"
                                : "border-ink-500"
                            )}
                          >
                            {active && <Check aria-hidden className="size-3" strokeWidth={3} />}
                          </span>
                          {pick(a)}
                          <span className="font-en text-xs opacity-75 num">
                            +{a.price}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {/* Quantity */}
              <div className="mt-6 flex items-center justify-between rounded-2xl border border-ink-600 bg-ink-800 p-3">
                <span className="ps-2 text-sm font-extrabold text-cream">
                  {sh.cart.quantity}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label={sh.cart.decrease}
                    className="flex size-11 cursor-pointer items-center justify-center rounded-xl bg-ink-700 text-cream transition-colors duration-200 hover:bg-ink-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus aria-hidden className="size-4" />
                  </button>
                  <span
                    aria-live="polite"
                    className="w-10 text-center font-en text-lg font-extrabold text-cream num"
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    aria-label={sh.cart.increase}
                    className="flex size-11 cursor-pointer items-center justify-center rounded-xl bg-ink-700 text-cream transition-colors duration-200 hover:bg-ink-600"
                  >
                    <Plus aria-hidden className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sticky footer */}
            <div className="shrink-0 border-t border-ink-700 bg-ink-900 p-5">
              <button
                type="button"
                onClick={handleAdd}
                disabled={!item.available}
                className={cn(
                  "flex min-h-13 w-full cursor-pointer items-center justify-between gap-3 rounded-2xl px-5 font-extrabold transition-colors duration-200",
                  item.available
                    ? justAdded
                      ? "bg-emerald-400 text-ink-950"
                      : "bg-gold-500 text-ink-950 hover:bg-gold-400"
                    : "cursor-not-allowed bg-ink-700 text-muted-dim"
                )}
              >
                <span className="flex items-center gap-2">
                  {justAdded ? (
                    <Check aria-hidden className="size-5" strokeWidth={3} />
                  ) : (
                    <ShoppingBag aria-hidden className="size-5" />
                  )}
                  {!item.available
                    ? sh.item.soldOut
                    : justAdded
                      ? sh.item.added
                      : sh.item.addToCart}
                </span>
                <span className="font-en text-lg num">
                  {formatEGP(lineTotal, lang)}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
