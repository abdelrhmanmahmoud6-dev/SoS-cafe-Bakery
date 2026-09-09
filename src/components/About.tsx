"use client";

import { motion } from "framer-motion";
import { Award, BadgeCheck, Layers3, Coffee, Croissant, CupSoda } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { CategoryId } from "@/lib/menu-data";
import { Reveal, SectionHeading, StaggerGroup, StaggerItem, AmbientShapes } from "./ui/Motion";

const VALUE_ICONS = [Award, BadgeCheck, Layers3];
const HIGHLIGHT_ICONS = [Coffee, Croissant, CupSoda];

/** Which menu categories roll up into each highlight card — counts stay live. */
const HIGHLIGHT_GROUPS: CategoryId[][] = [
  ["hot-coffee", "ice-coffee"],
  ["waffle", "pancake", "fattah", "freska"],
  ["juice", "mojito", "smoothie", "milkshake", "mix-sos"],
];

export function About({ counts }: { counts: Record<string, number> }) {
  const { t } = useI18n();

  return (
    <section
      id="about"
      className="relative isolate scroll-mt-28 overflow-hidden py-16 md:py-24"
    >
      <AmbientShapes />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading eyebrow={t.about.eyebrow} title={t.about.title} />

        {/* Story */}
        <div className="mx-auto mt-14 grid max-w-5xl gap-8 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            <p className="text-pretty text-lg font-semibold leading-relaxed text-espresso sm:text-xl">
              {t.about.lead}
            </p>
          </Reveal>

          <Reveal delay={0.1} className="flex flex-col gap-4 lg:col-span-2">
            <p className="text-pretty leading-relaxed text-muted">{t.about.body1}</p>
            <p className="text-pretty leading-relaxed text-muted">{t.about.body2}</p>
          </Reveal>
        </div>

        {/* Values */}
        <div className="mt-20">
          <Reveal>
            <h3 className="mb-8 text-center text-xl font-extrabold tracking-tight text-espresso sm:text-2xl">
              {t.about.valuesTitle}
            </h3>
          </Reveal>

          <StaggerGroup className="grid gap-5 md:grid-cols-3" stagger={0.1}>
            {t.about.values.map((v, i) => {
              const Icon = VALUE_ICONS[i] ?? Award;
              return (
                <StaggerItem key={v.title}>
                  <motion.article
                    whileHover={{ y: -6 }}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    className="group relative h-full overflow-hidden rounded-3xl border border-sand-300 bg-sand-100/70 p-7 sm:backdrop-blur-sm transition-colors duration-300 hover:border-gold-500/40"
                  >
                    {/* micro-glow on hover */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{
                        background:
                          "radial-gradient(400px circle at 50% 0%, rgb(202 138 4 / 0.10), transparent 60%)",
                      }}
                    />

                    <span className="relative flex size-13 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-800 ring-1 ring-gold-500/25 transition-all duration-300 group-hover:bg-gold-500 group-hover:text-espresso">
                      <Icon aria-hidden className="size-6" />
                    </span>

                    <h4 className="relative mt-5 text-lg font-extrabold text-espresso">{v.title}</h4>
                    <p className="relative mt-2.5 leading-relaxed text-muted">{v.desc}</p>

                    <span
                      aria-hidden
                      className="absolute end-6 top-6 font-en text-5xl font-extrabold text-espresso/[0.04] num"
                    >
                      0{i + 1}
                    </span>
                  </motion.article>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>

        {/* Highlights */}
        <div className="mt-20">
          <Reveal>
            <h3 className="mb-8 text-center text-xl font-extrabold tracking-tight text-espresso sm:text-2xl">
              {t.about.highlightsTitle}
            </h3>
          </Reveal>

          <StaggerGroup className="grid gap-5 md:grid-cols-3" stagger={0.1}>
            {t.about.highlights.map((h, i) => {
              const Icon = HIGHLIGHT_ICONS[i] ?? Coffee;
              const count = (HIGHLIGHT_GROUPS[i] ?? []).reduce(
                (sum, cat) => sum + (counts[cat] ?? 0),
                0
              );
              return (
                <StaggerItem key={h.title}>
                  <motion.a
                    href="#menu"
                    whileHover={{ y: -6, scale: 1.015 }}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    className="group flex h-full cursor-pointer flex-col justify-between gap-6 rounded-3xl border border-sand-300 bg-gradient-to-b from-sand-200 to-sand-100 p-7 transition-colors duration-300 hover:border-gold-500/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Icon
                        aria-hidden
                        className="size-8 text-gold-800 transition-transform duration-300 group-hover:scale-110"
                        strokeWidth={1.75}
                      />
                      <span className="rounded-full border border-gold-500/25 bg-gold-500/10 px-3 py-1 font-en text-xs font-extrabold text-gold-800 num">
                        {count} {t.itemsWord}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg font-extrabold text-espresso">{h.title}</h4>
                      <p className="mt-2 leading-relaxed text-muted">{h.desc}</p>
                    </div>
                  </motion.a>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </div>
    </section>
  );
}
