"use client";

import { motion } from "framer-motion";
import { Star, Plus, Ban } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { CategoryDTO, MenuItemDTO } from "@/lib/menu-service";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./ui/CategoryIcon";
import { ItemImage } from "./ui/ItemImage";

/** Categories where add-ons are offered, so the customiser is worth opening. */
export const ADDON_CATEGORIES = [
  "waffle",
  "pancake",
  "freska",
  "fattah",
  "rice-pudding",
];

export function MenuCard({
  item,
  category,
  onOpen,
  index,
}: {
  item: MenuItemDTO;
  category: CategoryDTO | undefined;
  onOpen: (item: MenuItemDTO) => void;
  index: number;
}) {
  const { t, sh, lang, pick } = useI18n();
  const add = useCart((s) => s.add);
  const name = pick(item);
  const secondary = lang === "ar" ? item.en : item.ar;

  // Items with sizes or eligible add-ons need the customiser; everything else
  // can go straight into the cart in a single tap.
  const needsChoice =
    item.sizes !== null || ADDON_CATEGORIES.includes(item.cat);

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (!item.available) return;
    if (needsChoice) {
      onOpen(item);
      return;
    }
    add({
      itemId: item.id,
      slug: item.slug,
      nameAr: item.ar,
      nameEn: item.en,
      size: null,
      unitPrice: item.price ?? 0,
      addons: [],
    });
  }

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.02, 0.25),
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={item.available ? { y: -5 } : undefined}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-ink-900/80 transition-colors duration-300",
        item.available
          ? "border-ink-700 hover:border-gold-500/45"
          : "border-ink-700/60 opacity-60"
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(340px circle at 50% -10%, rgb(254 229 0 / 0.10), transparent 65%)",
        }}
      />

      <button
        type="button"
        onClick={() => onOpen(item)}
        aria-label={t.a11y.openItem(name)}
        className="relative flex flex-1 cursor-pointer flex-col text-start"
      >
        {/* Product photo, or the category icon on a warm gradient */}
        <ItemImage
          src={item.imageUrl}
          alt={name}
          icon={category?.icon ?? "coffee"}
          className="aspect-[16/10] w-full shrink-0"
          iconClassName="size-10"
        />

        <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold-500/10 text-gold-500 ring-1 ring-gold-500/20 transition-colors duration-300 group-hover:bg-gold-500 group-hover:text-ink-950">
            {category && <CategoryIcon name={category.icon} className="size-5" />}
          </span>

          {!item.available ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-rose-400/30 bg-rose-400/10 px-2.5 py-1 text-[10px] font-extrabold text-rose-300">
              <Ban aria-hidden className="size-3" />
              {sh.item.soldOut}
            </span>
          ) : (
            item.best && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold-500 px-2.5 py-1 text-[10px] font-extrabold text-ink-950">
                <Star aria-hidden className="size-3 fill-current" />
                {t.menu.bestSeller}
              </span>
            )
          )}
        </div>

        <div className="min-w-0">
          <h3 className="text-pretty text-base font-extrabold leading-snug text-cream">
            {name}
          </h3>
          {/* Opposite-language name. Bidi-isolated so a Latin name inside an
              Arabic card cannot reorder the surrounding text. */}
          <p
            className={cn(
              "mt-0.5 truncate text-xs text-muted-dim [unicode-bidi:isolate]",
              lang === "ar" ? "font-en" : "font-ar"
            )}
          >
            {secondary}
          </p>
        </div>

        <div className="mt-auto pt-2">
          {item.sizes ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <PriceChip
                label={t.menu.sizeL}
                value={item.sizes.L}
                currency={t.currency}
              />
              <PriceChip
                label={t.menu.sizeXL}
                value={item.sizes.XL}
                currency={t.currency}
                highlight
              />
            </div>
          ) : (
            <p className="flex items-baseline gap-1.5">
              <span className="font-en text-2xl font-extrabold text-gold-500 num">
                {item.price}
              </span>
              <span className="text-xs font-bold text-muted">{t.currency}</span>
            </p>
          )}
        </div>
        </div>
      </button>

      {/* Add to cart */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={!item.available}
        aria-label={`${sh.item.addToCart}: ${name}`}
        className={cn(
          "relative flex min-h-11 items-center justify-center gap-2 border-t border-ink-700 text-xs font-bold transition-colors duration-200",
          item.available
            ? "cursor-pointer bg-ink-800/60 text-muted hover:bg-gold-500 hover:text-ink-950 focus-visible:bg-gold-500 focus-visible:text-ink-950"
            : "cursor-not-allowed bg-ink-800/30 text-muted-dim"
        )}
      >
        <Plus aria-hidden className="size-4" />
        {item.available ? sh.item.addToCart : sh.item.soldOut}
      </button>
    </motion.article>
  );
}

function PriceChip({
  label,
  value,
  currency,
  highlight = false,
}: {
  label: string;
  value: number;
  currency: string;
  highlight?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold",
        highlight
          ? "bg-gold-500/15 text-gold-500 ring-1 ring-gold-500/25"
          : "bg-ink-800 text-muted ring-1 ring-ink-600"
      )}
    >
      <span className="opacity-80">{label}</span>
      <span className="font-en text-sm font-extrabold num">{value}</span>
      <span className="opacity-70">{currency}</span>
    </span>
  );
}
