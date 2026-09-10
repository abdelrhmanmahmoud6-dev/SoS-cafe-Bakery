"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Phone, Menu as MenuIcon, X, Languages, MessageCircle, PackageSearch } from "lucide-react";
import Link from "next/link";
import { CartButton } from "./shop/CartButton";
import { useI18n } from "@/lib/i18n";
import { STORE } from "@/lib/dictionary";
import { cn, waGeneralLink } from "@/lib/utils";
import { Logo } from "./ui/Logo";

const LINKS = [
  { id: "home", href: "#home" },
  { id: "about", href: "#about" },
  { id: "menu", href: "#menu" },
  { id: "contact", href: "#contact" },
] as const;

export function Navbar() {
  const { t, sh, lang, toggleLang } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("home");
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  // Scroll-spy: highlight the section currently in view.
  useEffect(() => {
    const ids = LINKS.map((l) => l.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape closes the drawer.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Skip link — first tab stop for keyboard users */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[100] focus:rounded-xl focus:bg-gold-500 focus:px-5 focus:py-3 focus:font-bold focus:text-espresso"
      >
        {t.nav.skipToContent}
      </a>

      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled ? "py-2" : "py-3 sm:py-4"
        )}
      >
        <nav
          className={cn(
            // Three zones: brand, links, actions. `justify-between` holds the
            // ends apart below `lg` (where the links are hidden) and the links'
            // own `flex-1` centres them above it.
            //
            // The margin utilities used to be split across two strings — an
            // `mx-auto` in one and `mx-3 sm:mx-6 lg:mx-auto` in the other. Two
            // competing values for the same property at equal specificity, with
            // the winner decided by stylesheet order rather than intent, which
            // is why the bar sat differently than it measured.
            "flex max-w-7xl items-center justify-between gap-2 rounded-2xl px-3 transition-all duration-300",
            "mx-3 sm:mx-6 sm:gap-3 sm:px-4 lg:mx-auto",
            scrolled
              ? "glass-strong h-14 shadow-float sm:h-16"
              : "h-16 border border-transparent bg-transparent sm:h-18"
          )}
        >
          {/* Brand */}
          <a
            href="#home"
            aria-label={t.a11y.brandHome}
            className="group flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl px-1 py-1"
          >
            <Logo size={40} />
            <span className="hidden flex-col leading-none sm:flex">
              <span className="font-en text-sm font-extrabold tracking-tight text-espresso">
                SOS
              </span>
              <span className="font-en text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-800">
                Bakery &amp; Coffee
              </span>
            </span>
          </a>

          {/* Desktop links */}
          {/* `min-w-0` + `flex-1` makes this the one flexible zone: if the bar
              ever runs short, the links absorb it instead of every zone
              shrinking at once and spilling its contents over its neighbour. */}
          <ul className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
            {LINKS.map((link) => {
              const label = t.nav[link.id as keyof typeof t.nav] as string;
              const isActive = active === link.id;
              return (
                <li key={link.id}>
                  <a
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative block cursor-pointer whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200",
                      isActive ? "text-espresso" : "text-muted hover:text-espresso"
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 -z-10 rounded-2xl bg-gold-500"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    {label}
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Actions.

              `shrink-0` is the fix for the overlap: a flex item shrinks by
              default, and these buttons have fixed heights and unwrappable
              labels, so once the row ran short the container was squeezed
              narrower than its contents and the children spilled across the
              links beside them. Pinning the zone means it keeps its intrinsic
              width and the links give way instead. */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Track order */}
            <Link
              href="/track"
              aria-label={sh.track.title}
              className="hidden h-11 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-2xl border border-sand-400 bg-sand-200/70 px-3 text-sm font-bold text-espresso transition-[transform,color,border-color] duration-200 hover:border-gold-500/60 hover:text-gold-800 active:scale-95 md:flex"
            >
              <PackageSearch aria-hidden className="size-4" />
              <span className="hidden xl:inline">{sh.track.title}</span>
            </Link>

            {/* Cart */}
            <CartButton />

            {/* Language toggle */}
            <button
              type="button"
              onClick={toggleLang}
              aria-label={t.a11y.switchLang}
              className="flex h-11 min-w-11 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-2xl border border-sand-400 bg-sand-200/70 px-3 text-xs font-bold text-espresso transition-[transform,color,border-color,background-color] duration-200 hover:border-gold-500/60 hover:bg-sand-300 hover:text-gold-800 active:scale-95"
            >
              <Languages aria-hidden className="size-4" />
              <span className="font-en">{lang === "ar" ? "EN" : "ع"}</span>
            </button>

            {/* WhatsApp — icon only on small screens, but always labelled */}
            <a
              href={waGeneralLink(lang)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.nav.whatsapp}
              className="hidden h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-sand-400 bg-sand-200/70 px-3 text-sm font-bold text-espresso transition-[transform,color,border-color,background-color] duration-200 hover:border-gold-500/60 hover:bg-sand-300 hover:text-gold-800 active:scale-95 sm:flex"
            >
              <MessageCircle aria-hidden className="size-4" />
              <span className="hidden xl:inline">{t.nav.whatsapp}</span>
            </a>

            {/* Call Now — primary CTA */}
            <a
              href={STORE.phoneHref}
              className="group hidden h-11 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full btn-espresso px-4 text-sm font-extrabold transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:shadow-espresso-lg active:scale-95 sm:flex"
            >
              <Phone aria-hidden className="size-4 transition-transform duration-300 group-hover:rotate-12" />
              <span>{t.nav.callNow}</span>
            </a>

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t.nav.openMenu}
              aria-expanded={open}
              aria-controls="mobile-drawer"
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-sand-400 bg-sand-200/70 text-espresso transition-[transform,color,border-color] duration-200 hover:border-gold-500/60 hover:text-gold-800 active:scale-90 lg:hidden"
            >
              <MenuIcon aria-hidden className="size-5" />
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] bg-espresso/40 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              id="mobile-drawer"
              role="dialog"
              aria-modal="true"
              aria-label={t.nav.openMenu}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="fixed inset-y-0 end-0 z-[70] flex w-[min(20rem,86vw)] flex-col gap-6 border-s border-sand-300 bg-sand-100 p-6 shadow-float lg:hidden rtl:[--x-dir:-1]"
            >
              <div className="flex items-center justify-between">
                <Logo size={44} animated={false} />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t.nav.closeMenu}
                  className="flex size-11 cursor-pointer items-center justify-center rounded-2xl border border-sand-400 text-espresso transition-[transform,color,border-color] duration-200 hover:border-gold-500/60 hover:text-gold-800 active:scale-90"
                >
                  <X aria-hidden className="size-5" />
                </button>
              </div>

              <ul className="flex flex-col gap-1.5">
                {LINKS.map((link, i) => (
                  <motion.li
                    key={link.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 + i * 0.06, duration: 0.35 }}
                  >
                    <a
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex min-h-12 cursor-pointer items-center rounded-xl px-4 text-base font-bold transition-colors duration-200",
                        active === link.id
                          ? "bg-gold-500 text-espresso"
                          : "text-espresso hover:bg-sand-200"
                      )}
                    >
                      {t.nav[link.id as keyof typeof t.nav] as string}
                    </a>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-auto flex flex-col gap-2.5">
                <Link
                  href="/track"
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-sand-400 px-4 font-bold text-espresso transition-colors duration-200 hover:border-gold-500/60 hover:text-gold-800"
                >
                  <PackageSearch aria-hidden className="size-4" />
                  {sh.track.title}
                </Link>
                <a
                  href={STORE.phoneHref}
                  className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full btn-espresso px-4 font-extrabold transition-colors duration-200 hover:brightness-125"
                >
                  <Phone aria-hidden className="size-4" />
                  {t.nav.callNow}
                </a>
                <a
                  href={waGeneralLink(lang)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-sand-400 px-4 font-bold text-espresso transition-colors duration-200 hover:border-gold-500/60 hover:text-gold-800"
                >
                  <MessageCircle aria-hidden className="size-4" />
                  {t.nav.whatsapp}
                </a>
                <p className="pt-1 text-center font-en text-xs text-muted-dim num">
                  {STORE.phone}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
