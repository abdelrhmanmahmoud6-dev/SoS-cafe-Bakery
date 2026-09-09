"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ItemImage } from "./ItemImage";
import { useSmallScreen } from "./Motion";

/* ============================================================================
   CURSOR IMAGE TRAIL

   Menu photographs bloom in behind the cursor as it crosses the hero, tilt
   slightly, and fade away — the interaction boutique cafe sites use to show
   the food without giving it a slot in the layout.

   Four decisions worth knowing:

   1. Distance-gated, not time-gated. A new photo is dropped only once the
      pointer has travelled PLACE_EVERY px since the last one. Emitting on a
      timer instead makes a slow, careful movement spray a stack of images into
      one spot, and a fast flick leave a gap.

   2. Self-limiting pool. The list is sliced to MAX entries, so a new photo
      arriving pushes the oldest out and AnimatePresence plays its exit. The
      DOM never holds more than MAX + 1 images however long someone scribbles.

   3. Idle sweep. Slicing alone leaves the final MAX photos frozen on screen
      when the pointer stops, so a timer clears the trail after IDLE_MS.

   4. Touch and mouse both drive it. An earlier version gated on
      `(pointer: fine)`, which meant the effect simply did not exist on a
      phone. Touch is now a first-class input, on a smaller budget: a wider
      spawn distance, a pool of 3 instead of 5, and smaller photos — on touch
      the movement driving this is usually also a scroll, so the frame budget
      is already spoken for.

      Listeners are registered `{ passive: true }`. This handler never calls
      preventDefault, and declaring that up front lets the browser begin
      scrolling without first waiting to see whether we will — the difference
      between a scroll that tracks the finger and one that stutters.

   The move listener is attached to the SECTION passed in as `hostRef`, not to
   this component's own box. React pointer events only fire on the topmost
   element under the cursor, so listening on our own layer would go dead the
   moment the pointer crossed the headline or a button sitting above it —
   leaving a hole through the middle of the hero. A listener on the section
   catches the same events on the way up instead.
   ========================================================================== */

/** Pointer travel between photos. Roughly one card width. */
const PLACE_EVERY = 130;
/** Wider on touch: fewer spawns per swipe, so scrolling keeps its frames. */
const PLACE_EVERY_TOUCH = 190;

/** Concurrent photos. Beyond ~5 the trail reads as clutter, not motion. */
const MAX = 5;
const MAX_TOUCH = 3;

/** How long after the pointer stops before the trail clears. */
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

  // Mutable pointer bookkeeping. Deliberately refs: these update on every
  // pointer event and must never trigger a render of their own.
  const last = useRef({ x: 0, y: 0, index: 0, id: 0 });
  const idleTimer = useRef<number | undefined>(undefined);
  const frame = useRef<number | undefined>(undefined);
  const pending = useRef<TrailItem | null>(null);

  // Every timer and frame this component owns is released on unmount. Without
  // this a queued rAF or idle timeout can fire after teardown and set state on
  // an unmounted tree.
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
   * A finger dragging across the screen fires pointermove far faster than the
   * display refreshes. Calling setState straight from the handler queued a
   * React render per event, which is the difference between a trail that
   * glides and one that fights the scroll. Coalescing through rAF caps the
   * work at one render per painted frame however chatty the input is.
   */
  const flush = useCallback(() => {
    frame.current = undefined;
    const item = pending.current;
    if (!item) return;
    pending.current = null;
    setTrail((current) => [...current.slice(-(max - 1)), item]);
  }, [max]);

  const handleMove = useCallback(
    (e: PointerEvent) => {
      if (reduce || images.length === 0) return;
      const layer = layerRef.current;
      if (!layer) return;

      const rect = layer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const prev = last.current;
      if (Math.hypot(x - prev.x, y - prev.y) < placeEvery) return;

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
      idleTimer.current = window.setTimeout(() => setTrail([]), idleMs);
    },
    [reduce, images, placeEvery, idleMs, flush]
  );

  /**
   * Latest handler, read through a ref.
   *
   * `handleMove` is rebuilt whenever its inputs change (the photo list, the
   * mobile budget). If the effect below depended on it directly, every one of
   * those changes would detach and reattach four listeners on the hero. Keeping
   * the identity stable means listeners are attached ONCE per mount and torn
   * down once — no churn, and no window in which a moving finger is briefly
   * unobserved.
   */
  const moveRef = useRef(handleMove);
  useEffect(() => {
    moveRef.current = handleMove;
  }, [handleMove]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || reduce) return;

    const onMove = (e: PointerEvent) => moveRef.current(e);
    const clear = () => setTrail([]);
    // Passive: this handler never calls preventDefault, and declaring that
    // lets the compositor scroll without waiting on us.
    const opts: AddEventListenerOptions = { passive: true };

    host.addEventListener("pointermove", onMove, opts);
    host.addEventListener("pointerleave", clear, opts);
    // Touch has no "leave" — a finger lifts instead. Without these the last
    // photos would hang on screen until the idle timer happened to fire.
    host.addEventListener("pointercancel", clear, opts);
    host.addEventListener("pointerup", clear, opts);

    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", clear);
      host.removeEventListener("pointercancel", clear);
      host.removeEventListener("pointerup", clear);
    };
  }, [hostRef, reduce]);

  return (
    <div ref={layerRef} aria-hidden className={className}>
      {/* Purely decorative, and it sits over the hero's buttons — so it must
          never intercept a click. */}
      <AnimatePresence>
        {trail.map((item) => (
          <motion.div
            key={item.id}
            // Only opacity, scale and rotate animate — all composited. The
            // translate lives in `style` and never changes for the life of the
            // photo, so nothing here can trigger layout.
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1, rotate: item.rotate }}
            exit={{ opacity: 0, scale: 0.86, transition: { duration: 0.4 } }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            // Positioned with a transform rather than left/top: offsets are
            // layout properties, so inserting with them makes the browser
            // reflow on a frame it should only have to composite.
            style={{
              transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
            }}
            className="pointer-events-none absolute left-0 top-0 -ms-16 -mt-20 h-32 w-24 sm:-ms-24 sm:-mt-28 sm:h-48 sm:w-40"
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
