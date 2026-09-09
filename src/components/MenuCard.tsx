"use client";

import { memo } from "react";
import { Star, Plus, Ban } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { CategoryDTO, MenuItemDTO } from "@/lib/menu-service";
import { useCart } from "@/store/cart";
import { accentStyle } from "@/lib/accents";
import { cn } from "@/lib/utils";
import { ItemImage } from "./ui/ItemImage";

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

   Performance
   -----------
   Every hover and press effect is a CSS transition on transform, opacity or
   box-shadow — not a Framer Motion node. With up to 166 of these on screen,
   `whileHover`/`whileTap` would put Framer in charge of measuring and animating
   a hundred-plus elements, which is exactly the jank that an earlier pass
   removed. `active:scale-[0.97]` gives the satisfying press without a single
   byte of JS.

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
}: {
  item: MenuItemDTO;
  category: CategoryDTO | undefined;
  onOpen: (item: MenuItemDTO) => void;
  /** Eager-load the first row so the grid has something above the fold. */
  priority?: boolean;
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
    <article
      style={accentStyle(item.cat)}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border bg-ink-900/70 backdrop-blur-sm",
        "transition-[transform,border-color] duration-300 ease-out will-change-transform",
        item.available
          ? "border-ink-700/80 hover:-translate-y-1.5 hover:accent-border"
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
        className="relative flex flex-1 cursor-pointer flex-col text-start"
      >
        <span className="relative block overflow-hidden">
          <ItemImage
            as="span"
            src={item.imageUrl}
            alt={name}
            icon={category?.icon ?? "coffee"}
            priority={priority}
            className="aspect-[5/4] w-full shrink-0 transition-transform duration-500 ease-out group-hover:scale-105"
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
        <span className="flex flex-1 flex-col gap-0.5 p-4 pe-16">
          <span className="text-pretty text-[15px] font-extrabold leading-snug text-cream">
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
      <button
        type="button"
        onClick={handleAdd}
        disabled={!item.available}
        aria-label={`${sh.item.addToCart}: ${name}`}
        className={cn(
          "absolute bottom-3.5 end-3.5 flex size-11 items-center justify-center rounded-2xl",
          "transition-[transform,box-shadow,background-color] duration-200 ease-out",
          item.available
            ? "accent-fill cursor-pointer shadow-lg hover:scale-110 active:scale-90"
            : "cursor-not-allowed bg-ink-800 text-muted-dim"
        )}
      >
        <Plus aria-hidden className="size-5" strokeWidth={3} />
      </button>
    </article>
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
