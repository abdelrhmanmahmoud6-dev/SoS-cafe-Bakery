import "server-only";
import { prisma } from "./db";
import type { CategoryId, IconKey } from "./menu-data";
import { imageForCategory } from "./menu-images";

/* ============================================================================
   Plain, serialisable shapes handed from server components to client
   components. Client code never imports Prisma types.
   ========================================================================== */

export interface MenuItemDTO {
  id: string;
  slug: string;
  cat: string;
  ar: string;
  en: string;
  descAr: string | null;
  descEn: string | null;
  price: number | null;
  sizes: { L: number; XL: number } | null;
  best: boolean;
  available: boolean;
  imageUrl: string | null;
}

export interface CategoryDTO {
  id: string;
  ar: string;
  en: string;
  icon: IconKey;
  blurbAr: string;
  blurbEn: string;
  /**
   * Thumbnail for the category rail.
   *
   * Resolved server-side so the rail never has to scan the whole item list in
   * the browser: a best-seller's photo from that section if there is one, then
   * any item photo, then the curated per-category fallback.
   */
  image: string;
}

export interface MenuPayload {
  categories: CategoryDTO[];
  items: MenuItemDTO[];
  counts: Record<string, number>;
  total: number;
}

type DbItem = {
  id: string;
  slug: string;
  categoryId: string;
  nameAr: string;
  nameEn: string;
  descAr: string | null;
  descEn: string | null;
  price: number | null;
  priceL: number | null;
  priceXL: number | null;
  isBestSeller: boolean;
  isAvailable: boolean;
  imageUrl: string | null;
};

export function toItemDTO(row: DbItem): MenuItemDTO {
  return {
    id: row.id,
    slug: row.slug,
    cat: row.categoryId,
    ar: row.nameAr,
    en: row.nameEn,
    descAr: row.descAr,
    descEn: row.descEn,
    price: row.priceL === null ? row.price : null,
    sizes:
      row.priceL !== null && row.priceXL !== null
        ? { L: row.priceL, XL: row.priceXL }
        : null,
    best: row.isBestSeller,
    available: row.isAvailable,
    imageUrl: row.imageUrl,
  };
}

/**
 * The photo that stands for a whole section in the category rail.
 *
 * Preferring a best-seller means the rail shows the thing the shop actually
 * wants to sell, and using a real item photo keeps the rail honest — the
 * curated stock shot is only reached when the section has no photography yet.
 */
function representativeImage(categoryId: string, items: MenuItemDTO[]): string {
  const inCat = items.filter((i) => i.cat === categoryId && i.imageUrl);
  const best = inCat.find((i) => i.best);
  return (
    best?.imageUrl ??
    inCat[0]?.imageUrl ??
    imageForCategory(categoryId as CategoryId)
  );
}

/**
 * The public storefront menu. Unavailable items are still returned so they can
 * be shown greyed-out as "sold out" rather than vanishing — a missing item
 * reads as a bug to a returning customer.
 */
export async function getMenu(): Promise<MenuPayload> {
  const [categories, items] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.menuItem.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const dtos = items.map(toItemDTO);
  const counts: Record<string, number> = {};
  for (const item of dtos) {
    counts[item.cat] = (counts[item.cat] ?? 0) + 1;
  }

  return {
    categories: categories.map((c) => ({
      id: c.id,
      ar: c.nameAr,
      en: c.nameEn,
      icon: c.icon as IconKey,
      blurbAr: c.blurbAr,
      blurbEn: c.blurbEn,
      image: representativeImage(c.id, dtos),
    })),
    items: dtos,
    counts,
    total: dtos.length,
  };
}

/** Add-ons, used by the cart's item customiser. */
export async function getAddons(): Promise<MenuItemDTO[]> {
  const rows = await prisma.menuItem.findMany({
    where: { categoryId: "addons", isAvailable: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map(toItemDTO);
}
