"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Phone, MessageCircle, MapPin, Clock, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { STORE } from "@/lib/dictionary";
import { cn, isOpenNow, waGeneralLink } from "@/lib/utils";
import { Reveal, SectionHeading, AmbientShapes, MagneticButton } from "./ui/Motion";

export function Contact() {
  const { t, lang } = useI18n();

  // Resolved on the client only, so server and first client render agree.
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    setOpen(isOpenNow());
    const id = window.setInterval(() => setOpen(isOpenNow()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const cards = [
    {
      icon: Phone,
      title: t.contact.callTitle,
      desc: t.contact.callDesc,
      value: STORE.phone,
      href: STORE.phoneHref,
      external: false,
      primary: true,
    },
    {
      icon: MessageCircle,
      title: t.contact.whatsappTitle,
      desc: t.contact.whatsappDesc,
      value: STORE.phone,
      href: waGeneralLink(lang),
      external: true,
      primary: false,
    },
    {
      icon: MapPin,
      title: t.contact.addressTitle,
      desc: lang === "ar" ? STORE.governorateAr : STORE.governorateEn,
      value: lang === "ar" ? STORE.addressAr : STORE.addressEn,
      href: STORE.mapsHref,
      external: true,
      primary: false,
    },
  ];

  return (
    <section
      id="contact"
      className="relative isolate scroll-mt-28 overflow-hidden py-16 md:py-24"
    >
      <AmbientShapes />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow={t.contact.eyebrow}
          title={t.contact.title}
          subtitle={t.contact.subtitle}
        />

        {/* Contact cards */}
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.title} delay={i * 0.08}>
                <motion.a
                  href={c.href}
                  target={c.external ? "_blank" : undefined}
                  rel={c.external ? "noopener noreferrer" : undefined}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className={cn(
                    "group flex h-full cursor-pointer flex-col gap-4 rounded-3xl border p-7 transition-colors duration-300",
                    c.primary
                      ? "border-gold-500/40 bg-gold-500/[0.07] hover:border-gold-500/70"
                      : "border-ink-700 bg-ink-900/70 hover:border-gold-500/40"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-13 items-center justify-center rounded-2xl transition-all duration-300",
                      c.primary
                        ? "bg-gold-500 text-ink-950"
                        : "bg-gold-500/10 text-gold-500 ring-1 ring-gold-500/25 group-hover:bg-gold-500 group-hover:text-ink-950"
                    )}
                  >
                    <Icon aria-hidden className="size-6" />
                  </span>

                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-extrabold text-cream">
                      {c.title}
                      {c.external && (
                        <ExternalLink
                          aria-hidden
                          className="size-3.5 text-muted-dim transition-colors duration-200 group-hover:text-gold-500"
                        />
                      )}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.desc}</p>
                  </div>

                  <p
                    dir="ltr"
                    className="mt-auto font-en text-lg font-extrabold text-gold-500 num text-start"
                  >
                    {c.value}
                  </p>
                </motion.a>
              </Reveal>
            );
          })}
        </div>

        {/* Hours + live status */}
        <Reveal delay={0.24} className="mt-5">
          <div className="flex flex-col gap-6 rounded-3xl border border-ink-700 bg-gradient-to-br from-ink-800 to-ink-900 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div className="flex items-start gap-4">
              <span className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-500 ring-1 ring-gold-500/25">
                <Clock aria-hidden className="size-6" />
              </span>
              <div>
                <h3 className="text-lg font-extrabold text-cream">{t.contact.hoursTitle}</h3>
                <p className="mt-1 text-muted">{t.contact.hoursValue}</p>
              </div>
            </div>

            {/* Animated status pill */}
            <div
              role="status"
              aria-label={t.contact.statusLabel}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-2xl border px-5 py-3.5 transition-colors duration-300",
                open === null
                  ? "border-ink-600 bg-ink-800"
                  : open
                    ? "border-success/35 bg-success/10"
                    : "border-ink-600 bg-ink-800"
              )}
            >
              <span className="relative flex size-3">
                {open && (
                  <motion.span
                    animate={{ scale: [1, 2.1], opacity: [0.7, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inline-flex size-full rounded-full bg-success"
                  />
                )}
                <span
                  className={cn(
                    "relative inline-flex size-3 rounded-full",
                    open ? "bg-success" : "bg-muted-dim"
                  )}
                />
              </span>

              <div className="flex flex-col leading-tight">
                <span
                  className={cn(
                    "text-sm font-extrabold",
                    open ? "text-success" : "text-muted"
                  )}
                >
                  {/* Placeholder text until the client resolves the real clock */}
                  {open === null
                    ? t.contact.hoursTitle
                    : open
                      ? t.contact.openNow
                      : t.contact.closedNow}
                </span>
                <span className="text-[11px] font-semibold text-muted-dim">
                  {open ? t.contact.closesAt : t.contact.opensAt}
                </span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Big CTA band */}
        <Reveal delay={0.3} className="mt-5">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold-500 via-gold-500 to-gold-600 p-8 sm:p-12">
            <div
              aria-hidden
              className="absolute -end-16 -top-16 size-64 rounded-full bg-ink-950/10 blur-2xl"
            />
            <div className="relative flex flex-col items-center gap-6 text-center">
              <h3 className="text-balance text-2xl font-extrabold leading-tight text-ink-950 sm:text-3xl">
                {t.contact.title}
              </h3>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <MagneticButton
                  href={STORE.phoneHref}
                  className="flex min-h-13 w-full items-center justify-center gap-2.5 rounded-2xl bg-ink-950 px-7 font-extrabold text-gold-500 transition-colors duration-200 hover:bg-ink-900 sm:w-auto"
                >
                  <Phone aria-hidden className="size-5" />
                  <span dir="ltr" className="font-en num">
                    {STORE.phone}
                  </span>
                </MagneticButton>

                <MagneticButton
                  href={waGeneralLink(lang)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-13 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-ink-950/25 px-7 font-extrabold text-ink-950 transition-colors duration-200 hover:bg-ink-950/10 sm:w-auto"
                >
                  <MessageCircle aria-hidden className="size-5" />
                  {t.nav.whatsapp}
                </MagneticButton>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
