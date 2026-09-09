"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ItemImage } from "./ItemImage";
import { useSmallScreen } from "./Motion";

/* ============================================================================
   CURSOR / TOUCH IMAGE TRAIL

   Menu photographs bloom in under the pointer as it crosses the hero, tilt
   slightly, and fade away.

   ---------------------------------------------------------------------------
   POSITIONING — read this before changing the render block

   The offset lives in Framer's own `x` / `y` motion values, NOT in a CSS
   `transform` string. A `motion.div` that animates scale or rotate takes
   ownership of the element's `transform` property and rewrites it from its own
   values every frame. An inline `style={{ transform: translate3d(...) }}` sat
   next to `animate={{ scale }}` is therefore silently discarded, and every
   photo lands at translate(0,0) — the top-left corner of this layer. That was
   a real shipped bug, not a hypothetical.

   `x` / `y` compose into the same transform Framer is already writing, so the
   result stays compositor-only (no layout) AND actually moves.

   ---------------------------------------------------------------------------
   INPUT

   Mouse arrives as `pointermove`. Touch is handled through `touchstart` /
   `touchmove` instead, for one specific reason: as soon as the browser decides
   a touch is a scroll gesture it fires `pointercancel` and stops sending
   pointer moves — so a pointer-only implementation goes dead exactly when the
   finger is moving most. `touchmove` keeps reporting throughout.

   `pointermove` ignores `pointerType === "touch"`, so a touch device cannot
   spawn twice from the two listener families.

   Everything is registered `{ passive: true }`. Nothing here calls
   preventDefault, and declaring that lets the compositor scroll without first
   waiting to find out.
   ========================================================================== */

/** Pointer travel between photos. Roughly one card width. */
const PLACE_EVERY = 130;
/** Wider on touch: fewer spawns per swipe, so scrolling keeps its frames. */
const PLACE_EVERY_TOUCH = 190;

/** Concurrent photos. Beyond ~5 the trail reads as clutter, not motion. */
const MAX = 5;
const MAX_TOUCH = 3;

/** How long after movement stops before the trail clears itself. */
const IDLE_MS = 700;
const IDLE_MS_TOUCH = 500;

interface TrailItem {
  id: number;
  x: number;
  y: number;
  src: string;
  rotate: number;
}

export function CursorTrail({
  images,
  hostRef,
  className,
}: {
  /** Photo URLs, cycled in order. */
  images: string[];
  /** Element whose pointer movement drives the trail — normally the section. */
  hostRef: React.RefObject<HTMLElement | null>;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const small = useSmallScreen();
  const layerRef = useRef<HTMLDivElement>(null);
  const [trail, setTrail] = useState<TrailItem[]>([]);

  const placeEvery = small ? PLACE_EVERY_TOUCH : PLACE_EVERY;
  const max = small ? MAX_TOUCH : MAX;
  const idleMs = small ? IDLE_MS_TOUCH : IDLE_MS;

  // Mutable bookkeeping. Deliberately refs: these update on every pointer
  // event and must never trigger a render of their own.
  const last = useRef({ x: 0, y: 0, index: 0, id: 0 });
  const idleTimer = useRef<number | undefined>(undefined);
  const frame = useRef<number | undefined>(undefined);
  const pending = useRef<TrailItem | null>(null);

  /**
   * Clears the trail and cancels everything that could refill it.
   *
   * Dropping the queued frame and the pending item is the part that matters:
   * without it a release can be immediately undone by an rAF that was already
   * scheduled, putting one photo back on screen with nothing left to sweep it
   * away. That is precisely the "images get stuck" failure.
   */
  const clearTrail = useCallback(() => {
    window.clearTimeout(idleTimer.current);
    idleTimer.current = undefined;
    if (frame.current !== undefined) {
      cancelAnimationFrame(frame.current);
      frame.current = undefined;
    }
    pending.current = null;
    setTrail([]);
  }, []);

  // Release every timer and frame on unmount, so nothing fires into a
  // torn-down tree.
  useEffect(
    () => () => {
      window.clearTimeout(idleTimer.current);
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    },
    []
  );

  /**
   * Commits at most one state update per animation frame.
   *
   * Both pointermove and touchmove fire far faster than the display refreshes;
   * calling setState straight from the handler queued a React render per
   * event. Coalescing through rAF caps it at one render per painted frame
   * however chatty the input is.
   */
  const flush = useCallback(() => {
    frame.current = undefined;
    const item = pending.current;
    if (!item) return;
    pending.current = null;
    setTrail((current) => [...current.slice(-(max - 1)), item]);
  }, [max]);

  /**
   * Spawns a photo at a VIEWPORT coordinate.
   *
   * `force` bypasses the distance gate, so a tap always puts one photo under
   * the finger even though it has travelled no distance at all.
   */
  const place = useCallback(
    (clientX: number, clientY: number, force = false) => {
      if (reduce || images.length === 0) return;
      const layer = layerRef.current;
      if (!layer) return;

      // Converted into this layer's own coordinate space, so the photo lands
      // under the finger regardless of where the hero has scrolled to.
      const rect = layer.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const prev = last.current;
      if (!force && Math.hypot(x - prev.x, y - prev.y) < placeEvery) return;

      const id = prev.id + 1;
      const index = prev.index + 1;
      last.current = { x, y, index, id };

      pending.current = {
        id,
        x,
        y,
        src: images[index % images.length],
        // A little tilt each way stops the trail looking like a slideshow
        // playing in one frame. Derived from the id so it is stable for the
        // life of the photo rather than re-rolling on every render.
        rotate: ((id * 37) % 17) - 8,
      };
      if (frame.current === undefined) {
        frame.current = requestAnimationFrame(flush);
      }

      window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(clearTrail, idleMs);
    },
    [reduce, images, placeEvery, idleMs, flush, clearTrail]
  );

  /**
   * Latest `place`, read through a ref.
   *
   * `place` is rebuilt whenever the photo list or the mobile budget changes. If
   * the effect below depended on it, each change would detach and reattach six
   * listeners on the hero. This keeps attachment to exactly once per mount.
   */
  const placeRef = useRef(place);
  useEffect(() => {
    placeRef.current = place;
  }, [place]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || reduce) return;

    const opts: AddEventListenerOptions = { passive: true };

    // Mouse only — touch is served by the touch listeners below.
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      placeRef.current(e.clientX, e.clientY);
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      // `force`: a tap has travelled no distance, but the whole point is that
      // touching the screen puts a photo under the finger.
      if (t) placeRef.current(t.clientX, t.clientY, true);
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) placeRef.current(t.clientX, t.clientY);
    };

    const clear = () => clearTrail();

    host.addEventListener("pointermove", onPointerMove, opts);
    host.addEventListener("pointerleave", clear, opts);
    host.addEventListener("touchstart", onTouchStart, opts);
    host.addEventListener("touchmove", onTouchMove, opts);
    // Touch has no "leave" — a finger lifts. Both endings clear immediately, so
    // nothing is left stranded on screen.
    host.addEventListener("touchend", clear, opts);
    host.addEventListener("touchcancel", clear, opts);

    return () => {
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", clear);
      host.removeEventListener("touchstart", onTouchStart);
      host.removeEventListener("touchmove", onTouchMove);
      host.removeEventListener("touchend", clear);
      host.removeEventListener("touchcancel", clear);
    };
  }, [hostRef, reduce, clearTrail]);

  return (
    // `overflow-hidden` belongs here rather than being inherited: it guarantees
    // a photo spawned near an edge is clipped to the hero and can never spill
    // over the header, whatever the section's own overflow later becomes.
    // No background of any kind — this layer is purely a positioning context.
    <div
      ref={layerRef}
      aria-hidden
      className={`overflow-hidden bg-transparent ${className ?? ""}`}
    >
      <AnimatePresence>
        {trail.map((item) => (
          <motion.div
            key={item.id}
            // x / y are Framer motion values, NOT a CSS transform string — see
            // the POSITIONING note at the top of this file. They compose into
            // the transform Framer already writes for scale and rotate, so the
            // photo both lands in the right place and stays off the layout path.
            style={{ x: item.x, y: item.y }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1, rotate: item.rotate }}
            exit={{ opacity: 0, scale: 0.86, transition: { duration: 0.35 } }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            // Negative margins centre the photo on the pointer (half of each
            // dimension); left/top stay at 0 so x/y alone decide position.
            // PHYSICAL `-ml-`, not logical `-ms-`: this site renders RTL by
            // default, where a logical inline-start margin pushes the photo the
            // opposite way and the trail trails off to the wrong side.
            className="pointer-events-none absolute left-0 top-0 -ml-12 -mt-16 h-32 w-24 sm:-ml-20 sm:-mt-24 sm:h-48 sm:w-40"
          >
            <ItemImage
              src={item.src}
              alt=""
              icon="coffee"
              sizes="(max-width: 767px) 96px, 160px"
              className="size-full rounded-3xl shadow-float ring-1 ring-sand-300"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
