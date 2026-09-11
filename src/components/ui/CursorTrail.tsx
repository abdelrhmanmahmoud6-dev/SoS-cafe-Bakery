"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ItemImage } from "./ItemImage";
import { useTrailEnabled } from "./Motion";

/* ============================================================================
   CURSOR IMAGE TRAIL — MOUSE ONLY

   Menu photographs bloom in under the mouse as it crosses the hero, tilt
   slightly, and fade away.

   ---------------------------------------------------------------------------
   WHO GETS THIS

   Only a device with a real cursor: a wide viewport AND a fine, hover-capable
   pointer (see `useTrailEnabled`). Everything else — every phone, every tablet,
   in either orientation — never mounts this component. It returns null before
   rendering a node, and its listener effect bails before attaching anything.

   There is deliberately no touch code in this file. An earlier version handled
   touchstart/touchmove as well, and gating it by viewport width alone let a
   phone rotated to landscape (often 800-930px wide) mount it with those
   listeners live. With no touch handlers present at all, "never attaches a
   touch listener" is a property of the source, not of a runtime check that has
   to be right on every device.

   ---------------------------------------------------------------------------
   POSITIONING — read this before changing the render block

   The offset lives in Framer's own `x` / `y` motion values, NOT a CSS
   `transform` string. A `motion.div` that animates scale or rotate owns the
   element's `transform` and rewrites it every frame, so an inline
   `translate3d(...)` beside `animate={{ scale }}` is silently discarded and
   every photo lands at translate(0,0). That shipped once.

   The layer is `fixed inset-0`, so viewport coordinates ARE layer coordinates
   and `clientX`/`clientY` are used directly — no getBoundingClientRect() on the
   spawn path. It sits at z-40: below the header (z-50) and every overlay.
   ========================================================================== */

/** Pointer travel between photos. Roughly one card width. */
const PLACE_EVERY = 130;

/** Concurrent photos. Beyond ~5 the trail reads as clutter, not motion. */
const MAX = 5;

/** How long after the mouse stops before the trail clears itself. */
const IDLE_MS = 700;

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
}: {
  /** Photo URLs, cycled in order. */
  images: string[];
  /** Element whose mouse movement drives the trail — normally the hero. */
  hostRef: React.RefObject<HTMLElement | null>;
}) {
  const reduce = useReducedMotion();
  // Independent of the gate in Hero, so this component refuses to run on a
  // touch device even if it is ever mounted from somewhere else.
  const enabled = useTrailEnabled();
  const [trail, setTrail] = useState<TrailItem[]>([]);

  // Mutable bookkeeping. Refs: these update on every mouse event and must
  // never trigger a render of their own.
  const last = useRef({ x: 0, y: 0, index: 0, id: 0 });
  const idleTimer = useRef<number | undefined>(undefined);
  const frame = useRef<number | undefined>(undefined);
  const pending = useRef<TrailItem | null>(null);

  /**
   * Clears the trail AND cancels anything that could refill it. Dropping the
   * queued frame matters: otherwise an rAF already scheduled can put one photo
   * back after the clear, with nothing left to sweep it away.
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

  // Release every timer and frame on unmount.
  useEffect(
    () => () => {
      window.clearTimeout(idleTimer.current);
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    },
    []
  );

  /** At most one state update per painted frame, however chatty the mouse. */
  const flush = useCallback(() => {
    frame.current = undefined;
    const item = pending.current;
    if (!item) return;
    pending.current = null;
    setTrail((current) => [...current.slice(-(MAX - 1)), item]);
  }, []);

  const place = useCallback(
    (x: number, y: number) => {
      if (reduce || images.length === 0) return;

      const prev = last.current;
      if (Math.hypot(x - prev.x, y - prev.y) < PLACE_EVERY) return;

      const id = prev.id + 1;
      const index = prev.index + 1;
      last.current = { x, y, index, id };

      pending.current = {
        id,
        x,
        y,
        src: images[index % images.length],
        // Stable per photo (derived from the id), so it does not re-roll.
        rotate: ((id * 37) % 17) - 8,
      };
      if (frame.current === undefined) {
        frame.current = requestAnimationFrame(flush);
      }

      window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(clearTrail, IDLE_MS);
    },
    [reduce, images, flush, clearTrail]
  );

  // Latest `place` through a ref, so the listeners attach once per mount rather
  // than being torn down and re-added whenever the photo list changes.
  const placeRef = useRef(place);
  useEffect(() => {
    placeRef.current = place;
  }, [place]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || reduce || !enabled) return;

    const opts: AddEventListenerOptions = { passive: true };
    // Mouse only. A pen or a touch that somehow arrives here is ignored rather
    // than handled, so there is exactly one input path to reason about.
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") placeRef.current(e.clientX, e.clientY);
    };
    const clear = () => clearTrail();

    host.addEventListener("pointermove", onMove, opts);
    host.addEventListener("pointerleave", clear, opts);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", clear);
    };
  }, [hostRef, reduce, enabled, clearTrail]);

  // No layer, no children, no DOM at all unless a mouse is confirmed.
  if (!enabled) return null;

  return (
    <div
      aria-hidden
      data-cursor-trail
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden bg-transparent"
    >
      <AnimatePresence>
        {trail.map((item) => (
          <motion.div
            key={item.id}
            // Framer x/y, not a transform string — see POSITIONING above.
            style={{ x: item.x, y: item.y }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1, rotate: item.rotate }}
            exit={{ opacity: 0, scale: 0.86, transition: { duration: 0.35 } }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            // Negative margins centre the 160x192 photo on the cursor. Physical
            // `-ml-`, not logical `-ms-`: the site is RTL by default, where a
            // logical margin would push the photo the wrong way.
            className="pointer-events-none absolute left-0 top-0 -ml-20 -mt-24 h-48 w-40"
          >
            <ItemImage
              src={item.src}
              alt=""
              icon="coffee"
              sizes="160px"
              className="size-full rounded-3xl shadow-float ring-1 ring-sand-300"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
