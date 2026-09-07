"use client";

import {
  Coffee,
  CupSoda,
  Snowflake,
  Grape,
  Citrus,
  Leaf,
  Milk,
  Sparkles,
  Croissant,
  Layers,
  UtensilsCrossed,
  IceCreamCone,
  Soup,
  Plus,
  type LucideIcon,
} from "lucide-react";
import type { IconKey } from "@/lib/menu-data";

/** SVG icons only — no emoji is ever used as an icon anywhere in this UI. */
const ICONS: Record<IconKey, LucideIcon> = {
  coffee: Coffee,
  iceCoffee: CupSoda,
  frappe: Snowflake,
  smoothie: Grape,
  juice: Citrus,
  mojito: Leaf,
  milkshake: Milk,
  mix: Sparkles,
  waffle: Croissant,
  pancake: Layers,
  fattah: UtensilsCrossed,
  freska: IceCreamCone,
  pudding: Soup,
  addon: Plus,
};

export function CategoryIcon({
  name,
  className = "size-4",
  strokeWidth = 2,
}: {
  name: IconKey;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = ICONS[name] ?? Coffee;
  // Decorative: the adjacent text label carries the meaning.
  return <Icon aria-hidden className={className} strokeWidth={strokeWidth} />;
}
