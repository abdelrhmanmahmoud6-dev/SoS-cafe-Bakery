import "server-only";
import { prisma } from "./db";
import type { IconKey } from "./menu-data";

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
