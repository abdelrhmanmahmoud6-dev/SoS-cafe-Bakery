"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useCart, cartCount } from "@/store/cart";

/**
 * Nav cart trigger with a live item-count badge.
 *
 * The count is rendered as 0 until after hydration: the cart is restored from
 * localStorage on the client, so rendering the real number during SSR would
 * produce a hydration mismatch.
 */
export function CartButton({ className = "" }: { className?: string }) {
  const { sh } = useI18n();
  const lines = useCart((s) => s.lines);
  const open = useCart((s) => s.open);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  const count = hydrated ? cartCount(lines) : 0;

  return (
    <button
      type="button"
      onClick={open}
      aria-label={`${sh.cart.open}${count > 0 ? ` (${count})` : ""}`}
      className={
        className ||
        "relative flex size-11 cursor-pointer items-center justify-center rounded-xl border border-ink-600 bg-ink-800/70 text-cream transition-all duration-200 hover:border-gold-500/60 hover:text-gold-500"
      }
    >
      <ShoppingBag aria-hidden className="size-5" />

      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="absolute -end-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-gold-500 font-en text-[10px] font-extrabold text-ink-950 num"
          >
            {count > 99 ? "99+" : count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
