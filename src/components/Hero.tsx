"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowDown, MapPin, Phone, UtensilsCrossed, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { STORE } from "@/lib/dictionary";
import { MagneticButton, AmbientShapes } from "./ui/Motion";
import { CursorTrail } from "./ui/CursorTrail";
import { Logo } from "./ui/Logo";

/** Decorative marquee wording — independent of the live menu data. */
const MARQUEE_WORDS = [
  { ar: "قهوة مختصة", en: "Specialty Coffee" },
  { ar: "وافل طازج", en: "Fresh Waffles" },
  { ar: "بان كيك", en: "Pancakes" },
  { ar: "عصائر فريش", en: "Fresh Juices" },
  { ar: "موهيتو", en: "Mojito" },
  { ar: "ميلك شيك", en: "Milkshakes" },
  { ar: "فريسكا", en: "Freska" },
  { ar: "رز بلبن", en: "Rice Pudding" },
];

export function Hero({
  itemCount,
  categoryCount,
  photos = [],
}: {
  itemCount: number;
  categoryCount: number;
  /** Menu photography for the cursor trail. */
  photos?: string[];
}) {
  const { t, lang, isRTL } = useI18n();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 140]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  // Per-word entrance for the headline
  const words = [t.hero.titleLine1, t.hero.titleLine2];

  const stats = [
    { value: itemCount, label: t.hero.statItems },
    { value: categoryCount, label: t.hero.statCategories },
    { value: "100%", label: t.hero.statFresh },
  ];

  return (
    <section
      ref={ref}
      id="home"
      className="relative isolate flex min-h-dvh scroll-mt-28 flex-col justify-center overflow-hidden pb-20 pt-28 sm:pt-32"
    >
      {/* Cursor trail. Sits above the ambience and below the content, so the
          photos pass behind the headline rather than over it, and z-0 keeps it
          under the z-10 content layer that owns the buttons. */}
      {/* Ambient background */}
      <AmbientShapes dense />
      <div aria-hidden className="ambient-grid pointer-events-none absolute inset-0 opacity-45 mask-fade-b" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-96 bg-[radial-gradient(60%_100%_at_50%_0%,rgb(202_138_4/0.14),transparent_70%)]"
      />

      {/* Cursor trail. Painted above the ambience but below the z-10 content
          layer, so photos pass behind the headline instead of over it. */}
      <CursorTrail
        images={photos}
        hostRef={ref}
        className="pointer-events-none absolute inset-0 z-0"
      />

      <motion.div style={{ y, opacity }} className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Floating est badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative mb-7"
          >
            <motion.div
              animate={reduce ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Logo size={104} className="drop-shadow-[0_14px_36px_rgba(60,50,40,0.22)]" />
            </motion.div>

            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, type: "spring", stiffness: 300, damping: 16 }}
              className="absolute -bottom-3.5 start-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-gold-500/40 bg-sand-100 px-3.5 py-1 font-en text-[11px] font-extrabold uppercase tracking-[0.16em] text-gold-800 shadow-glow rtl:translate-x-1/2"
            >
              {t.hero.badge}
            </motion.span>
          </motion.div>

          {/* Location chip */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.55 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-sand-400 bg-sand-100/70 px-4 py-2 text-xs font-semibold text-muted sm:backdrop-blur-sm sm:text-sm"
          >
            <MapPin aria-hidden className="size-4 text-gold-800" />
            {t.hero.location}
          </motion.div>

          {/* Headline */}
          <h1 className="font-en text-balance text-[clamp(2.5rem,9vw,6.5rem)] font-extrabold leading-[0.95] tracking-tight">
            {words.map((word, wi) => (
              <span key={wi} className="block overflow-hidden py-0.5">
                <motion.span
                  className={wi === 1 ? "inline-block text-gradient-gold" : "inline-block text-espresso"}
                  initial={{ y: "110%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  transition={{
                    delay: 0.2 + wi * 0.12,
                    duration: 0.8,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>

          {/* Subtitle — capped for line-length readability */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted sm:text-lg"
          >
            {t.hero.subtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.62, duration: 0.6 }}
            className="mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row"
          >
            <MagneticButton
              href="#menu"
              className="group flex min-h-13 w-full items-center justify-center gap-2.5 rounded-full btn-espresso px-7 text-base font-extrabold transition-colors duration-200 hover:brightness-125 sm:w-auto"
            >
              <UtensilsCrossed aria-hidden className="size-5" />
              {t.hero.ctaMenu}
            </MagneticButton>

            <MagneticButton
              href={STORE.phoneHref}
              className="flex min-h-13 w-full items-center justify-center gap-2.5 rounded-2xl border border-sand-400 bg-sand-100/60 px-7 text-base font-bold text-espresso sm:backdrop-blur-sm transition-colors duration-200 hover:border-gold-500/60 hover:text-gold-800 sm:w-auto"
            >
              <Phone aria-hidden className="size-5" />
              {t.hero.ctaCall}
            </MagneticButton>
          </motion.div>

          {/* Stats */}
          <motion.dl
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.78, duration: 0.6 }}
            className="mt-14 grid w-full max-w-2xl grid-cols-3 divide-x divide-sand-300 rounded-2xl border border-sand-300 bg-sand-100/50 py-5 sm:backdrop-blur-sm rtl:divide-x-reverse"
          >
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 px-2">
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-en text-2xl font-extrabold text-gold-800 num sm:text-3xl">
                  {s.value}
                </dd>
                <span aria-hidden className="text-[11px] font-semibold leading-tight text-muted sm:text-xs">
                  {s.label}
                </span>
              </div>
            ))}
          </motion.dl>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.a
        href="#about"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        className="absolute inset-x-0 bottom-6 z-10 mx-auto flex w-fit cursor-pointer flex-col items-center justify-center gap-1.5 px-4 py-1.5 text-[11px] font-semibold text-muted-dim transition-colors duration-200 hover:text-gold-800"
      >
        <span>{t.hero.scroll}</span>
        <motion.span
          animate={reduce ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown aria-hidden className="size-4" />
        </motion.span>
      </motion.a>

      {/* Decorative marquee strip */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 inset-x-0 z-0 overflow-hidden border-y border-gold-500/15 bg-gold-500/[0.04] py-2.5"
      >
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, dup) => (
            <div key={dup} className="flex gap-8">
              {MARQUEE_WORDS.map((w, wi) => (
                <span
                  key={`${dup}-${wi}`}
                  className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-800/45"
                >
                  <Sparkles className="size-3" />
                  {lang === "ar" ? w.ar : w.en}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Keeps RTL/LTR aware of direction for future logical tweaks */}
      <span className="sr-only">{isRTL ? "rtl" : "ltr"}</span>
    </section>
  );
}
