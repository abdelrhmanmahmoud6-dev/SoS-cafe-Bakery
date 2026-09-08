"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Search, X, ArrowUpDown, SearchX, LayoutGrid, ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SEARCH_SUGGESTIONS } from "@/lib/dictionary";
import type { CategoryDTO, MenuItemDTO } from "@/lib/menu-service";
import { cn, foldForSearch } from "@/lib/utils";
import { Reveal, SectionHeading, AmbientShapes } from "./ui/Motion";
import { CategoryIcon } from "./ui/CategoryIcon";
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

  const tabs: {
    id: Filter;
    label: string;
    count: number;
    icon: React.ReactNode;
  }[] = [
    {
      id: "all",
      label: t.menu.all,
      count: items.length,
      icon: <LayoutGrid aria-hidden className="size-4" />,
    },
    ...categories.map((c) => ({
      id: c.id as Filter,
      label: lang === "ar" ? c.ar : c.en,
      count: counts[c.id] ?? 0,
      icon: <CategoryIcon name={c.icon} className="size-4" />,
    })),
  ];

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
                className="h-14 w-full rounded-2xl border border-ink-700 bg-ink-900/80 ps-12 pe-14 text-base text-cream placeholder:text-muted-dim transition-colors duration-200 hover:border-ink-600 focus:border-gold-500/60 focus:outline-none"
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
                    className="absolute end-2 top-1/2 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg bg-ink-800 text-muted transition-colors duration-200 hover:bg-ink-700 hover:text-cream"
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
                className="h-14 w-full cursor-pointer appearance-none rounded-2xl border border-ink-700 bg-ink-900/80 ps-12 pe-5 text-sm font-semibold text-cream transition-colors duration-200 hover:border-ink-600 focus:border-gold-500/60 focus:outline-none"
              >
                <option value="default">{t.menu.sort.default}</option>
                <option value="priceAsc">{t.menu.sort.priceAsc}</option>
                <option value="priceDesc">{t.menu.sort.priceDesc}</option>
                <option value="nameAsc">{t.menu.sort.nameAsc}</option>
              </select>
            </div>
          </div>
        </Reveal>

        {/* Category rail — its own bounded panel, so the pills can never bleed
            into the row above or the results counter below. */}
        <Reveal delay={0.16} className="mt-4">
          <div className="relative rounded-2xl border border-ink-700/70 bg-ink-900/40 p-2">
            <div
              role="tablist"
              aria-label={t.menu.categoryLabel}
              className="rail-scroll flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0"
            >
              <LayoutGroup id="menu-tabs">
                {tabs.map((tab) => {
                  const isActive = filter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      type="button"
                      aria-selected={isActive}
                      aria-label={t.a11y.selectCategory(tab.label)}
                      onClick={() => setFilter(tab.id)}
                      className={cn(
                        "relative isolate flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors duration-200",
                        isActive
                          ? "text-ink-950"
                          : "border border-ink-700 bg-ink-900/60 text-muted hover:border-ink-600 hover:text-cream"
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="menu-tab-pill"
                          className="absolute inset-0 -z-10 rounded-xl bg-gold-500"
                          transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 36,
                          }}
                        />
                      )}
                      {tab.icon}
                      <span className="whitespace-nowrap">{tab.label}</span>
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 font-en text-[10px] font-extrabold num",
                          isActive
                            ? "bg-ink-950/15 text-ink-950"
                            : "bg-ink-800 text-muted-dim"
                        )}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </LayoutGroup>
            </div>
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
            {/* A plain grid. The previous version wrapped this in `layout` +
                AnimatePresence popLayout, which asked Framer Motion to measure
                and animate every card on each filter change — the main source
                of the scroll jank. Cards now fade in with CSS. */}
            <div className="mt-8 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((item, i) => (
                <div key={item.id} className="animate-card-in">
                  <MenuCard
                    item={item}
                    category={catById.get(item.cat)}
                    onOpen={setSelected}
                    priority={i < 4}
                  />
                </div>
              ))}
            </div>

            {remaining > 0 && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={showMore}
                  className="flex min-h-13 cursor-pointer items-center gap-2 rounded-2xl border border-ink-600 bg-ink-900/70 px-7 font-extrabold text-cream transition-colors duration-200 hover:border-gold-500/60 hover:text-gold-500"
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
          <div className="animate-card-in mt-10 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-ink-600 bg-ink-900/50 px-6 py-16 text-center">
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
                  className="min-h-11 cursor-pointer rounded-xl border border-ink-600 bg-ink-800 px-4 text-sm font-bold text-cream transition-colors duration-200 hover:border-gold-500/60 hover:text-gold-500"
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
