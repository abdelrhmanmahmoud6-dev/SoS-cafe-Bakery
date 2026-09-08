import type { CategoryId } from "./menu-data";

/* ============================================================================
   MENU PHOTOGRAPHY — one verified photo per category

   Every image below was downloaded and LOOKED AT before being assigned. An
   earlier version of this file only checked that each URL returned
   200 image/jpeg, which is not the same thing at all: a URL can load perfectly
   and still show the wrong food. That produced coffee beans on "قهوة تركي",
   an ice-cream cone on the Oreo milkshake and crepes on "رز بلبن".

   The keyword-matching table that caused most of those mismatches is gone.
   Mapping is now strictly category -> photo: 14 categories, 14 photos, each
   one checked against what that category actually sells.

   Anything an admin sets in the menu manager wins over these defaults, and the
   seed will not overwrite a custom URL — see prisma/seed.ts.
   ========================================================================== */

const U = (id: string) =>
  `https://images.unsplash.com/${id}?w=800&q=80&auto=format&fit=crop`;

export const CATEGORY_IMAGES: Record<CategoryId, string> = {
  // Espresso cups with latte art on a wooden table.
  "hot-coffee": U("photo-1509042239860-f550ce710b93"),
  // Iced latte in a glass, milk swirling through the coffee.
  "ice-coffee": U("photo-1517701550927-30cf4ba1dba5"),
  // Blended frappe topped with cream, sauce and an Oreo.
  frappe: U("photo-1572490122747-3968b75cc699"),
  // Three fruit smoothies in tall glasses with banana and granola.
  smoothie: U("photo-1505252585461-04db1eb84625"),
  // Fresh orange juice beside cut oranges.
  juice: U("photo-1613478223719-2ab802602423"),
  // Mint-and-lime mojito being poured over ice.
  mojito: U("photo-1551538827-9c037cb4f32a"),
  // Classic chocolate milkshake, whipped cream and a striped straw.
  milkshake: U("photo-1553787499-6f9133860278"),
  // Iced citrus-and-mint cooler — the house mixed drinks.
  "mix-sos": U("photo-1621263764928-df1444c5e859"),
  // Golden waffles on a plate with berries and honey.
  waffle: U("photo-1562376552-0d160a2f238d"),
  // Tall pancake stack with syrup being poured over it.
  pancake: U("photo-1567620905732-2d1ec7ab7445"),
  // Brownie under ice cream with chocolate and caramel sauce.
  fattah: U("photo-1551024506-0bccd828d307"),
  // Layered cream-and-Oreo dessert in a stemmed glass.
  freska: U("photo-1563805042-7684c019e1cb"),
  // Creamy pudding set in glass jars, topped with strawberries.
  "rice-pudding": U("photo-1488477181946-6428a0291777"),
  // Close-up of almonds — the toppings.
  addons: U("photo-1508061253366-f7da158b6d46"),
};

/**
 * Photos this project has ever seeded, including the mismatched set shipped
 * before the images were reviewed.
 *
 * The seed replaces an item's picture only when it is null or one of these —
 * that lets a bad default be corrected on the next run while still leaving a
 * URL the shop chose in the menu manager completely alone.
 */
const LEGACY_SEED_IDS = [
  "photo-1447933601403-0c6688de566e",
  "photo-1461023058943-07fcbe16d735",
  "photo-1488477181946-6428a0291777",
  "photo-1497034825429-c343d7c6a68f",
  "photo-1497534446932-c925b458314e",
  "photo-1505252585461-04db1eb84625",
  "photo-1508061253366-f7da158b6d46",
  "photo-1509042239860-f550ce710b93",
  "photo-1511381939415-e44015466834",
  "photo-1514432324607-a09d9b4aefdd",
  "photo-1516685018646-549198525c1b",
  "photo-1517701550927-30cf4ba1dba5",
  "photo-1521302080334-4bebac2763a6",
  "photo-1522992319-0365e5f11656",
  "photo-1541167760496-1628856ab772",
  "photo-1542990253-0d0f5be5f0ed",
  "photo-1544787219-7f47ccb76574",
  "photo-1551538827-9c037cb4f32a",
  "photo-1553530666-ba11a7da3888",
  "photo-1562376552-0d160a2f238d",
  "photo-1567620905732-2d1ec7ab7445",
  "photo-1571771894821-ce9b6c11b08e",
  "photo-1572442388796-11668a67e53d",
  "photo-1572490122747-3968b75cc699",
  "photo-1585059895524-72359e06133a",
  "photo-1587049352846-4a222e784d38",
  "photo-1587314168485-3236d6710814",
  "photo-1597318181409-cf64d0b5d8a2",
  "photo-1597481499750-3e6b22637e12",
  "photo-1600271886742-f049cd451bba",
  "photo-1600359756098-8bc52195bbf4",
  "photo-1613478223719-2ab802602423",
  "photo-1621263764928-df1444c5e859",
  // current set
  "photo-1551024506-0bccd828d307",
  "photo-1553787499-6f9133860278",
  "photo-1563805042-7684c019e1cb",
];

/** The photo for a category. */
export function imageForCategory(category: CategoryId): string {
  return CATEGORY_IMAGES[category] ?? CATEGORY_IMAGES["hot-coffee"];
}

/** True when a stored URL is one this project seeded, so it is safe to replace. */
export function isSeededImage(url: string | null): boolean {
  if (!url) return false;
  return LEGACY_SEED_IDS.some((id) => url.includes(id));
}
