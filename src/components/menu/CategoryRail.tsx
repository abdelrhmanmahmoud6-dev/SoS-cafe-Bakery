"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { IconKey } from "@/lib/menu-data";
import { accentStyle } from "@/lib/accents";
import { cn } from "@/lib/utils";
import { ItemImage } from "../ui/ItemImage";

/* ============================================================================
   CATEGORY RAIL

   A horizontal, snap-scrolling strip of photo cards — one per menu section —
   replacing the old text-and-icon pill row.

   Three deliberate choices:

   1. Native overflow scrolling, not a Framer `drag` track. Momentum, rubber
      banding and touch cancellation are already perfect in the browser and run
      off the main thread; a JS-driven carousel has to reimplement all three and
      stutters on mid-range Android.

   2. Framer Motion is used only where it earns its keep: the shared `layoutId`
      ring that flies from the old card to the new one, and a one-time entrance
      stagger. That is a couple of animated nodes, not one per card.

   3. Photos go through `ItemImage`, so an unreachable URL degrades to the
      section's icon instead of a broken-image box, and allow-listed hosts still
      get AVIF/WebP at thumbnail size.
   ========================================================================== */

export interface RailTile {
  id: string;
  label: string;
  count: number;
  /** null renders the "all sections" icon tile instead of a photo. */
  image: string | null;
  icon: IconKey;
}

/** How far one arrow tap travels — roughly two cards. */
const STEP = 280;

/** Ignore sub-pixel scroll residue when deciding whether an edge is reachable. */
const EDGE_SLACK = 8;

function CategoryRailImpl({
  tiles,
  active,
  onSelect,
}: {
  tiles: RailTile[];
  active: string;
  onSelect: (id: string) => void;
}) {
  const { t } = useI18n();
  const reduced = useReducedMotion();

  const trackRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });

  /**
   * How much content is hidden past each PHYSICAL edge.
   *
   * `scrollLeft` runs negative in RTL, so the two directions are derived from
   * its magnitude and the writing direction rather than from its sign — without
   * that, the arrows and fades appear on the wrong side in Arabic.
   */
  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const travelled = Math.abs(el.scrollLeft);
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const rtl = getComputedStyle(el).direction === "rtl";
    const hiddenLeft = rtl ? max - travelled : travelled;
    const hiddenRight = rtl ? travelled : max - travelled;
    setOverflow({
      left: hiddenLeft > EDGE_SLACK,
      right: hiddenRight > EDGE_SLACK,
    });
  }, []);

  useEffect(() => {
    measure();
    const el = trackRef.current;
    if (!el) return;
    // Re-measure on breakpoint changes and font swaps, not just on scroll.
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, tiles.length]);

  /** Keeps the selected card visible when the filter is changed from elsewhere. */
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(`[data-tile="${CSS.escape(active)}"]`);
    card?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [active, reduced]);

  /** Negative `left` always means "physically leftwards", in both directions. */
  function nudge(direction: -1 | 1) {
    trackRef.current?.scrollBy({
      left: direction * STEP,
      behavior: reduced ? "auto" : "smooth",
    });
  }

  /**
   * Click-and-drag the rail with a mouse.
   *
   * Touch is deliberately excluded (`pointerType === "mouse"` only): a finger
   * already gets native momentum scrolling, and hijacking it with pointer
   * capture would replace a physics-accurate gesture with a worse one. This
   * only fills the gap on desktop, where a trackpad user has no swipe at all.
   *
   * `hasDragged` suppresses the click that a browser fires at the end of a
   * drag, so releasing over a tile does not also select that category.
   */
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = trackRef.current;
    if (!el) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
    // Capture can throw if the pointer has already been released or was never
    // a real device pointer. A throw here would abort the handler and leave the
    // rail in a half-dragged state, so it is contained.
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* proceed without capture — the drag still tracks via pointermove */
    }
    el.classList.add("rail-dragging");
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = trackRef.current;
    if (!drag.current.active || !el) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.startScroll - dx;
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    const el = trackRef.current;
    if (!drag.current.active || !el) return;
    drag.current.active = false;
    el.classList.remove("rail-dragging");
    try {
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }

  /** Swallow the click that ends a drag, so it never selects a tile. */
  function onClickCapture(e: React.MouseEvent) {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  }

  return (
    <div className="relative">
      {/* Fades hinting that the strip continues past the frame. Pointer events
          are off so they can never swallow a tap on the card underneath. */}
      <Fade side="left" show={overflow.left} />
      <Fade side="right" show={overflow.right} />

      <Arrow
        side="left"
        show={overflow.left}
        label={t.menu.scrollPrev}
        onClick={() => nudge(-1)}
      />
      <Arrow
        side="right"
        show={overflow.right}
        label={t.menu.scrollNext}
        onClick={() => nudge(1)}
      />

      <div
        ref={trackRef}
        onScroll={measure}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        role="tablist"
        aria-label={t.menu.categoryLabel}
        className="no-scrollbar flex snap-x snap-proximity gap-3 overflow-x-auto scroll-smooth px-0.5 pb-4 pt-2"
      >
        {tiles.map((tile, i) => (
          <RailCard
            key={tile.id}
            tile={tile}
            index={i}
            isActive={active === tile.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Fade({ side, show }: { side: "left" | "right"; show: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 z-20 w-12 transition-opacity duration-200",
        side === "left"
          ? "left-0 bg-gradient-to-r from-ink-950 to-transparent"
          : "right-0 bg-gradient-to-l from-ink-950 to-transparent",
        show ? "opacity-100" : "opacity-0"
      )}
    />
  );
}

/**
 * Desktop-only scroll control.
 *
 * Hidden below `sm` on purpose: a touch device already has the better gesture,
 * and a floating button over a 128px card eats a third of it.
 */
function Arrow({
  side,
  show,
  label,
  onClick,
}: {
  side: "left" | "right";
  show: boolean;
  label: string;
  onClick: () => void;
}) {
  if (!show) return null;
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "absolute top-1/2 z-30 hidden size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full",
        "glass text-cream",
        "transition-[transform,color] duration-200 hover:scale-110 hover:text-gold-500 active:scale-90 sm:flex",
        side === "left" ? "left-1" : "right-1"
      )}
    >
      <Icon aria-hidden className="size-5" />
    </button>
  );
}

/* -------------------------------------------------------------------------- */

function RailCardImpl({
  tile,
  index,
  isActive,
  onSelect,
}: {
  tile: RailTile;
  index: number;
  isActive: boolean;
  onSelect: (id: string) => void;
}) {
  const { t } = useI18n();

  return (
    <motion.button
      type="button"
      role="tab"
      data-tile={tile.id}
      aria-selected={isActive}
      aria-label={t.a11y.selectCategory(tile.label)}
      onClick={() => onSelect(tile.id)}
      // Entrance only. The stagger is capped so the last card in a long menu
      // does not arrive half a second after the first.
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.03, 0.36),
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "group relative w-30 shrink-0 snap-start cursor-pointer rounded-3xl text-start outline-none sm:w-34",
        // Scale, not just lift: the active section grows out of the rail so it
        // reads as selected from the corner of the eye, mid-scroll.
        "transition-transform duration-300 ease-out will-change-transform",
        isActive
          ? "scale-105"
          : "hover:-translate-y-1.5 hover:scale-[1.03] focus-visible:-translate-y-1.5",
        "active:scale-95"
      )}
      style={accentStyle(tile.id)}
    >
      {/* The travelling highlight. One shared layout node for the whole rail,
          so switching sections animates a single element rather than two. */}
      {isActive && (
        <motion.span
          aria-hidden
          layoutId="category-rail-active"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="glow-accent pointer-events-none absolute -inset-1 z-20 rounded-[1.6rem]"
        />
      )}

      <span className="relative block overflow-hidden rounded-3xl">
        {tile.image ? (
          <ItemImage
            as="span"
            src={tile.image}
            alt=""
            icon={tile.icon}
            className={cn(
              "aspect-[4/5] w-full transition-transform duration-500 ease-out",
              isActive ? "scale-105" : "group-hover:scale-105"
            )}
            iconClassName="size-7"
            sizes="(max-width: 640px) 120px, 136px"
          />
        ) : (
          <span className="flex aspect-[4/5] w-full items-center justify-center bg-[radial-gradient(120%_120%_at_50%_0%,rgb(223_255_60/0.24),transparent_70%)] text-gold-500">
            <LayoutGrid aria-hidden className="size-8" strokeWidth={1.5} />
          </span>
        )}

        {/* Scrim: the label sits on photography, so it needs its own contrast
            floor rather than relying on whatever the picture happens to be. */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 transition-opacity duration-300",
            "bg-gradient-to-t from-ink-950 via-ink-950/55 to-ink-950/10",
            isActive ? "opacity-95" : "opacity-85 group-hover:opacity-95"
          )}
        />

        {/* Inactive tiles get a hairline; the active one is ringed by the
            travelling glow above, so a second ring here would double up. */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-3xl transition-opacity duration-300",
            isActive ? "opacity-0" : "accent-ring opacity-40 group-hover:opacity-100"
          )}
        />

        <span className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-1 p-2.5">
          <span
            className={cn(
              "line-clamp-2 text-xs font-extrabold leading-tight transition-colors duration-300",
              isActive ? "accent-text" : "text-cream"
            )}
          >
            {tile.label}
          </span>
          <span
            className={cn(
              "rounded-lg px-1.5 py-0.5 font-en text-[10px] font-extrabold num transition-colors duration-300",
              isActive
                ? "accent-fill"
                : "bg-ink-950/70 text-muted-dim ring-1 ring-ink-600 backdrop-blur-md"
            )}
          >
            {tile.count}
          </span>
        </span>
      </span>
    </motion.button>
  );
}

/** Memoised: typing in the search box must not re-render fifteen photo cards. */
const RailCard = memo(RailCardImpl);
RailCard.displayName = "RailCard";

export const CategoryRail = memo(CategoryRailImpl);
CategoryRail.displayName = "CategoryRail";
