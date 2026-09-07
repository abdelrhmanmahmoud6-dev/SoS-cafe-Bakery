import type { CategoryId } from "./menu-data";

/* ============================================================================
   MENU PHOTOGRAPHY

   Direct Unsplash URLs. Every id below was checked with a real request and
   returned 200 image/jpeg — none are invented.

   Resolution is two-stage so 166 items get varied, relevant photos without
   hand-picking 166 separate shots:

     1. KEYWORD_IMAGES — matched against the Arabic name, so a Nutella waffle
        and a Lotus waffle do not show the same picture.
     2. CATEGORY_IMAGES — the fallback for anything a keyword misses.

   These are seed defaults only. Anything an admin sets in the menu manager
   overrides them, and the seed never overwrites a custom URL (see prisma/seed.ts).
   ========================================================================== */

const U = (id: string) =>
  `https://images.unsplash.com/${id}?w=800&q=80&auto=format&fit=crop`;

export const CATEGORY_IMAGES: Record<CategoryId, string> = {
  "hot-coffee": U("photo-1509042239860-f550ce710b93"),
  "ice-coffee": U("photo-1461023058943-07fcbe16d735"),
  frappe: U("photo-1572490122747-3968b75cc699"),
  smoothie: U("photo-1505252585461-04db1eb84625"),
  juice: U("photo-1613478223719-2ab802602423"),
  mojito: U("photo-1551538827-9c037cb4f32a"),
  milkshake: U("photo-1572490122747-3968b75cc699"),
  "mix-sos": U("photo-1621263764928-df1444c5e859"),
  waffle: U("photo-1562376552-0d160a2f238d"),
  pancake: U("photo-1567620905732-2d1ec7ab7445"),
  fattah: U("photo-1488477181946-6428a0291777"),
  freska: U("photo-1488477181946-6428a0291777"),
  "rice-pudding": U("photo-1587314168485-3236d6710814"),
  addons: U("photo-1508061253366-f7da158b6d46"),
};

/**
 * Ordered: the first Arabic substring that matches wins, so put the more
 * specific terms first ("قهوة تركي" before "قهوة").
 */
const KEYWORD_IMAGES: [string, string][] = [
  // --- coffee styles ---
  ["تركي", U("photo-1447933601403-0c6688de566e")],
  ["اسبريسو", U("photo-1514432324607-a09d9b4aefdd")],
  ["كابتشينو", U("photo-1572442388796-11668a67e53d")],
  ["لاتيه", U("photo-1541167760496-1628856ab772")],
  ["موكا", U("photo-1517701550927-30cf4ba1dba5")],
  ["امريكانو", U("photo-1521302080334-4bebac2763a6")],
  ["نسكافيه", U("photo-1522992319-0365e5f11656")],
  ["مكيانو", U("photo-1541167760496-1628856ab772")],
  ["كورتادو", U("photo-1514432324607-a09d9b4aefdd")],
  ["فلات وايت", U("photo-1541167760496-1628856ab772")],
  ["فرنساوي", U("photo-1509042239860-f550ce710b93")],

  // --- hot drinks ---
  ["شاي", U("photo-1544787219-7f47ccb76574")],
  ["نعناع", U("photo-1597318181409-cf64d0b5d8a2")],
  ["كركديه", U("photo-1597481499750-3e6b22637e12")],
  ["ينسون", U("photo-1544787219-7f47ccb76574")],
  ["أعشاب", U("photo-1544787219-7f47ccb76574")],
  ["قرفة", U("photo-1544787219-7f47ccb76574")],
  ["سحلب", U("photo-1542990253-0d0f5be5f0ed")],
  ["هوت شوكليت", U("photo-1542990253-0d0f5be5f0ed")],
  ["ليمون", U("photo-1621263764928-df1444c5e859")],
  ["سيدر", U("photo-1600271886742-f049cd451bba")],

  // --- flavours that cut across categories ---
  ["نوتيلا", U("photo-1511381939415-e44015466834")],
  ["أوريو", U("photo-1497034825429-c343d7c6a68f")],
  ["اوريو", U("photo-1497034825429-c343d7c6a68f")],
  ["بستاشيو", U("photo-1600359756098-8bc52195bbf4")],
  ["كراميل", U("photo-1516685018646-549198525c1b")],
  ["شوكليت", U("photo-1511381939415-e44015466834")],
  ["شوكلت", U("photo-1511381939415-e44015466834")],
  ["فراولة", U("photo-1587314168485-3236d6710814")],
  ["ستروبيري", U("photo-1587314168485-3236d6710814")],
  ["ستروبري", U("photo-1587314168485-3236d6710814")],
  ["مانجو", U("photo-1553530666-ba11a7da3888")],
  ["برتقال", U("photo-1600271886742-f049cd451bba")],
  ["اورنج", U("photo-1600271886742-f049cd451bba")],
  ["موز", U("photo-1571771894821-ce9b6c11b08e")],
  ["بانانا", U("photo-1571771894821-ce9b6c11b08e")],
  ["كيوي", U("photo-1585059895524-72359e06133a")],
  ["كيوى", U("photo-1585059895524-72359e06133a")],
  ["بطيخ", U("photo-1587049352846-4a222e784d38")],
  ["بيري", U("photo-1497534446932-c925b458314e")],
  ["مكسرات", U("photo-1508061253366-f7da158b6d46")],
  ["بندق", U("photo-1508061253366-f7da158b6d46")],
  ["فواكه", U("photo-1497534446932-c925b458314e")],

  // --- forms ---
  ["وافل", U("photo-1562376552-0d160a2f238d")],
  ["بان كيك", U("photo-1567620905732-2d1ec7ab7445")],
  ["فتة", U("photo-1488477181946-6428a0291777")],
  ["فريسكا", U("photo-1488477181946-6428a0291777")],
  ["رز بلبن", U("photo-1587314168485-3236d6710814")],
  ["موهيتو", U("photo-1551538827-9c037cb4f32a")],
  ["سموزي", U("photo-1505252585461-04db1eb84625")],
  ["فرابيه", U("photo-1572490122747-3968b75cc699")],
  ["فرابتشينو", U("photo-1572490122747-3968b75cc699")],
  ["أيس", U("photo-1461023058943-07fcbe16d735")],
  ["جوافة", U("photo-1613478223719-2ab802602423")],
  ["أناناس", U("photo-1505252585461-04db1eb84625")],
  ["كولادا", U("photo-1505252585461-04db1eb84625")],
];

/** Picks the most specific photo available for an item. */
export function imageForItem(nameAr: string, category: CategoryId): string {
  for (const [needle, url] of KEYWORD_IMAGES) {
    if (nameAr.includes(needle)) return url;
  }
  return CATEGORY_IMAGES[category] ?? CATEGORY_IMAGES["hot-coffee"];
}
