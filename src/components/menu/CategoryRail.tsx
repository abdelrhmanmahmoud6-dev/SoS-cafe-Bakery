"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { IconKey } from "@/lib/menu-data";
import { accentStyle } from "@/lib/accents";
import { cn } from "@/lib/utils";
import { ItemImage } from "../ui/ItemImage";
import { SPRING_POP, SPRING_TRAVEL, useCoarsePointer } from "../ui/Motion";

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

  /**
   * Keeps the selected tile centred in the rail when the filter changes.
   *
   * This scrolls the TRACK and nothing else. It used to call
   * `card.scrollIntoView({ inline: "center", block: "nearest" })`, and
   * scrollIntoView does not stop at the element's own scroll container — it
   * scrolls every scrollable ancestor, the window included, until the element
   * is on screen. `block: "nearest"` let it move the page vertically, and the
   * effect ran on mount, when the rail sits below a full-height hero. So every
   * page load glided the window down to the menu: the "page starts halfway
   * down" bug on mobile.
   *
   * Now the offset is computed from the two rects and applied with
   * `track.scrollBy`, which can only ever move the track. `scrollBy` with a
   * physical `left` is correct in RTL too (negative means leftwards in both
   * directions — see `nudge` below).
   *
   * It also skips the first run. On mount the selection is "all", the first
   * tile, already at the start of the track; there is nothing to centre, and a
   * layout read during hydration buys nothing.
   */
  const previousActive = useRef<string | null>(null);
  useEffect(() => {
    const isFirstRun = previousActive.current === null;
    const changed = previousActive.current !== active;
    previousActive.current = active;
    if (isFirstRun || !changed) return;

    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>(
      `[data-tile="${CSS.escape(active)}"]`
    );
    if (!card) return;

    const t = track.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    const offset = c.left + c.width / 2 - (t.left + t.width / 2);
    if (Math.abs(offset) < 2) return;

    track.scrollBy({ left: offset, behavior: reduced ? "auto" : "smooth" });
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
        className="no-scrollbar flex snap-x snap-proximity items-center gap-2.5 overflow-x-auto scroll-smooth px-1 pb-3 pt-2"
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
          ? "left-0 bg-gradient-to-r from-sand-100 to-transparent"
          : "right-0 bg-gradient-to-l from-sand-100 to-transparent",
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
        "glass text-espresso",
        "transition-[transform,color] duration-200 hover:scale-110 hover:text-gold-800 active:scale-90 sm:flex",
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
  const coarse = useCoarsePointer();

  return (
    <motion.button
      type="button"
      role="tab"
      data-tile={tile.id}
      aria-selected={isActive}
      aria-label={t.a11y.selectCategory(tile.label)}
      onClick={() => onSelect(tile.id)}
      // Entrance staggers in; scale and lift are then driven by state, so the
      // selected tile springs up rather than easing. The stagger is capped so
      // the last tile in a long menu does not arrive half a second late.
      initial={{ opacity: 0, y: 12, scale: 0.94 }}
      animate={{
        opacity: 1,
        y: 0,
        // A pill is a small target, so the selected one grows a little rather
        // than lifting — a lift on a 40px-tall shape is barely legible.
        scale: isActive ? 1.05 : 1,
      }}
      whileHover={isActive || coarse ? undefined : { y: -3, scale: 1.03 }}
      whileTap={{ scale: 0.94 }}
      transition={{
        ...SPRING_POP,
        delay: Math.min(index * 0.028, 0.34),
      }}
      className={cn(
        // No `will-change` here: it promotes every pill to its own layer for
        // the life of the page, and fifteen permanent layers is memory a phone
        // would rather spend on the menu. Framer promotes on demand while an
        // animation is actually running.
        "group relative flex shrink-0 snap-start cursor-pointer items-center gap-2.5 rounded-full py-1.5 pe-4 ps-1.5 text-start outline-none",
        // Selected pill sits above its neighbours so its ring is never clipped
        // by the pill that follows it in the track.
        isActive ? "btn-espresso z-10" : "border border-sand-300 bg-sand-50 shadow-card"
      )}
      style={accentStyle(tile.id)}
    >
      {/* Thumbnail, inset in the pill. Rounded to a circle so the pill reads as
          one shape rather than a square photo with a border stuck to it. */}
      <span className="relative block size-9 shrink-0 overflow-hidden rounded-full">
        {tile.image ? (
          <ItemImage
            as="span"
            src={tile.image}
            alt=""
            icon={tile.icon}
            className="size-full"
            iconClassName="size-4"
            sizes="36px"
          />
        ) : (
          <span
            className={cn(
              "flex size-full items-center justify-center",
              isActive ? "bg-sand-50/15 text-sand-50" : "bg-sand-200 text-espresso"
            )}
          >
            <LayoutGrid aria-hidden className="size-4" strokeWidth={2} />
          </span>
        )}
      </span>

      <span
        className={cn(
          "whitespace-nowrap text-sm font-extrabold transition-colors duration-200",
          isActive ? "text-sand-50" : "text-espresso"
        )}
      >
        {tile.label}
      </span>

      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 font-en text-[10px] font-extrabold num",
          isActive
            ? "bg-gold-500 text-espresso"
            : "bg-sand-200 text-muted ring-1 ring-sand-300"
        )}
      >
        {tile.count}
      </span>

      {/* Neon underline on the selected pill — the one place the Gen Z accent
          survives into the warm palette, per the brief. */}
      {isActive && (
        <motion.span
          aria-hidden
          layoutId="category-rail-active"
          transition={SPRING_TRAVEL}
          className="pointer-events-none absolute inset-x-4 -bottom-1 h-1 rounded-full bg-gold-500"
        />
      )}
    </motion.button>
  );
}

/** Memoised: typing in the search box must not re-render fifteen photo cards. */
const RailCard = memo(RailCardImpl);
RailCard.displayName = "RailCard";

export const CategoryRail = memo(CategoryRailImpl);
CategoryRail.displayName = "CategoryRail";
