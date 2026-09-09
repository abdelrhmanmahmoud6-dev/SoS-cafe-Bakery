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
    <motion.button
      type="button"
      onClick={open}
      aria-label={`${sh.cart.open}${count > 0 ? ` (${count})` : ""}`}
      whileTap={{ scale: 0.88 }}
      transition={{ type: "spring", stiffness: 600, damping: 20 }}
      className={
        className ||
        "relative flex size-11 cursor-pointer items-center justify-center rounded-2xl border border-sand-400 bg-sand-200/70 text-espresso transition-colors duration-200 hover:border-gold-500/60 hover:text-gold-800"
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
            className="absolute -end-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-gold-500 px-1 font-en text-[10px] font-extrabold text-espresso shadow-glow num"
          >
            {/* Re-keyed on the count so every change remounts and re-runs the
                pop. Without this the badge silently swaps digits, and adding an
                item gives no feedback at the one place the user is looking. */}
            <motion.span
              key={count}
              initial={{ scale: 0.4, y: -6 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 700, damping: 18 }}
            >
              {count > 99 ? "99+" : count}
            </motion.span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
