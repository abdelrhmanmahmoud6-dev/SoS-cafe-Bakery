import { STORE } from "./dictionary";
import type { MenuItem } from "./menu-data";

/** Tiny classnames joiner — avoids pulling in clsx for this project size. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Builds a prefilled WhatsApp order link for a menu item.
 * The message is written in the language the visitor is currently browsing in.
 */
export function waOrderLink(item: MenuItem, lang: "ar" | "en", size?: "L" | "XL"): string {
  const name = lang === "ar" ? item.ar : item.en;
  const sizeLabel = size ? ` (${size})` : "";
  const price = size && item.sizes ? item.sizes[size] : item.price;
  const priceLabel = price ? (lang === "ar" ? ` — ${price} ج.م` : ` — ${price} EGP`) : "";

  const msg =
    lang === "ar"
      ? `السلام عليكم 👋\nحابب أطلب من SOS Bakery And Coffee:\n• ${name}${sizeLabel}${priceLabel}`
      : `Hello 👋\nI'd like to order from SOS Bakery And Coffee:\n• ${name}${sizeLabel}${priceLabel}`;

  return `${STORE.whatsappHref}?text=${encodeURIComponent(msg)}`;
}

/** Generic WhatsApp link with a plain greeting. */
export function waGeneralLink(lang: "ar" | "en"): string {
  const msg =
    lang === "ar"
      ? "السلام عليكم 👋 حابب أستفسر عن الطلب من SOS Bakery And Coffee"
      : "Hello 👋 I'd like to ask about ordering from SOS Bakery And Coffee";
  return `${STORE.whatsappHref}?text=${encodeURIComponent(msg)}`;
}

/**
 * Is the store open right now?
 * Hours run 09:00 -> 01:00 the next day, so the window wraps past midnight.
 */
export function isOpenNow(date = new Date()): boolean {
  const h = date.getHours() + date.getMinutes() / 60;
  const { open, close } = STORE.hours;
  // close is expressed as 25 (== 01:00 next day)
  const closeToday = close % 24;
  if (close > 24) {
    // open from 09:00 to 23:59 OR from 00:00 to 01:00
    return h >= open || h < closeToday;
  }
  return h >= open && h < closeToday;
}

/**
 * Normalises Arabic text for search: strips diacritics/tatweel and folds the
 * alef, yaa and taa-marbuta variants so "أيس"/"ايس" and "كيوى"/"كيوي" match.
 */
export function normalizeArabic(input: string): string {
  return input
    .replace(/[ً-ْٰـ]/g, "") // harakat + tatweel
    .replace(/[آأإٱ]/g, "ا") // آ أ إ ٱ -> ا
    .replace(/ى/g, "ي") // ى -> ي
    .replace(/ة/g, "ه") // ة -> ه
    .replace(/ؤ/g, "و") // ؤ -> و
    .replace(/ئ/g, "ي"); // ئ -> ي
}

/** Lowercase + Arabic-folded + whitespace-collapsed, for search comparison. */
export function foldForSearch(input: string): string {
  return normalizeArabic(input.toLowerCase()).replace(/\s+/g, " ").trim();
}

/** Formats a whole-EGP amount with the right currency word for the language. */
export function formatEGP(amount: number, lang: "ar" | "en"): string {
  return lang === "ar" ? `${amount} ج.م` : `${amount} EGP`;
}

/** Short, locale-aware date + time for order timestamps. */
export function formatDateTime(iso: string, lang: "ar" | "en"): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** "5 min ago" style relative time, for the live order board. */
export function timeAgo(iso: string, lang: "ar" | "en"): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === "ar" ? "الآن" : "just now";
  if (mins < 60) return lang === "ar" ? `من ${mins} د` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === "ar" ? `من ${hours} س` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return lang === "ar" ? `من ${days} يوم` : `${days}d ago`;
}
