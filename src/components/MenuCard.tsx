"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Star, Plus, Ban } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { CategoryDTO, MenuItemDTO } from "@/lib/menu-service";
import { useCart } from "@/store/cart";
import { accentStyle } from "@/lib/accents";
import { cn } from "@/lib/utils";
import { ItemImage } from "./ui/ItemImage";
import { cardEnter, SPRING_POP, SPRING_SOFT } from "./ui/Motion";

/** Categories where add-ons are offered, so the customiser is worth opening. */
export const ADDON_CATEGORIES = [
  "waffle",
  "pancake",
  "freska",
  "fattah",
  "rice-pudding",
];

/* ============================================================================
   Floating product card.

   Design
   ------
   A frosted, rounded slab that lifts on hover and lights up in ITS OWN section
   colour — peach for the bakery, lavender for the blended drinks, aqua for the
   cold ones. The hue arrives as a single inline `--accent` property from
   `accentStyle()`; every tinted part below (glow, price chip, quick-add button,
   best-seller badge) reads that one variable, so there is no colour ladder here
   and adding a category means adding one line to src/lib/accents.ts.

   Motion
   ------
   The card is a `motion.article` with spring hover, press and entrance. That is
   affordable ONLY because the grid mounts a capped page of items (16, then 32
   more on demand) rather than all 166 — the spring budget is bounded by that
   cap, not by the size of the menu.

   What is still deliberately absent is Framer's `layout`. Layout animation
   measures every participating node on every commit, and an earlier pass
   removed exactly that from this grid because it was the main source of scroll
   jank. Transform and opacity springs run on the compositor; `layout` does not.

   The glow is one absolutely-positioned sibling that fades in on group-hover,
   rather than a blurred ::after halo per card: one composited layer, no paint
   on scroll.

   It also reads the cart imperatively inside the handler instead of
   subscribing, so adding one item does not re-render the whole grid.
   ========================================================================== */

function MenuCardImpl({
  item,
  category,
  onOpen,
  priority = false,
  wide = false,
}: {
  item: MenuItemDTO;
  category: CategoryDTO | undefined;
  onOpen: (item: MenuItemDTO) => void;
  /** Eager-load the first row so the grid has something above the fold. */
  priority?: boolean;
  /** Bento hero tile: spans two columns and lays out landscape. */
  wide?: boolean;
}) {
  const { t, sh, lang, pick } = useI18n();
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
    // Imperative read: no subscription, so cart changes don't re-render cards.
    useCart.getState().add({
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
      style={accentStyle(item.cat)}
      variants={cardEnter}
      whileHover={item.available ? { y: -6, transition: SPRING_SOFT } : undefined}
      className={cn(
        "group relative flex overflow-hidden rounded-3xl border bg-ink-900/70 backdrop-blur-sm",
        "transition-colors duration-300 will-change-transform",
        // Landscape on the bento hero tile, portrait everywhere else.
        // `sm:min-h-60` is load-bearing: in the landscape layout the image side
        // has no intrinsic height (a `fill` image contributes none), so without
        // a floor the row would collapse to whatever the two lines of text
        // need and the hero tile would render as a letterbox strip.
        wide ? "flex-col sm:min-h-60 sm:flex-row" : "flex-col",
        item.available
          ? "border-ink-700/80 hover:accent-border"
          : "border-ink-700/50 opacity-55"
      )}
    >
      {/* Accent glow. A sibling with a box-shadow rather than a blurred halo:
          one composited layer, and nothing repaints while the grid scrolls. */}
      {item.available && (
        <span
          aria-hidden
          className="glow-accent pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      )}

      <button
        type="button"
        onClick={() => onOpen(item)}
        aria-label={t.a11y.openItem(name)}
        className={cn(
          "relative flex flex-1 cursor-pointer text-start",
          wide ? "flex-col sm:flex-row sm:items-stretch" : "flex-col"
        )}
      >
        <span
          className={cn(
            "relative block overflow-hidden",
            wide && "sm:w-1/2 sm:shrink-0"
          )}
        >
          <ItemImage
            as="span"
            src={item.imageUrl}
            alt={name}
            icon={category?.icon ?? "coffee"}
            priority={priority}
            className={cn(
              "w-full shrink-0 transition-transform duration-500 ease-out group-hover:scale-105",
              wide ? "aspect-[5/4] sm:h-full sm:aspect-auto" : "aspect-[5/4]"
            )}
            iconClassName="size-10"
          />

          {/* Scrim: the badges sit on photography and need their own contrast
              floor rather than relying on whatever the picture happens to be. */}
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/25 to-transparent"
          />

          {/* Price, floating on the image — the number a customer scans for
              first, so it gets the strongest position on the card. */}
          <span className="absolute bottom-3 start-3 flex items-end gap-1.5">
            {item.sizes ? (
              <>
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
              </>
            ) : (
              <span className="accent-chip flex items-baseline gap-1 rounded-xl px-2.5 py-1.5 backdrop-blur-md">
                <span className="font-en text-xl font-extrabold leading-none num">
                  {item.price}
                </span>
                <span className="text-[10px] font-bold opacity-80">
                  {t.currency}
                </span>
              </span>
            )}
          </span>

          {/* Status badges, top corner */}
          <span className="absolute top-3 end-3 flex flex-col items-end gap-1.5">
            {!item.available ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 bg-ink-950/80 px-2.5 py-1 text-[10px] font-extrabold text-rose-300 backdrop-blur-md">
                <Ban aria-hidden className="size-3" />
                {sh.item.soldOut}
              </span>
            ) : (
              item.best && (
                <span className="accent-fill inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold">
                  <Star aria-hidden className="size-3 fill-current" />
                  {t.menu.bestSeller}
                </span>
              )
            )}
          </span>
        </span>

        {/* `pe-16` reserves the gutter the quick-add button sits in: the button
            is inset 14px and is 44px wide, so anything less than 58px lets a
            long name run under it. 64px leaves a comfortable 6px. */}
        <span
          className={cn(
            "flex flex-1 flex-col gap-0.5 p-4 pe-16",
            wide && "sm:justify-center sm:p-6 sm:pe-16"
          )}
        >
          <span
            className={cn(
              "text-pretty font-extrabold leading-snug text-cream",
              wide ? "text-[15px] sm:text-xl" : "text-[15px]"
            )}
          >
            {name}
          </span>
          {/* Opposite-language name. Bidi-isolated so a Latin name inside an
              Arabic card cannot reorder the surrounding text. */}
          <span
            className={cn(
              "truncate text-xs text-muted-dim [unicode-bidi:isolate]",
              lang === "ar" ? "font-en" : "font-ar"
            )}
          >
            {secondary}
          </span>
        </span>
      </button>

      {/* Quick add — a floating action button rather than a full-width bar, so
          the card keeps its slab silhouette and the tap target stays where the
          thumb already is. */}
      <motion.button
        type="button"
        onClick={handleAdd}
        disabled={!item.available}
        aria-label={`${sh.item.addToCart}: ${name}`}
        whileHover={item.available ? { scale: 1.14, rotate: 90 } : undefined}
        whileTap={item.available ? { scale: 0.82 } : undefined}
        transition={SPRING_POP}
        className={cn(
          "absolute bottom-3.5 end-3.5 flex size-11 items-center justify-center rounded-2xl",
          item.available
            ? "accent-fill cursor-pointer shadow-lg"
            : "cursor-not-allowed bg-ink-800 text-muted-dim"
        )}
      >
        <Plus aria-hidden className="size-5" strokeWidth={3} />
      </motion.button>
    </motion.article>
  );
}

/**
 * Memoised: the grid re-renders whenever a filter, the search box or the cart
 * changes, and without this every visible card would re-render with it. `item`
 * and `category` are stable object references from the server payload, and
 * `onOpen` is a stable setState function, so the default shallow compare is
 * enough.
 */
export const MenuCard = memo(MenuCardImpl);
MenuCard.displayName = "MenuCard";

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
        "inline-flex items-baseline gap-1 rounded-lg px-2 py-1 text-[10px] font-bold backdrop-blur-md",
        highlight
          ? "accent-chip"
          : "bg-ink-950/70 text-muted ring-1 ring-ink-600"
      )}
    >
      <span className="opacity-75">{label}</span>
      <span className="font-en text-sm font-extrabold num">{value}</span>
      <span className="opacity-65">{currency}</span>
    </span>
  );
}
