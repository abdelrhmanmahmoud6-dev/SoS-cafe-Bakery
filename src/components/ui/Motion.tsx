"use client";

import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  type Variants,
} from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type MouseEvent,
  type Ref,
} from "react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Shared variants                                                           */
/* -------------------------------------------------------------------------- */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Parent container that staggers its children on scroll-in. */
export function staggerContainer(stagger = 0.08, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: {
      transition: { staggerChildren: stagger, delayChildren },
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  useScrollReveal                                                           */
/*                                                                            */
/*  Framer's `whileInView` proved unreliable on this page: in a very tall      */
/*  document (~27,000px) a number of sections never received an intersection   */
/*  callback and stayed permanently at opacity 0. This hook owns the observer  */
/*  directly and, critically, does a synchronous geometry check on mount so an */
/*  element that is ALREADY on screen (first paint, a restored scroll offset,  */
/*  or an anchor jump) reveals immediately instead of waiting for a callback   */
/*  that may never arrive.                                                     */
/* -------------------------------------------------------------------------- */

function useScrollReveal({
  once = true,
  rootMargin = "-70px 0px -70px 0px",
}: { once?: boolean; rootMargin?: string } = {}) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Already visible right now? Reveal without waiting on the observer.
    const rect = el.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (alreadyVisible) {
      setInView(true);
      if (once) return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { rootMargin, threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, rootMargin]);

  return { ref, inView };
}

/* -------------------------------------------------------------------------- */
/*  Reveal — scroll-triggered entrance                                        */
/* -------------------------------------------------------------------------- */

export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  once = true,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  as?: "div" | "section" | "li" | "article" | "header" | "footer";
}) {
  const reduce = useReducedMotion();
  const { ref, inView } = useScrollReveal({ once });
  const MotionTag = motion[Tag] as typeof motion.div;

  // Reduced motion: render final state, no travel.
  const show = reduce || inView;

  return (
    <MotionTag
      ref={ref as Ref<HTMLDivElement>}
      data-reveal
      className={className}
      initial={false}
      animate={{ opacity: show ? 1 : 0, y: show ? 0 : y }}
      transition={
        reduce
          ? { duration: 0 }
          : { duration: 0.62, delay: show ? delay : 0, ease: [0.22, 1, 0.36, 1] }
      }
    >
      {children}
    </MotionTag>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stagger group                                                             */
/* -------------------------------------------------------------------------- */

export function StaggerGroup({
  children,
  className,
  stagger = 0.08,
  delayChildren = 0,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  const { ref, inView } = useScrollReveal({ once, rootMargin: "-60px 0px -60px 0px" });
  const show = reduce || inView;

  return (
    <motion.div
      ref={ref as Ref<HTMLDivElement>}
      data-reveal
      className={className}
      variants={staggerContainer(reduce ? 0 : stagger, reduce ? 0 : delayChildren)}
      initial="hidden"
      animate={show ? "show" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} variants={reduce ? fadeIn : fadeUp}>
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  MagneticButton — cursor-following CTA                                     */
/* -------------------------------------------------------------------------- */

interface MagneticProps {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  strength?: number;
  ariaLabel?: string;
  target?: string;
  rel?: string;
  type?: "button" | "submit";
}

export function MagneticButton({
  children,
  className,
  href,
  onClick,
  strength = 0.32,
  ariaLabel,
  target,
  rel,
  type = "button",
}: MagneticProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 260, damping: 20, mass: 0.5 });
  const sy = useSpring(my, { stiffness: 260, damping: 20, mass: 0.5 });

  function handleMove(e: MouseEvent<HTMLElement>) {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mx.set((e.clientX - (rect.left + rect.width / 2)) * strength);
    my.set((e.clientY - (rect.top + rect.height / 2)) * strength);
  }

  function reset() {
    mx.set(0);
    my.set(0);
  }

  const shared = {
    className: cn("cursor-pointer select-none", className),
    style: { x: sx, y: sy },
    onMouseMove: handleMove,
    onMouseLeave: reset,
    whileTap: { scale: 0.96 },
    "aria-label": ariaLabel,
  };

  if (href) {
    return (
      <motion.a
        {...shared}
        ref={ref as Ref<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={rel}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      {...shared}
      ref={ref as Ref<HTMLButtonElement>}
      type={type}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}

/* -------------------------------------------------------------------------- */
/*  AmbientShapes — floating background blobs                                 */
/* -------------------------------------------------------------------------- */

export function AmbientShapes({ dense = false }: { dense?: boolean }) {
  const reduce = useReducedMotion();

  const blobs = dense
    ? [
        // Four hues, not four tints of one: the drifting colour behind the
        // page is where the palette gets introduced before any UI states it.
        { x: "8%", y: "12%", s: 340, c: "rgb(223 255 60 / 0.15)", d: 0 },
        { x: "78%", y: "8%", s: 280, c: "rgb(185 167 255 / 0.16)", d: 1.4 },
        { x: "62%", y: "62%", s: 400, c: "rgb(255 174 143 / 0.12)", d: 2.6 },
        { x: "16%", y: "72%", s: 250, c: "rgb(94 234 212 / 0.11)", d: 3.4 },
      ]
    : [
        { x: "12%", y: "18%", s: 300, c: "rgb(223 255 60 / 0.10)", d: 0 },
        { x: "80%", y: "60%", s: 340, c: "rgb(185 167 255 / 0.10)", d: 2 },
      ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            left: b.x,
            top: b.y,
            width: b.s,
            height: b.s,
            background: `radial-gradient(circle at 30% 30%, ${b.c}, transparent 70%)`,
          }}
          animate={
            reduce
              ? undefined
              : { y: [0, -26, 0], x: [0, 14, 0], scale: [1, 1.07, 1] }
          }
          transition={{
            duration: 11 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: b.d,
          }}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  SectionHeading                                                            */
/* -------------------------------------------------------------------------- */

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "start";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-start"
      )}
    >
      <Reveal>
        <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/25 bg-gold-500/8 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-gold-500">
          <span className="size-1.5 rounded-full bg-gold-500" />
          {eyebrow}
        </span>
      </Reveal>

      <Reveal delay={0.08}>
        <h2 className="text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          {title}
        </h2>
      </Reveal>

      {subtitle && (
        <Reveal delay={0.16}>
          {/* Text column capped for readability (65-75ch guideline) */}
          <p
            className={cn(
              "max-w-2xl text-base leading-relaxed text-muted sm:text-lg",
              align === "center" && "mx-auto"
            )}
          >
            {subtitle}
          </p>
        </Reveal>
      )}
    </div>
  );
}
