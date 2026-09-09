"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ItemImage } from "./ItemImage";

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

   4. Pointer-gated. `(pointer: fine)` only — a touch device has no hover
      position to follow, and the effect would fire on every scroll-drag.
      Also disabled outright under prefers-reduced-motion.

   The move listener is attached to the SECTION passed in as `hostRef`, not to
   this component's own box. React pointer events only fire on the topmost
   element under the cursor, so listening on our own layer would go dead the
   moment the pointer crossed the headline or a button sitting above it —
   leaving a hole through the middle of the hero. A listener on the section
   catches the same events on the way up instead.
   ========================================================================== */

/** Pointer travel between photos. Roughly one card width. */
const PLACE_EVERY = 130;

/** Concurrent photos. Beyond ~5 the trail reads as clutter, not motion. */
const MAX = 5;

/** How long after the pointer stops before the trail clears. */
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
  className,
}: {
  /** Photo URLs, cycled in order. */
  images: string[];
  /** Element whose pointer movement drives the trail — normally the section. */
  hostRef: React.RefObject<HTMLElement | null>;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const layerRef = useRef<HTMLDivElement>(null);
  const [trail, setTrail] = useState<TrailItem[]>([]);
  const [enabled, setEnabled] = useState(false);

  // Mutable cursor bookkeeping. Deliberately a ref: this updates on every
  // pointer event and must never trigger a render of its own.
  const last = useRef({ x: 0, y: 0, index: 0, id: 0 });
  const idleTimer = useRef<number | undefined>(undefined);

  // Hover-capable pointers only, decided after mount so SSR and the client
  // agree on the first paint.
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const apply = () => setEnabled(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => () => window.clearTimeout(idleTimer.current), []);

  const handleMove = useCallback(
    (e: PointerEvent) => {
      if (!enabled || reduce || images.length === 0) return;
      const layer = layerRef.current;
      if (!layer) return;

      const rect = layer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const prev = last.current;
      if (Math.hypot(x - prev.x, y - prev.y) < PLACE_EVERY) return;

      const id = prev.id + 1;
      const index = prev.index + 1;
      last.current = { x, y, index, id };

      setTrail((current) => [
        ...current.slice(-(MAX - 1)),
        {
          id,
          x,
          y,
          src: images[index % images.length],
          // A little tilt each way stops the trail looking like a slideshow
          // playing in one frame. Derived from the id so it is stable for the
          // life of the photo rather than re-rolling on every render.
          rotate: ((id * 37) % 17) - 8,
        },
      ]);

      window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => setTrail([]), IDLE_MS);
    },
    [enabled, reduce, images]
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !enabled || reduce) return;
    const clear = () => setTrail([]);
    host.addEventListener("pointermove", handleMove);
    host.addEventListener("pointerleave", clear);
    return () => {
      host.removeEventListener("pointermove", handleMove);
      host.removeEventListener("pointerleave", clear);
    };
  }, [hostRef, handleMove, enabled, reduce]);

  return (
    <div ref={layerRef} aria-hidden className={className}>
      {/* Purely decorative, and it sits over the hero's buttons — so it must
          never intercept a click. */}
      <AnimatePresence>
        {trail.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.7, rotate: 0 }}
            animate={{ opacity: 1, scale: 1, rotate: item.rotate }}
            exit={{ opacity: 0, scale: 0.86, transition: { duration: 0.45 } }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            style={{ left: item.x, top: item.y }}
            className="pointer-events-none absolute -ms-20 -mt-24 h-40 w-32 sm:-ms-24 sm:-mt-28 sm:h-48 sm:w-40"
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
