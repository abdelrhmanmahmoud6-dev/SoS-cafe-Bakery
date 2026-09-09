/* ============================================================================
   PER-CATEGORY ACCENT COLOURS

   One saturated hue per menu section, so a waffle card glows peach and a mojito
   glows aqua. This is the difference between "a dark site with a highlight
   colour" and a menu that feels sorted by mood before you have read a word.

   Values are raw hex rather than Tailwind class names because they are handed
   to components as an inline `--accent` custom property:

       <article style={accentStyle(item.cat)} className="glow-accent" />

   That keeps the glow, the ring and the price badge on one source of truth, and
   means a component can tint itself without a class map or a `cn()` ladder.
   Every value below clears 4.5:1 against ink-950 when used as text.
   ========================================================================== */

/** Fallback for any category id not listed — the house neon yellow. */
export const DEFAULT_ACCENT = "#FACC15";

const ACCENTS: Record<string, string> = {
  // Coffee stays on the house neon yellow: it is the anchor of the brand.
  "hot-coffee": "#FACC15",
  "ice-coffee": "#FACC15",
  "mix-sos": "#FACC15",

  // Creamy and blended — lavender.
  frappe: "#B9A7FF",
  milkshake: "#B9A7FF",
  freska: "#B9A7FF",

  // Baked and warm — peach.
  waffle: "#FFAE8F",
  pancake: "#FFAE8F",
  juice: "#FFAE8F",
  fattah: "#FFAE8F",

  // Fresh and cold — aqua.
  mojito: "#5EEAD4",
  addons: "#5EEAD4",

  // Fruity and sweet — blush.
  smoothie: "#FF8FC7",
  "rice-pudding": "#FF8FC7",
};

/** The accent hex for a category id. */
export function accentFor(categoryId: string | undefined): string {
  if (!categoryId) return DEFAULT_ACCENT;
  return ACCENTS[categoryId] ?? DEFAULT_ACCENT;
}

/**
 * Inline style that publishes the accent to descendants.
 *
 * Typed as a plain record because `--accent` is not part of React's
 * CSSProperties, and casting at each call site would be noise.
 */
export function accentStyle(categoryId: string | undefined): React.CSSProperties {
  return { "--accent": accentFor(categoryId) } as React.CSSProperties;
}
