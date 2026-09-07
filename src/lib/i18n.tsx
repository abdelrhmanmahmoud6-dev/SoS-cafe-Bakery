"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DICT, type Lang, type Dictionary } from "./dictionary";
import { SHOP_DICT, type ShopDictionary } from "./shop-dictionary";

const STORAGE_KEY = "sos-lang";

interface I18nValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  isRTL: boolean;
  t: Dictionary;
  /** Commerce strings: cart, checkout, tracking, admin. */
  sh: ShopDictionary;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  /** Picks the right field off any bilingual object. */
  pick: <T extends { ar: string; en: string }>(obj: T) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Arabic is the default starting language, per brand requirement.
  const [lang, setLangState] = useState<Lang>("ar");

  // Restore a previously chosen language after hydration (never during SSR,
  // so the server-rendered Arabic markup and the first client render match).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "ar" || stored === "en") setLangState(stored);
    } catch {
      /* storage blocked — keep the Arabic default */
    }
  }, []);

  // Keep the document element in sync so CSS logical properties, the Arabic
  // font stack and native scrollbar placement all mirror correctly.
  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === "ar" ? "rtl" : "ltr";
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* non-fatal */
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);
  const toggleLang = useCallback(
    () => setLangState((prev) => (prev === "ar" ? "en" : "ar")),
    []
  );

  const value = useMemo<I18nValue>(() => {
    const t = DICT[lang] as unknown as Dictionary;
    const sh = SHOP_DICT[lang] as unknown as ShopDictionary;
    return {
      lang,
      sh,
      dir: lang === "ar" ? "rtl" : "ltr",
      isRTL: lang === "ar",
      t,
      setLang,
      toggleLang,
      pick: (obj) => (lang === "ar" ? obj.ar : obj.en),
    };
  }, [lang, setLang, toggleLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
