"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  ClipboardList,
  UtensilsCrossed,
  BarChart3,
  LogOut,
  Languages,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { logoutAction } from "@/app/actions/admin";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { useAdminUi } from "@/store/admin-ui";
import { playChime, unlockChime } from "@/lib/chime";

const NAV = [
  { href: "/admin", key: "orders", icon: ClipboardList },
  { href: "/admin/menu", key: "menu", icon: UtensilsCrossed },
  { href: "/admin/analytics", key: "analytics", icon: BarChart3 },
] as const;

export function AdminShell({
  children,
  adminName,
}: {
  children: React.ReactNode;
  adminName: string;
}) {
  const { sh, lang, toggleLang } = useI18n();
  const pathname = usePathname();
  const soundOn = useAdminUi((s) => s.soundOn);
  const setSoundOn = useAdminUi((s) => s.setSoundOn);
  const audioUnlocked = useAdminUi((s) => s.audioUnlocked);
  const markAudioUnlocked = useAdminUi((s) => s.markAudioUnlocked);

  /**
   * This click is the user gesture that satisfies the browser autoplay policy,
   * so it both unlocks the AudioContext and previews the alert. Without it a
   * later poll would try to play sound and be silently blocked.
   */
  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    if (next) {
      unlockChime();
      markAudioUnlocked();
      playChime();
    }
  }

  return (
    <div className="min-h-dvh bg-ink-950">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-ink-700 bg-ink-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[100rem] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo size={40} animated={false} />
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="text-sm font-extrabold text-cream">
                {sh.admin.brand}
              </span>
              <span className="text-[11px] text-muted-dim">{adminName}</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors duration-200 sm:px-4",
                    active ? "text-ink-950" : "text-muted hover:text-cream"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="admin-nav-pill"
                      className="absolute inset-0 -z-10 rounded-xl bg-gold-500"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon aria-hidden className="size-4" />
                  <span className="hidden sm:inline">
                    {sh.admin.nav[item.key]}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {/* Sound alert toggle — also the autoplay unlock gesture. */}
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={soundOn}
              title={sh.admin.orders.soundToggle}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm font-bold transition-colors duration-200",
                soundOn
                  ? "border-gold-500/50 bg-gold-500/10 text-gold-500"
                  : "border-ink-600 text-muted hover:text-cream"
              )}
            >
              {soundOn ? (
                <Volume2 aria-hidden className="size-4" />
              ) : (
                <VolumeX aria-hidden className="size-4" />
              )}
              <span className="hidden lg:inline">
                {soundOn ? sh.admin.orders.soundOn : sh.admin.orders.soundOff}
              </span>
              {soundOn && !audioUnlocked && (
                <span
                  aria-hidden
                  title="tap to enable audio"
                  className="size-1.5 rounded-full bg-amber-400"
                />
              )}
            </button>

            <button
              type="button"
              onClick={toggleLang}
              aria-label="Switch language"
              className="flex size-11 cursor-pointer items-center justify-center rounded-xl border border-ink-600 text-cream transition-colors duration-200 hover:border-gold-500/60 hover:text-gold-500"
            >
              <Languages aria-hidden className="size-4" />
              <span className="sr-only">{lang === "ar" ? "EN" : "ع"}</span>
            </button>

            <form action={logoutAction}>
              <button
                type="submit"
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-ink-600 px-3 text-sm font-bold text-muted transition-colors duration-200 hover:border-rose-400/50 hover:text-rose-300"
              >
                <LogOut aria-hidden className="size-4" />
                <span className="hidden md:inline">{sh.admin.logout}</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[100rem] px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
