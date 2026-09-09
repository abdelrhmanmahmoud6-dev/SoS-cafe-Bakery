"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Search, X, ArrowUpDown, SearchX, ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SEARCH_SUGGESTIONS } from "@/lib/dictionary";
import type { CategoryDTO, MenuItemDTO } from "@/lib/menu-service";
import { cn, foldForSearch } from "@/lib/utils";
import {
  Reveal,
  SectionHeading,
  AmbientShapes,
  cardEnter,
} from "./ui/Motion";
import { CategoryRail, type RailTile } from "./menu/CategoryRail";
import { MenuCard } from "./MenuCard";
import { ItemSheet } from "./shop/ItemSheet";

type Filter = string | "all";
type SortKey = "default" | "priceAsc" | "priceDesc" | "nameAsc";

function minPrice(i: MenuItemDTO): number {
  return i.sizes ? i.sizes.L : (i.price ?? 0);
}
function maxPrice(i: MenuItemDTO): number {
  return i.sizes ? i.sizes.XL : (i.price ?? 0);
}

/**
 * Container variant for the card grid.
 *
 * `delayChildren` gives the container's own fade a beat before the cards start
 * arriving, so the two reads as one gesture rather than a race. The stagger is
 * small (35ms): anything slower and the last card in a 16-card page lands over
 * half a second late, which feels sluggish rather than choreographed.
 */
const gridStagger: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.035, delayChildren: 0.04 },
  },
};

/**
 * Which cards become double-width bento tiles.
 *
 * Only best-sellers, only in the first two rows, and never two in a row — a
 * grid where half the tiles are wide is just a grid with two column widths.
 * Index-based rather than random so the layout is stable across re-renders and
 * identical between server and client.
 */
function isHeroTile(item: MenuItemDTO, index: number): boolean {
  return item.best && index < 8 && index % 5 === 0;
}

export function Menu({
  categories,
  items,
  counts,
  addons,
}: {
  categories: CategoryDTO[];
  items: MenuItemDTO[];
  counts: Record<string, number>;
  addons: MenuItemDTO[];
}) {
  const { t, lang, pick } = useI18n();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("default");
  const [selected, setSelected] = useState<MenuItemDTO | null>(null);

  const deferredQuery = useDeferredValue(query);

  /**
   * How many cards are mounted.
   *
   * Rendering all 166 at once put ~4,600 nodes in the DOM and made scrolling
   * crawl. A page of 16 covers the fold on every breakpoint; the rest arrive on
   * demand. This is capped mounting, not windowing — cards already revealed
   * stay mounted, so scroll position never jumps.
   */
  const PAGE = 16;
  const [visibleCount, setVisibleCount] = useState(PAGE);

  const catById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const results = useMemo(() => {
    const q = foldForSearch(deferredQuery);

    let list = items.filter((item) => {
      if (filter !== "all" && item.cat !== filter) return false;
      if (!q) return true;
      const cat = catById.get(item.cat);
      const haystack = foldForSearch(
        `${item.ar} ${item.en} ${cat ? `${cat.ar} ${cat.en}` : ""}`
      );
      return haystack.includes(q);
    });

    if (sort === "priceAsc") {
      // Cheapest first uses the entry price (the L size for multi-size items).
      list = [...list].sort((a, b) => minPrice(a) - minPrice(b));
    } else if (sort === "priceDesc") {
      // Dearest first uses the top of the range, so a 75 EGP XL waffle
      // correctly outranks a 70 EGP single-price item.
      list = [...list].sort((a, b) => maxPrice(b) - maxPrice(a));
    } else if (sort === "nameAsc") {
      const collator = new Intl.Collator(lang === "ar" ? "ar-EG" : "en", {
        sensitivity: "base",
      });
      list = [...list].sort((a, b) =>
        collator.compare(lang === "ar" ? a.ar : a.en, lang === "ar" ? b.ar : b.en)
      );
    }

    return list;
  }, [items, catById, filter, deferredQuery, sort, lang]);

  /**
   * Rail tiles.
   *
   * Memoised because the rail is memoised: rebuilding this array on every
   * keystroke in the search box would hand `CategoryRail` a fresh prop each
   * time and re-render fifteen photo cards for nothing.
   */
  const tiles = useMemo<RailTile[]>(
    () => [
      {
        id: "all",
        label: t.menu.all,
        count: items.length,
        image: null,
        icon: "coffee",
      },
      ...categories.map((c) => ({
        id: c.id,
        label: lang === "ar" ? c.ar : c.en,
        count: counts[c.id] ?? 0,
        image: c.image,
        icon: c.icon,
      })),
    ],
    [categories, counts, items.length, lang, t.menu.all]
  );

  // Stable identity, for the same reason as `tiles`.
  const selectCategory = useCallback((id: string) => setFilter(id as Filter), []);

  // Any change to the result set starts the list over, so switching to a small
  // category never leaves a stale "show more" count behind.
  useEffect(() => {
    setVisibleCount(PAGE);
  }, [filter, deferredQuery, sort]);

  const showMore = useCallback(() => {
    setVisibleCount((n) => n + PAGE * 2);
  }, []);

  function reset() {
    setQuery("");
    setFilter("all");
    setSort("default");
  }

  const filtersActive = query !== "" || filter !== "all" || sort !== "default";

  // Only this slice is mounted.
  const visible = useMemo(
    () => results.slice(0, visibleCount),
    [results, visibleCount]
  );
  const remaining = results.length - visible.length;

  return (
    /* `isolate` creates a stacking context, so this section's z-indexes can
       never interleave with the fixed navbar or the cart drawer.
       `scroll-mt-28` keeps the heading clear of the fixed navbar on anchor
       jumps — without it the filter bar slides underneath the header. */
    <section
      id="menu"
      className="relative isolate scroll-mt-28 overflow-hidden py-16 md:py-24"
    >
      {/* Layer 0 — ambience, never interactive */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <AmbientShapes />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent"
        />
      </div>

      {/* Layer 10 — content */}
      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow={t.menu.eyebrow}
          title={t.menu.title}
          subtitle={t.menu.subtitle}
        />

        {/* Controls: search + sort */}
        <Reveal delay={0.1} className="mt-12">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor="menu-search" className="sr-only">
                {t.menu.searchLabel}
              </label>
              <Search
                aria-hidden
                className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-dim"
              />
              <input
                id="menu-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.menu.searchPlaceholder}
                className="h-14 w-full rounded-2xl border border-ink-700 bg-ink-900/60 ps-12 pe-14 text-base text-cream backdrop-blur-md placeholder:text-muted-dim transition-colors duration-200 hover:border-ink-600 focus:border-gold-500/60 focus:outline-none"
              />
              <AnimatePresence>
                {query && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setQuery("")}
                    aria-label={t.menu.clearSearch}
                    className="absolute end-2 top-1/2 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl bg-ink-800 text-muted transition-[transform,color,background-color] duration-200 hover:bg-ink-700 hover:text-cream active:scale-90"
                  >
                    <X aria-hidden className="size-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <div className="relative sm:w-64">
              <label htmlFor="menu-sort" className="sr-only">
                {t.menu.sortLabel}
              </label>
              <ArrowUpDown
                aria-hidden
                className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-dim"
              />
              <select
                id="menu-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-14 w-full cursor-pointer appearance-none rounded-2xl border border-ink-700 bg-ink-900/60 ps-12 pe-5 text-sm font-semibold text-cream backdrop-blur-md transition-colors duration-200 hover:border-ink-600 focus:border-gold-500/60 focus:outline-none"
              >
                <option value="default">{t.menu.sort.default}</option>
                <option value="priceAsc">{t.menu.sort.priceAsc}</option>
                <option value="priceDesc">{t.menu.sort.priceDesc}</option>
                <option value="nameAsc">{t.menu.sort.nameAsc}</option>
              </select>
            </div>
          </div>
        </Reveal>

        {/* Category rail — a photo strip, in its own bounded panel so the
            cards can never bleed into the row above or the counter below. */}
        <Reveal delay={0.16} className="mt-4">
          <div className="relative rounded-3xl border border-ink-700/60 bg-ink-900/30 p-2 backdrop-blur-md">
            <CategoryRail
              tiles={tiles}
              active={filter}
              onSelect={selectCategory}
            />
          </div>
        </Reveal>

        {/* Results counter — a distinct band with its own vertical rhythm and a
            hairline rule, so the counter and the filter bar cannot collide. */}
        <div className="mt-8 flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-ink-700/70 pb-4">
          <p aria-live="polite" className="text-sm font-bold text-muted">
            <span className="text-gold-500 num">{results.length}</span>{" "}
            {t.itemsWord}
          </p>
          {filtersActive && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 cursor-pointer items-center text-sm font-bold text-muted underline-offset-4 transition-colors duration-200 hover:text-gold-500 hover:underline"
            >
              {t.menu.resetFilters}
            </button>
          )}
        </div>

        {/* Grid / empty state */}
        {results.length > 0 ? (
          <>
            {/* Section switch.

                The whole grid is re-keyed on `filter`, so React unmounts the
                old page and mounts the new one; the container's `show` variant
                then staggers its children in. That is what makes a category
                change read as a wave of cards arriving rather than a hard cut,
                and it costs 16 spring animations — the page cap — not 166.

                Framer's `layout` is still deliberately absent: it measures
                every participating node on each commit, and removing it from
                this grid is what fixed the scroll jank in the first place. */}
            <motion.div
              key={filter}
              variants={gridStagger}
              initial="hidden"
              animate="show"
              className="mt-8 grid auto-rows-auto grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {visible.map((item, i) => (
                <motion.div
                  key={item.id}
                  variants={cardEnter}
                  className={cn(isHeroTile(item, i) && "sm:col-span-2")}
                >
                  <MenuCard
                    item={item}
                    category={catById.get(item.cat)}
                    onOpen={setSelected}
                    priority={i < 4}
                    wide={isHeroTile(item, i)}
                  />
                </motion.div>
              ))}
            </motion.div>

            {remaining > 0 && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={showMore}
                  className="flex min-h-13 cursor-pointer items-center gap-2 rounded-2xl border border-ink-600 bg-ink-900/60 px-7 font-extrabold text-cream backdrop-blur-md transition-[transform,color,border-color] duration-200 hover:-translate-y-0.5 hover:border-gold-500/60 hover:text-gold-500 active:scale-95"
                >
                  <ChevronDown aria-hidden className="size-5" />
                  {t.menu.showMore}
                  <span className="rounded-lg bg-ink-800 px-2 py-0.5 font-en text-xs text-muted-dim num">
                    {remaining}
                  </span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="animate-card-in mt-10 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-ink-600 bg-ink-900/40 px-6 py-16 text-center backdrop-blur-md">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-ink-800 text-muted-dim">
              <SearchX aria-hidden className="size-8" />
            </span>
            <h3 className="text-xl font-extrabold text-cream">
              {t.menu.emptyTitle}
            </h3>
            <p className="max-w-md leading-relaxed text-muted">
              {t.menu.emptyBody}
            </p>

            <p className="mt-2 text-sm font-bold text-muted-dim">
              {t.menu.emptySuggestions}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SEARCH_SUGGESTIONS.map((s) => (
                <button
                  key={s.en}
                  type="button"
                  onClick={() => {
                    setFilter("all");
                    setQuery(pick(s));
                  }}
                  className="min-h-11 cursor-pointer rounded-2xl border border-ink-600 bg-ink-800 px-4 text-sm font-bold text-cream transition-[transform,color,border-color] duration-200 hover:border-gold-500/60 hover:text-gold-500 active:scale-95"
                >
                  {pick(s)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ItemSheet
        item={selected}
        category={selected ? (catById.get(selected.cat) ?? null) : null}
        addons={addons}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
