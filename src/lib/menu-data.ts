/* ============================================================================
   SOS BAKERY AND COFFEE — CANONICAL MENU DATA
   Single source of truth. Every item carries Arabic + English names.
   Prices are in EGP. Items with L / XL sizes use `sizes` instead of `price`.
   ========================================================================== */

export type CategoryId =
  | "hot-coffee"
  | "ice-coffee"
  | "frappe"
  | "smoothie"
  | "juice"
  | "mojito"
  | "milkshake"
  | "mix-sos"
  | "waffle"
  | "pancake"
  | "fattah"
  | "freska"
  | "rice-pudding"
  | "addons";

export type IconKey =
  | "coffee"
  | "iceCoffee"
  | "frappe"
  | "smoothie"
  | "juice"
  | "mojito"
  | "milkshake"
  | "mix"
  | "waffle"
  | "pancake"
  | "fattah"
  | "freska"
  | "pudding"
  | "addon";

export interface MenuItem {
  /** Stable unique id, used for React keys, modal routing and search. */
  id: string;
  cat: CategoryId;
  ar: string;
  en: string;
  /** Single price in EGP. Mutually exclusive with `sizes`. */
  price?: number;
  /** Multi-size pricing in EGP. Mutually exclusive with `price`. */
  sizes?: { L: number; XL: number };
  /** Flagged as a house favourite. */
  best?: boolean;
}

export interface Category {
  id: CategoryId;
  ar: string;
  en: string;
  icon: IconKey;
  /** Short bilingual blurb shown in the quick-view modal. */
  blurbAr: string;
  blurbEn: string;
}

/* -------------------------------------------------------------------------- */
/*  CATEGORIES                                                                */
/* -------------------------------------------------------------------------- */

export const CATEGORIES: Category[] = [
  {
    id: "hot-coffee",
    ar: "مشروبات ساخنة",
    en: "Hot Drinks & Coffee",
    icon: "coffee",
    blurbAr: "يُحضّر عند الطلب من حبوب طازجة، ويُقدَّم ساخنًا على طول.",
    blurbEn: "Brewed to order from freshly ground beans and served piping hot.",
  },
  {
    id: "ice-coffee",
    ar: "أيس كوفي",
    en: "Ice Coffee",
    icon: "iceCoffee",
    blurbAr: "إسبريسو مثلج على ثلج وفير، لقهوة منعشة تصحّيك.",
    blurbEn: "Chilled espresso over generous ice — a crisp, waking-up coffee.",
  },
  {
    id: "frappe",
    ar: "فرابيه",
    en: "Frappe",
    icon: "frappe",
    blurbAr: "مخفوق مثلج كريمي بقوام ناعم وطبقة رغوة خفيفة.",
    blurbEn: "Creamy blended ice with a silky body and a light foam crown.",
  },
  {
    id: "smoothie",
    ar: "سموزي",
    en: "Smoothie",
    icon: "smoothie",
    blurbAr: "فواكه مخفوقة بالكامل، بدون ألوان أو نكهات صناعية.",
    blurbEn: "Whole fruit, fully blended — no artificial colours or flavours.",
  },
  {
    id: "juice",
    ar: "فريش وعصائر",
    en: "Fresh Juices",
    icon: "juice",
    blurbAr: "يُعصر أمامك لحظة الطلب من فاكهة اليوم.",
    blurbEn: "Squeezed in front of you, the moment you order, from the day's fruit.",
  },
  {
    id: "mojito",
    ar: "موهيتو",
    en: "Mojito",
    icon: "mojito",
    blurbAr: "نعناع طازج وليمون وصودا مثلجة — انتعاش من أول رشفة.",
    blurbEn: "Fresh mint, lime and iced soda — refreshing from the first sip.",
  },
  {
    id: "milkshake",
    ar: "ميلك شيك",
    en: "Milkshakes",
    icon: "milkshake",
    blurbAr: "آيس كريم ولبن كامل الدسم، مخفوق لقوام سميك وغني.",
    blurbEn: "Ice cream and full-fat milk, blended thick and rich.",
  },
  {
    id: "mix-sos",
    ar: "ميكس SOS",
    en: "Mix SOS",
    icon: "mix",
    blurbAr: "توليفات البيت الخاصة — خلطات لا تلاقيها في مكان تاني.",
    blurbEn: "Our own house blends — signature mixes you won't find elsewhere.",
  },
  {
    id: "waffle",
    ar: "وافل",
    en: "Waffle",
    icon: "waffle",
    blurbAr: "عجينة طازجة تُخبز عند الطلب، مقرمشة من بره وطرية من جوه.",
    blurbEn: "Fresh batter baked to order — crisp outside, tender inside.",
  },
  {
    id: "pancake",
    ar: "بان كيك",
    en: "Pancake",
    icon: "pancake",
    blurbAr: "طبقات هشة تُحضّر لحظيًا وتُغطّى بالصوص اللي تختاره.",
    blurbEn: "Fluffy stacks made on the spot and finished with the sauce you pick.",
  },
  {
    id: "fattah",
    ar: "فتة",
    en: "Fattah",
    icon: "fattah",
    blurbAr: "طبق المشاركة الكبير — يكفي اتنين بالراحة.",
    blurbEn: "The big sharing plate — comfortably serves two.",
  },
  {
    id: "freska",
    ar: "فريسكا",
    en: "Freska",
    icon: "freska",
    blurbAr: "طبقات كريمية باردة مع الصوص والتوبينج اللي على مزاجك.",
    blurbEn: "Cool creamy layers with the sauce and topping of your mood.",
  },
  {
    id: "rice-pudding",
    ar: "رز بلبن",
    en: "Rice Pudding",
    icon: "pudding",
    blurbAr: "وصفة بيتي أصلية، تُخبز على مهل وتُقدَّم دافئة أو باردة.",
    blurbEn: "A proper homemade recipe, slow-baked and served warm or cold.",
  },
  {
    id: "addons",
    ar: "إضافات",
    en: "Add-ons",
    icon: "addon",
    blurbAr: "زوّد أي طبق بالإضافة اللي تحبها.",
    blurbEn: "Top up any plate with the extra you love.",
  },
];

/* -------------------------------------------------------------------------- */
/*  ITEMS                                                                     */
/* -------------------------------------------------------------------------- */

export const MENU_ITEMS: MenuItem[] = [
  /* ---- 1. HOT DRINKS & COFFEE ------------------------------------------ */
  { id: "hc-01", cat: "hot-coffee", ar: "قهوة تركي", en: "Turkish Coffee", price: 25, best: true },
  { id: "hc-02", cat: "hot-coffee", ar: "تركي دبل", en: "Double Turkish", price: 35 },
  { id: "hc-03", cat: "hot-coffee", ar: "فرنساوي", en: "French Coffee", price: 35 },
  { id: "hc-04", cat: "hot-coffee", ar: "قهوة بندق", en: "Hazelnut Coffee", price: 35 },
  { id: "hc-05", cat: "hot-coffee", ar: "قهوة نوتيلا", en: "Nutella Coffee", price: 35 },
  { id: "hc-06", cat: "hot-coffee", ar: "اسبريسو", en: "Single Espresso", price: 30 },
  { id: "hc-07", cat: "hot-coffee", ar: "اسبريسو دبل", en: "Double Espresso", price: 40 },
  { id: "hc-08", cat: "hot-coffee", ar: "اسبريسو افوكادو", en: "Espresso Avocado", price: 45, best: true },
  { id: "hc-09", cat: "hot-coffee", ar: "مكيانو", en: "Macchiato", price: 30 },
  { id: "hc-10", cat: "hot-coffee", ar: "كورتادو", en: "Cortado", price: 30 },
  { id: "hc-11", cat: "hot-coffee", ar: "فلات وايت", en: "Flat White", price: 30 },
  { id: "hc-12", cat: "hot-coffee", ar: "لاتيه كلاسيك", en: "Classic Latte", price: 35, best: true },
  { id: "hc-13", cat: "hot-coffee", ar: "كابتشينو", en: "Cappuccino", price: 40 },
  { id: "hc-14", cat: "hot-coffee", ar: "موكا", en: "Mocha", price: 35 },
  { id: "hc-15", cat: "hot-coffee", ar: "امريكانو", en: "Americano", price: 30 },
  { id: "hc-16", cat: "hot-coffee", ar: "نسكافيه", en: "Nescafe", price: 30 },
  { id: "hc-17", cat: "hot-coffee", ar: "نسكافيه بلاك", en: "Black Nescafe", price: 25 },
  { id: "hc-18", cat: "hot-coffee", ar: "كراميل ميكاتو", en: "Caramel Macchiato", price: 35, best: true },
  { id: "hc-19", cat: "hot-coffee", ar: "هوت فريروشيه لاتيه", en: "Hot Ferrero Rocher Latte", price: 40 },
  { id: "hc-20", cat: "hot-coffee", ar: "شاي", en: "Tea", price: 10 },
  { id: "hc-21", cat: "hot-coffee", ar: "شاي حليب", en: "Milk Tea", price: 20 },
  { id: "hc-22", cat: "hot-coffee", ar: "شاي أخضر", en: "Green Tea", price: 10 },
  { id: "hc-23", cat: "hot-coffee", ar: "ينسون", en: "Anise", price: 10 },
  { id: "hc-24", cat: "hot-coffee", ar: "كركديه", en: "Hibiscus", price: 10 },
  { id: "hc-25", cat: "hot-coffee", ar: "نعناع", en: "Mint", price: 10 },
  { id: "hc-26", cat: "hot-coffee", ar: "ليمون ساخن", en: "Hot Lemon", price: 15 },
  { id: "hc-27", cat: "hot-coffee", ar: "قرفة جنزبيل", en: "Cinnamon Ginger", price: 20 },
  { id: "hc-28", cat: "hot-coffee", ar: "قرفة جنزبيل حليب", en: "Cinnamon Ginger with Milk", price: 25 },
  { id: "hc-29", cat: "hot-coffee", ar: "هوت سيدر", en: "Hot Cider", price: 25 },
  { id: "hc-30", cat: "hot-coffee", ar: "أعشاب", en: "Herbal Tea", price: 25 },
  { id: "hc-31", cat: "hot-coffee", ar: "هوت شوكليت", en: "Hot Chocolate", price: 30 },
  { id: "hc-32", cat: "hot-coffee", ar: "هوت شوكليت نوتيلا", en: "Nutella Hot Chocolate", price: 35 },
  { id: "hc-33", cat: "hot-coffee", ar: "هوت شوكليت مارشميلو", en: "Marshmallow Hot Chocolate", price: 35 },
  { id: "hc-34", cat: "hot-coffee", ar: "سحلب مكسرات", en: "Sahlab with Nuts", price: 35, best: true },
  { id: "hc-35", cat: "hot-coffee", ar: "سحلب نوتيلا", en: "Nutella Sahlab", price: 35 },
  { id: "hc-36", cat: "hot-coffee", ar: "سحلب لوتس", en: "Lotus Sahlab", price: 35 },
  { id: "hc-37", cat: "hot-coffee", ar: "سحلب بستاشيو", en: "Pistachio Sahlab", price: 40 },
  { id: "hc-38", cat: "hot-coffee", ar: "هوت أوريو", en: "Hot Oreo", price: 35 },
  { id: "hc-39", cat: "hot-coffee", ar: "هوت لوتس", en: "Hot Lotus", price: 35 },

  /* ---- 2. ICE COFFEE ---------------------------------------------------- */
  { id: "ic-01", cat: "ice-coffee", ar: "أيس كوفي", en: "Ice Coffee", price: 30, best: true },
  { id: "ic-02", cat: "ice-coffee", ar: "أيس لاتيه", en: "Ice Latte", price: 35, best: true },
  { id: "ic-03", cat: "ice-coffee", ar: "أيس موكا", en: "Ice Mocha", price: 35 },
  { id: "ic-04", cat: "ice-coffee", ar: "أيس كراميل ميكاتو", en: "Ice Caramel Macchiato", price: 35 },
  { id: "ic-05", cat: "ice-coffee", ar: "ستروبري أيس موكا", en: "Strawberry Ice Mocha", price: 35 },
  { id: "ic-06", cat: "ice-coffee", ar: "أيس كابتشينو", en: "Ice Cappuccino", price: 35 },
  { id: "ic-07", cat: "ice-coffee", ar: "أيس أوريو لاتيه", en: "Ice Oreo Latte", price: 35 },
  { id: "ic-08", cat: "ice-coffee", ar: "أيس وايت موكا", en: "Ice White Mocha", price: 40 },
  { id: "ic-09", cat: "ice-coffee", ar: "بانانا موكا لاتيه", en: "Banana Mocha Latte", price: 45, best: true },

  /* ---- 3. FRAPPE -------------------------------------------------------- */
  { id: "fr-01", cat: "frappe", ar: "فرابيه كوفي", en: "Coffee Frappe", price: 35, best: true },
  { id: "fr-02", cat: "frappe", ar: "فرابيه فانيليا", en: "Vanilla Frappe", price: 35 },
  { id: "fr-03", cat: "frappe", ar: "فرابيه شوكلت", en: "Chocolate Frappe", price: 35 },
  { id: "fr-04", cat: "frappe", ar: "فرابيه كراميل", en: "Caramel Frappe", price: 35 },
  { id: "fr-05", cat: "frappe", ar: "فرابيه نوتيلا", en: "Nutella Frappe", price: 35 },
  { id: "fr-06", cat: "frappe", ar: "فرابيه فراولة", en: "Strawberry Frappe", price: 35 },
  { id: "fr-07", cat: "frappe", ar: "فرابيه مانجو", en: "Mango Frappe", price: 35 },
  { id: "fr-08", cat: "frappe", ar: "فرابتشينو", en: "Frappuccino", price: 40 },
  { id: "fr-09", cat: "frappe", ar: "أوريو موكا فرابيه", en: "Oreo Mocha Frappe", price: 45, best: true },

  /* ---- 4. SMOOTHIE ------------------------------------------------------ */
  { id: "sm-01", cat: "smoothie", ar: "سموزي أناناس", en: "Pineapple Smoothie", price: 30 },
  { id: "sm-02", cat: "smoothie", ar: "سموزي بلو هاواي", en: "Blue Hawaii Smoothie", price: 30, best: true },
  { id: "sm-03", cat: "smoothie", ar: "سموزي بلو بيري", en: "Blueberry Smoothie", price: 30 },
  { id: "sm-04", cat: "smoothie", ar: "سموزي ميكس بيري", en: "Mixed Berry Smoothie", price: 30 },
  { id: "sm-05", cat: "smoothie", ar: "سموزي كيوى", en: "Kiwi Smoothie", price: 30 },
  { id: "sm-06", cat: "smoothie", ar: "سموزي فراولة", en: "Strawberry Smoothie", price: 30 },
  { id: "sm-07", cat: "smoothie", ar: "سموزي مانجو", en: "Mango Smoothie", price: 30, best: true },
  { id: "sm-08", cat: "smoothie", ar: "سموزي باشون فروت", en: "Passion Fruit Smoothie", price: 30 },
  { id: "sm-09", cat: "smoothie", ar: "سموزي بطيخ", en: "Watermelon Smoothie", price: 30 },
  { id: "sm-10", cat: "smoothie", ar: "سموزي خوخ", en: "Peach Smoothie", price: 30 },
  { id: "sm-11", cat: "smoothie", ar: "سموزي تفاح أخضر", en: "Green Apple Smoothie", price: 30 },

  /* ---- 5. FRESH JUICES -------------------------------------------------- */
  { id: "ju-01", cat: "juice", ar: "مانجو", en: "Mango Juice", price: 30, best: true },
  { id: "ju-02", cat: "juice", ar: "فراولة", en: "Strawberry Juice", price: 30 },
  { id: "ju-03", cat: "juice", ar: "برتقال", en: "Orange Juice", price: 30 },
  { id: "ju-04", cat: "juice", ar: "جوافة", en: "Guava Juice", price: 30 },
  { id: "ju-05", cat: "juice", ar: "أناناس", en: "Pineapple Juice", price: 30 },
  { id: "ju-06", cat: "juice", ar: "كيوى", en: "Kiwi Juice", price: 45 },
  { id: "ju-07", cat: "juice", ar: "جوافة حليب", en: "Guava with Milk", price: 35 },
  { id: "ju-08", cat: "juice", ar: "موز حليب", en: "Banana with Milk", price: 35, best: true },
  { id: "ju-09", cat: "juice", ar: "فراولة موز حليب", en: "Strawberry Banana with Milk", price: 40 },
  { id: "ju-10", cat: "juice", ar: "ليمون نعناع", en: "Lemon Mint", price: 30, best: true },
  { id: "ju-11", cat: "juice", ar: "بلح عسل مكسرات", en: "Dates, Honey & Nuts", price: 40 },
  { id: "ju-12", cat: "juice", ar: "فراولة موز", en: "Strawberry Banana", price: 35 },

  /* ---- 6. MOJITO -------------------------------------------------------- */
  { id: "mo-01", cat: "mojito", ar: "موهيتو", en: "Classic Mojito", price: 45, best: true },
  { id: "mo-02", cat: "mojito", ar: "بلو و بينابيل", en: "Blue & Pineapple", price: 45 },
  { id: "mo-03", cat: "mojito", ar: "كرز", en: "Cherry", price: 45 },
  { id: "mo-04", cat: "mojito", ar: "كولا", en: "Cola", price: 45 },
  { id: "mo-05", cat: "mojito", ar: "ريد بول", en: "Red Bull", price: 50, best: true },
  { id: "mo-06", cat: "mojito", ar: "باشون فروت", en: "Passion Fruit", price: 45 },
  { id: "mo-07", cat: "mojito", ar: "مانجو", en: "Mango", price: 45 },
  { id: "mo-08", cat: "mojito", ar: "ستروبيري", en: "Strawberry", price: 45 },
  { id: "mo-09", cat: "mojito", ar: "ميكس بيري", en: "Mixed Berry", price: 45 },
  { id: "mo-10", cat: "mojito", ar: "بلو بيري", en: "Blueberry", price: 50 },
  { id: "mo-11", cat: "mojito", ar: "بطيخ", en: "Watermelon", price: 45 },
  { id: "mo-12", cat: "mojito", ar: "خوخ", en: "Peach", price: 45 },
  { id: "mo-13", cat: "mojito", ar: "كيوي", en: "Kiwi", price: 45 },
  { id: "mo-14", cat: "mojito", ar: "صن شاين", en: "Sunshine", price: 50, best: true },
  { id: "mo-15", cat: "mojito", ar: "صن رايز", en: "Sunrise", price: 50 },
  { id: "mo-16", cat: "mojito", ar: "تفاح", en: "Apple", price: 45 },

  /* ---- 7. MILKSHAKES ---------------------------------------------------- */
  { id: "mk-01", cat: "milkshake", ar: "أوريو", en: "Oreo", price: 50, best: true },
  { id: "mk-02", cat: "milkshake", ar: "بوبير", en: "Bubbler", price: 45 },
  { id: "mk-03", cat: "milkshake", ar: "كراميل", en: "Caramel", price: 45 },
  { id: "mk-04", cat: "milkshake", ar: "شوكليت", en: "Chocolate", price: 45 },
  { id: "mk-05", cat: "milkshake", ar: "لوتس", en: "Lotus", price: 45, best: true },
  { id: "mk-06", cat: "milkshake", ar: "بستاشيو", en: "Pistachio", price: 50 },
  { id: "mk-07", cat: "milkshake", ar: "فانيليا", en: "Vanilla", price: 45 },
  { id: "mk-08", cat: "milkshake", ar: "مانجو", en: "Mango", price: 45 },
  { id: "mk-09", cat: "milkshake", ar: "فراولة", en: "Strawberry", price: 45 },
  { id: "mk-10", cat: "milkshake", ar: "بلو بيري", en: "Blueberry", price: 45 },
  { id: "mk-11", cat: "milkshake", ar: "أناناس", en: "Pineapple", price: 45 },
  { id: "mk-12", cat: "milkshake", ar: "كيوي", en: "Kiwi", price: 45 },
  { id: "mk-13", cat: "milkshake", ar: "باشون فروت", en: "Passion Fruit", price: 45 },
  { id: "mk-14", cat: "milkshake", ar: "بطيخ", en: "Watermelon", price: 45 },
  { id: "mk-15", cat: "milkshake", ar: "خوخ", en: "Peach", price: 45 },
  { id: "mk-16", cat: "milkshake", ar: "ميكس بيري", en: "Mixed Berry", price: 45 },
  { id: "mk-17", cat: "milkshake", ar: "هوهوز", en: "HoHos", price: 50 },
  { id: "mk-18", cat: "milkshake", ar: "بانانا شوكليت", en: "Banana Chocolate", price: 50, best: true },
  { id: "mk-19", cat: "milkshake", ar: "بندق", en: "Hazelnut", price: 45 },

  /* ---- 8. MIX SOS ------------------------------------------------------- */
  { id: "mx-01", cat: "mix-sos", ar: "بينا كولادا", en: "Pina Colada", price: 45, best: true },
  { id: "mx-02", cat: "mix-sos", ar: "جوافة كولادا", en: "Guava Colada", price: 45 },
  { id: "mx-03", cat: "mix-sos", ar: "بلو بيري كاكاو", en: "Blueberry Cacao", price: 40 },
  { id: "mx-04", cat: "mix-sos", ar: "باشون فروت تروبيكال", en: "Tropical Passion Fruit", price: 40 },
  { id: "mx-05", cat: "mix-sos", ar: "أيس باشون فروت", en: "Ice Passion Fruit", price: 40 },
  { id: "mx-06", cat: "mix-sos", ar: "بلو ليمونيد بينك صودا", en: "Blue Lemonade Pink Soda", price: 40 },
  { id: "mx-07", cat: "mix-sos", ar: "تروبيكال ليمونيد", en: "Tropical Lemonade", price: 40 },
  { id: "mx-08", cat: "mix-sos", ar: "اورنج فروست", en: "Orange Frost", price: 40 },
  { id: "mx-09", cat: "mix-sos", ar: "بلو اورنج انرجي", en: "Blue Orange Energy", price: 40 },
  { id: "mx-10", cat: "mix-sos", ar: "SOS DRINK", en: "SOS Drink", price: 45, best: true },

  /* ---- 9. WAFFLE (L / XL) ----------------------------------------------- */
  { id: "wf-01", cat: "waffle", ar: "وافل نوتيلا", en: "Nutella Waffle", sizes: { L: 40, XL: 70 }, best: true },
  { id: "wf-02", cat: "waffle", ar: "وافل بستاشيو", en: "Pistachio Waffle", sizes: { L: 45, XL: 75 }, best: true },
  { id: "wf-03", cat: "waffle", ar: "وافل كيندر", en: "Kinder Waffle", sizes: { L: 45, XL: 75 } },
  { id: "wf-04", cat: "waffle", ar: "وافل أوريو", en: "Oreo Waffle", sizes: { L: 45, XL: 75 } },
  { id: "wf-05", cat: "waffle", ar: "وافل وايت شوكليت", en: "White Chocolate Waffle", sizes: { L: 35, XL: 65 } },
  { id: "wf-06", cat: "waffle", ar: "وافل لوتس", en: "Lotus Waffle", sizes: { L: 35, XL: 65 }, best: true },
  { id: "wf-07", cat: "waffle", ar: "وافل كراميل", en: "Caramel Waffle", sizes: { L: 35, XL: 65 } },
  { id: "wf-08", cat: "waffle", ar: "وافل دارك شوكليت", en: "Dark Chocolate Waffle", sizes: { L: 35, XL: 65 } },

  /* ---- 10. PANCAKE (L / XL) --------------------------------------------- */
  { id: "pc-01", cat: "pancake", ar: "بان كيك نوتيلا", en: "Nutella Pancake", sizes: { L: 40, XL: 60 }, best: true },
  { id: "pc-02", cat: "pancake", ar: "بان كيك بستاشيو", en: "Pistachio Pancake", sizes: { L: 45, XL: 65 } },
  { id: "pc-03", cat: "pancake", ar: "بان كيك كيندر", en: "Kinder Pancake", sizes: { L: 45, XL: 65 }, best: true },
  { id: "pc-04", cat: "pancake", ar: "بان كيك أوريو", en: "Oreo Pancake", sizes: { L: 45, XL: 65 } },
  { id: "pc-05", cat: "pancake", ar: "بان كيك وايت شوكليت", en: "White Chocolate Pancake", sizes: { L: 35, XL: 55 } },
  { id: "pc-06", cat: "pancake", ar: "بان كيك لوتس", en: "Lotus Pancake", sizes: { L: 35, XL: 55 } },
  { id: "pc-07", cat: "pancake", ar: "بان كيك كراميل", en: "Caramel Pancake", sizes: { L: 35, XL: 55 } },
  { id: "pc-08", cat: "pancake", ar: "بان كيك دارك شوكليت", en: "Dark Chocolate Pancake", sizes: { L: 35, XL: 55 } },

  /* ---- 11. FATTAH ------------------------------------------------------- */
  { id: "ft-01", cat: "fattah", ar: "فتة وافل بان كيك", en: "Waffle & Pancake Fattah", price: 70, best: true },
  { id: "ft-02", cat: "fattah", ar: "فتة وافل فريسكا", en: "Waffle & Freska Fattah", price: 70, best: true },

  /* ---- 12. FRESKA ------------------------------------------------------- */
  { id: "fk-01", cat: "freska", ar: "فريسكا نوتيلا", en: "Nutella Freska", price: 35, best: true },
  { id: "fk-02", cat: "freska", ar: "فريسكا بستاشيو", en: "Pistachio Freska", price: 40 },
  { id: "fk-03", cat: "freska", ar: "فريسكا كيندر", en: "Kinder Freska", price: 40 },
  { id: "fk-04", cat: "freska", ar: "فريسكا أوريو", en: "Oreo Freska", price: 40, best: true },
  { id: "fk-05", cat: "freska", ar: "فريسكا هوهوز", en: "HoHos Freska", price: 40 },
  { id: "fk-06", cat: "freska", ar: "فريسكا وايت شوكليت", en: "White Chocolate Freska", price: 30 },
  { id: "fk-07", cat: "freska", ar: "فريسكا لوتس", en: "Lotus Freska", price: 30 },
  { id: "fk-08", cat: "freska", ar: "فريسكا كراميل", en: "Caramel Freska", price: 30 },
  { id: "fk-09", cat: "freska", ar: "فريسكا دارك شوكليت", en: "Dark Chocolate Freska", price: 30 },

  /* ---- 13. RICE PUDDING -------------------------------------------------- */
  { id: "rp-01", cat: "rice-pudding", ar: "رز بلبن ساده", en: "Plain Rice Pudding", price: 25, best: true },
  { id: "rp-02", cat: "rice-pudding", ar: "رز بلبن هوهوز", en: "HoHos Rice Pudding", price: 35 },
  { id: "rp-03", cat: "rice-pudding", ar: "رز بلبن أوريو", en: "Oreo Rice Pudding", price: 35, best: true },

  /* ---- 14. ADD-ONS ------------------------------------------------------- */
  { id: "ad-01", cat: "addons", ar: "بستاشيو", en: "Pistachio", price: 10 },
  { id: "ad-02", cat: "addons", ar: "كيندر", en: "Kinder", price: 10 },
  { id: "ad-03", cat: "addons", ar: "أوريو", en: "Oreo", price: 10 },
  { id: "ad-04", cat: "addons", ar: "نوتيلا", en: "Nutella", price: 10 },
  { id: "ad-05", cat: "addons", ar: "مكسرات", en: "Mixed Nuts", price: 10 },
  { id: "ad-06", cat: "addons", ar: "وايت شوكليت", en: "White Chocolate", price: 5 },
  { id: "ad-07", cat: "addons", ar: "فواكه", en: "Fresh Fruit", price: 15 },
  { id: "ad-08", cat: "addons", ar: "دارك شوكليت", en: "Dark Chocolate", price: 5 },
  { id: "ad-09", cat: "addons", ar: "كراميل", en: "Caramel", price: 5 },
  { id: "ad-10", cat: "addons", ar: "لوتس", en: "Lotus", price: 5 },
  { id: "ad-11", cat: "addons", ar: "أيس كريم", en: "Ice Cream", price: 10 },
];

/* -------------------------------------------------------------------------- */
/*  DERIVED HELPERS                                                           */
/* -------------------------------------------------------------------------- */

/** Lowest price for an item — used for sorting and "from" labels. */
export function minPrice(item: MenuItem): number {
  return item.sizes ? item.sizes.L : (item.price ?? 0);
}

/** Highest price for an item. */
export function maxPrice(item: MenuItem): number {
  return item.sizes ? item.sizes.XL : (item.price ?? 0);
}

export const CATEGORY_MAP: Record<CategoryId, Category> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<CategoryId, Category>
);

/** Item counts per category, for the filter-pill badges. */
export const CATEGORY_COUNTS: Record<CategoryId, number> = MENU_ITEMS.reduce(
  (acc, item) => {
    acc[item.cat] = (acc[item.cat] ?? 0) + 1;
    return acc;
  },
  {} as Record<CategoryId, number>
);

export const TOTAL_ITEMS = MENU_ITEMS.length;

export const PRICE_RANGE = {
  min: Math.min(...MENU_ITEMS.map(minPrice)),
  max: Math.max(...MENU_ITEMS.map(maxPrice)),
};
