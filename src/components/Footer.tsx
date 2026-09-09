"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, MapPin, Phone, MessageCircle, Facebook } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { STORE } from "@/lib/dictionary";
import { waGeneralLink } from "@/lib/utils";
import { Logo } from "./ui/Logo";

/** TikTok has no Lucide glyph, so it ships as an inline brand path. */
function TikTokIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .74-5.07v-3.1a5.65 5.65 0 0 0-.74-.05A5.68 5.68 0 1 0 15.54 15.4V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.29 4.29 0 0 1-3.24-1.48z" />
    </svg>
  );
}

const NAV_IDS = ["home", "about", "menu", "contact"] as const;

export function Footer() {
  const { t, lang } = useI18n();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const socials = [
    { icon: TikTokIcon, href: STORE.tiktokHref, label: "TikTok" },
    { icon: Facebook, href: STORE.facebookHref, label: "Facebook" },
  ];

  return (
    <>
      <footer className="relative overflow-hidden border-t border-sand-300 bg-sand-100/60">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent"
        />

        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-12">
            {/* Brand */}
            <div className="flex flex-col gap-5 lg:col-span-5">
              <div className="flex items-center gap-3">
                <Logo size={56} />
                <div className="flex flex-col leading-tight">
                  <span className="font-en text-lg font-extrabold text-espresso">
                    SOS Bakery And Coffee
                  </span>
                  <span className="font-en text-xs font-bold uppercase tracking-[0.16em] text-gold-800 num">
                    est. {STORE.est}
                  </span>
                </div>
              </div>

              <p className="max-w-sm leading-relaxed text-muted">{t.footer.tagline}</p>

              <div className="flex items-center gap-2.5">
                {socials.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="flex size-11 cursor-pointer items-center justify-center rounded-xl border border-sand-400 bg-sand-200 text-muted transition-all duration-200 hover:border-gold-500/60 hover:bg-gold-500 hover:text-espresso"
                    >
                      <Icon className="size-5" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Quick links */}
            <nav className="lg:col-span-3" aria-label={t.footer.quickLinks}>
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-gold-800">
                {t.footer.quickLinks}
              </h3>
              <ul className="mt-5 flex flex-col gap-1">
                {NAV_IDS.map((id) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-muted transition-colors duration-200 hover:text-gold-800"
                    >
                      {t.nav[id] as string}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Contact */}
            <div className="lg:col-span-4">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-gold-800">
                {t.footer.contactUs}
              </h3>
              <ul className="mt-5 flex flex-col gap-3">
                <li>
                  <a
                    href={STORE.mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex cursor-pointer items-start gap-3 text-muted transition-colors duration-200 hover:text-gold-800"
                  >
                    <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-800" />
                    <span className="leading-relaxed">
                      {lang === "ar" ? STORE.addressAr : STORE.addressEn}
                      <br />
                      <span className="text-sm text-muted-dim">
                        {lang === "ar" ? STORE.governorateAr : STORE.governorateEn}
                      </span>
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href={STORE.phoneHref}
                    className="flex min-h-11 cursor-pointer items-center gap-3 text-muted transition-colors duration-200 hover:text-gold-800"
                  >
                    <Phone aria-hidden className="size-4 shrink-0 text-gold-800" />
                    <span dir="ltr" className="font-en font-bold num">
                      {STORE.phone}
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href={waGeneralLink(lang)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 cursor-pointer items-center gap-3 text-muted transition-colors duration-200 hover:text-gold-800"
                  >
                    <MessageCircle aria-hidden className="size-4 shrink-0 text-gold-800" />
                    <span className="font-bold">{t.nav.whatsapp}</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-sand-300 pt-7 sm:flex-row">
            <p className="text-sm text-muted-dim">
              <span className="num">©</span> <span className="num">2026</span>{" "}
              {STORE.nameEn}. {t.footer.rights}
            </p>
            <p className="text-sm text-muted-dim">{t.footer.madeWith}</p>
          </div>
        </div>
      </footer>

      {/* Back to top */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.7, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 16 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label={t.footer.backToTop}
            className="fixed bottom-5 end-5 z-40 flex size-13 cursor-pointer items-center justify-center rounded-2xl bg-gold-500 text-espresso shadow-glow-lg transition-colors duration-200 hover:bg-gold-400"
          >
            <ArrowUp aria-hidden className="size-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
