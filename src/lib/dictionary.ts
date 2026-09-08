/* ============================================================================
   SOS BAKERY AND COFFEE — CENTRALISED BILINGUAL DICTIONARY
   Every user-facing string on the site lives here. Menu item names live in
   menu-data.ts (each item carries its own `ar` / `en` pair).
   ========================================================================== */

export type Lang = "ar" | "en";

export const STORE = {
  nameEn: "SOS Bakery And Coffee",
  nameAr: "SOS بيكري آند كوفي",
  est: "2026",
  phone: "01034326985",
  /** E.164 without the + , for wa.me links */
  whatsapp: "201034326985",
  phoneHref: "tel:+201034326985",
  whatsappHref: "https://wa.me/201034326985",
  tiktokHref: "https://www.tiktok.com/@soscafe1?_r=1&_t=ZS-99VhWR9MxHB",
  facebookHref: "https://www.facebook.com/share/18K17gZYJY/?mibextid=wwXIfr",
    mapsHref:
    "https://www.google.com/maps/place/%D9%85%D8%B3%D8%AC%D8%AF+%D8%A7%D9%84%D8%B9%D8%A7%D8%B4%D8%B1+%D9%85%D9%86+%D8%B1%D9%85%D8%B6%D8%A7%D9%86/@30.917775,30.301254,89m/data=!3m1!1e3!4m6!3m5!1s0x14f60e5ee95a9f21:0x8ba0a30a243ebe97!8m2!3d30.9177754!4d30.3012535!16s%2Fg%2F11csq8w78b",
  /** Coordinates of the shop, used by the embedded map. */
  lat: 30.9177754,
  lng: 30.3012535,
  addressAr: "حوش عيسى — بجوار مسجد العاشر",
  addressEn: "Housh Eissa — Next to Al-Asher Mosque",
  governorateAr: "البحيرة، مصر",
  governorateEn: "Beheira, Egypt",
  /** Daily opening hours in 24h local time, used by the live status card. */
  hours: { open: 9, close: 25 }, // 09:00 -> 01:00 next day
} as const;

export const DICT = {
  ar: {
    dir: "rtl",
    langName: "العربية",
    langSwitchTo: "English",
    currency: "ج.م",
    from: "يبدأ من",
    itemsWord: "صنف",

    nav: {
      home: "الرئيسية",
      about: "من نحن",
      menu: "المنيو",
      contact: "تواصل معنا",
      callNow: "اتصل الآن",
      whatsapp: "واتساب",
      openMenu: "فتح القائمة",
      closeMenu: "إغلاق القائمة",
      skipToContent: "تخطَّ إلى المحتوى",
    },

    hero: {
      badge: "تأسست 2026",
      titleLine1: "SOS Bakery",
      titleLine2: "And Coffee",
      location: "من قلب حوش عيسى",
      subtitle:
        "قهوة مختصة تُحضَّر لحظة الطلب، ومخبوزات طازجة تخرج من الفرن طول اليوم، ومشروبات منعشة تناسب كل مزاج — كل ده في مكان واحد.",
      ctaMenu: "تصفّح القائمة",
      ctaCall: "اتصل بنا",
      statItems: "صنف في المنيو",
      statCategories: "قسم متنوع",
      statFresh: "طازج يوميًا",
      scroll: "انزل لتكتشف المزيد",
    },

    about: {
      eyebrow: "قصتنا",
      title: "شغف بالقهوة والمخبوزات",
      lead:
        "بدأت SOS من فكرة بسيطة: إن أهل حوش عيسى يستاهلوا فنجان قهوة محضّر صح، وحتة حلو طالعة من الفرن دلوقتي — مش من تلاجة العرض.",
      body1:
        "بنطحن حبوب القهوة أول بأول، وبنعجن ونخبز الوافل والبان كيك عند الطلب، وبنعصر الفاكهة قدامك. مفيش تحضير من بدري، ومفيش تسخين تاني.",
      body2:
        "من أول شاي بعشرة جنيه لحد فتة الوافل اللي بتتشارك مع اتنين، هدفنا واحد: إن اللي يدخل عندنا مرة، يرجع تاني ويجيب معاه حد.",
      valuesTitle: "اللي بنمشي عليه",
      values: [
        {
          title: "التميز في التحضير",
          desc: "باريستا مدرَّب، معايرة ثابتة لكل مشروب، وتحضير لحظي قدامك — عشان الطعم يطلع نفسه كل مرة.",
        },
        {
          title: "الجودة أولاً",
          desc: "خامات مختارة بعناية ولبن كامل الدسم وفاكهة طازجة. مفيش بودرة ولا مركّزات ولا نكهات صناعية.",
        },
        {
          title: "تشكيلة تناسب مزاجك",
          desc: "أكتر من 160 صنف بين ساخن وبارد وحلو. مهما كان مزاجك أو الوقت، هتلاقي حاجة على قدك.",
        },
      ],
      highlightsTitle: "اللي هتلاقيه عندنا",
      highlights: [
        {
          title: "قهوة مختصة",
          desc: "إسبريسو، لاتيه، تركي، وسحلب بالمكسرات — سخن أو مثلج.",
        },
        {
          title: "مخبوزات طازجة",
          desc: "وافل وبان كيك وفريسكا وفتة، بحجمين L و XL.",
        },
        {
          title: "مشروبات منعشة",
          desc: "عصائر فريش وموهيتو وسموزي وميلك شيك وخلطات SOS.",
        },
      ],
    },

    menu: {
      eyebrow: "القائمة الكاملة",
      title: "كل حاجة عندنا",
      subtitle: "أسعارنا بالجنيه المصري وشاملة الخدمة. اضغط على أي صنف تشوف تفاصيله أو تطلبه واتساب.",
      searchPlaceholder: "دوّر على صنف… مثلاً: لاتيه، وافل، موهيتو",
      searchLabel: "البحث في المنيو",
      clearSearch: "مسح البحث",
      all: "الكل",
      sortLabel: "ترتيب حسب",
      sort: {
        default: "الافتراضي",
        priceAsc: "السعر: من الأقل للأعلى",
        priceDesc: "السعر: من الأعلى للأقل",
        nameAsc: "الاسم: أ — ي",
      },
      resultsCount: (n: number) => `${n} صنف`,
      bestSeller: "الأكثر طلبًا",
      sizeL: "وسط L",
      sizeXL: "كبير XL",
      orderWhatsapp: "اطلب واتساب",
      quickView: "عرض سريع",
      details: "تفاصيل الصنف",
      close: "إغلاق",
      emptyTitle: "مفيش نتائج للبحث ده",
      emptyBody: "جرّب كلمة أقصر أو اسم مختلف — مثلاً «قهوة» بدل «قهوة تركي دبل».",
      emptySuggestions: "أو جرّب واحدة من دول:",
      resetFilters: "إظهار كل الأصناف",
      showMore: "عرض المزيد",
      categoryLabel: "أقسام المنيو",
      scrollPrev: "الأقسام السابقة",
      scrollNext: "الأقسام التالية",
      inCategory: "ضمن قسم",
      addonNote: "الإضافات تُضاف على أي صنف من الوافل أو البان كيك أو الفريسكا.",
    },

    contact: {
      eyebrow: "تواصل معنا",
      title: "تعالى عندنا أو اطلب دلوقتي",
      subtitle: "إحنا في حوش عيسى، بجوار مسجد العاشر. اتصل بينا أو ابعتلنا واتساب وهنجهزلك طلبك.",
      callTitle: "اتصل بينا",
      callDesc: "كلمنا مباشرة لطلب أو استفسار",
      whatsappTitle: "واتساب",
      whatsappDesc: "ابعت طلبك وهيوصلك رد فورًا",
      addressTitle: "العنوان",
      addressDesc: "حوش عيسى — بجوار مسجد العاشر",
      directions: "افتح على الخريطة",
      hoursTitle: "مواعيد العمل",
      hoursValue: "يوميًا من 9 صباحًا حتى 1 بعد منتصف الليل",
      openNow: "مفتوح الآن",
      closedNow: "مغلق حاليًا",
      opensAt: "نفتح 9 صباحًا",
      closesAt: "نغلق 1 بعد منتصف الليل",
      statusLabel: "حالة المحل",
    },

    footer: {
      tagline: "قهوة مختصة ومخبوزات طازجة من قلب حوش عيسى.",
      quickLinks: "روابط سريعة",
      contactUs: "للتواصل",
      followUs: "تابعنا",
      rights: "جميع الحقوق محفوظة.",
      backToTop: "العودة للأعلى",
      madeWith: "صُنع بشغف في حوش عيسى",
    },

    a11y: {
      switchLang: "تغيير اللغة إلى الإنجليزية",
      brandHome: "SOS بيكري آند كوفي — الصفحة الرئيسية",
      selectCategory: (name: string) => `عرض قسم ${name}`,
      openItem: (name: string) => `عرض تفاصيل ${name}`,
      orderItem: (name: string) => `اطلب ${name} عبر واتساب`,
    },
  },

  en: {
    dir: "ltr",
    langName: "English",
    langSwitchTo: "العربية",
    currency: "EGP",
    from: "from",
    itemsWord: "items",

    nav: {
      home: "Home",
      about: "About Us",
      menu: "Menu",
      contact: "Contact",
      callNow: "Call Now",
      whatsapp: "WhatsApp",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      skipToContent: "Skip to content",
    },

    hero: {
      badge: "Est. 2026",
      titleLine1: "SOS Bakery",
      titleLine2: "And Coffee",
      location: "From the heart of Housh Eissa",
      subtitle:
        "Specialty coffee pulled the moment you order, bakery that leaves the oven all day long, and refreshing drinks for every mood — all under one roof.",
      ctaMenu: "Browse the Menu",
      ctaCall: "Call Us",
      statItems: "Menu items",
      statCategories: "Categories",
      statFresh: "Made fresh daily",
      scroll: "Scroll to explore",
    },

    about: {
      eyebrow: "Our Story",
      title: "A Passion for Coffee & Baking",
      lead:
        "SOS started from one simple idea: the people of Housh Eissa deserve a cup of coffee made properly, and a dessert that comes out of the oven now — not out of a display fridge.",
      body1:
        "We grind our beans in small batches, mix and bake the waffles and pancakes to order, and squeeze the fruit right in front of you. Nothing is prepped hours ahead, and nothing is reheated.",
      body2:
        "From a ten-pound cup of tea to a waffle fattah big enough for two, the goal is the same: whoever walks in once should come back — and bring someone with them.",
      valuesTitle: "What We Stand For",
      values: [
        {
          title: "Specialty Preparation",
          desc: "Trained baristas, consistent calibration on every drink, and everything built in front of you — so the taste lands the same way every time.",
        },
        {
          title: "Quality First",
          desc: "Carefully sourced ingredients, full-fat milk and fresh fruit. No powders, no concentrates, no artificial flavouring.",
        },
        {
          title: "Variety for Every Mood",
          desc: "More than 160 items across hot, cold and sweet. Whatever the mood or the hour, there's something that fits.",
        },
      ],
      highlightsTitle: "What You'll Find Here",
      highlights: [
        {
          title: "Specialty Coffee",
          desc: "Espresso, latte, Turkish and sahlab with nuts — hot or over ice.",
        },
        {
          title: "Fresh Bakery",
          desc: "Waffles, pancakes, freska and fattah, in L and XL sizes.",
        },
        {
          title: "Refreshing Beverages",
          desc: "Fresh juices, mojitos, smoothies, milkshakes and SOS house mixes.",
        },
      ],
    },

    menu: {
      eyebrow: "The Full Menu",
      title: "Everything We Serve",
      subtitle: "All prices in Egyptian Pounds, service included. Tap any item for details or to order on WhatsApp.",
      searchPlaceholder: "Search the menu… try: latte, waffle, mojito",
      searchLabel: "Search the menu",
      clearSearch: "Clear search",
      all: "All",
      sortLabel: "Sort by",
      sort: {
        default: "Default",
        priceAsc: "Price: low to high",
        priceDesc: "Price: high to low",
        nameAsc: "Name: A — Z",
      },
      resultsCount: (n: number) => `${n} ${n === 1 ? "item" : "items"}`,
      bestSeller: "Best Seller",
      sizeL: "Regular L",
      sizeXL: "Large XL",
      orderWhatsapp: "Order on WhatsApp",
      quickView: "Quick view",
      details: "Item details",
      close: "Close",
      emptyTitle: "No results for that search",
      emptyBody: "Try a shorter word or a different name — for example “coffee” instead of “double Turkish coffee”.",
      emptySuggestions: "Or try one of these:",
      resetFilters: "Show all items",
      showMore: "Show more",
      categoryLabel: "Menu categories",
      scrollPrev: "Previous categories",
      scrollNext: "Next categories",
      inCategory: "in",
      addonNote: "Add-ons can be added to any waffle, pancake or freska.",
    },

    contact: {
      eyebrow: "Get in Touch",
      title: "Visit Us or Order Now",
      subtitle: "We're in Housh Eissa, right next to Al-Asher Mosque. Call us or send a WhatsApp and we'll have it ready.",
      callTitle: "Call Us",
      callDesc: "Reach us directly to order or ask",
      whatsappTitle: "WhatsApp",
      whatsappDesc: "Send your order and get a reply straight away",
      addressTitle: "Address",
      addressDesc: "Housh Eissa — Next to Al-Asher Mosque",
      directions: "Open in Maps",
      hoursTitle: "Opening Hours",
      hoursValue: "Daily from 9:00 AM until 1:00 AM",
      openNow: "Open Now",
      closedNow: "Currently Closed",
      opensAt: "Opens at 9:00 AM",
      closesAt: "Closes at 1:00 AM",
      statusLabel: "Store status",
    },

    footer: {
      tagline: "Specialty coffee and fresh bakery from the heart of Housh Eissa.",
      quickLinks: "Quick Links",
      contactUs: "Contact",
      followUs: "Follow Us",
      rights: "All rights reserved.",
      backToTop: "Back to top",
      madeWith: "Made with passion in Housh Eissa",
    },

    a11y: {
      switchLang: "Switch language to Arabic",
      brandHome: "SOS Bakery And Coffee — home",
      selectCategory: (name: string) => `Show ${name} category`,
      openItem: (name: string) => `View details for ${name}`,
      orderItem: (name: string) => `Order ${name} on WhatsApp`,
    },
  },
} as const;

export type Dictionary = (typeof DICT)["ar"];

/** Search suggestions offered on the empty-results state. */
export const SEARCH_SUGGESTIONS: { ar: string; en: string }[] = [
  { ar: "لاتيه", en: "Latte" },
  { ar: "وافل", en: "Waffle" },
  { ar: "موهيتو", en: "Mojito" },
  { ar: "أوريو", en: "Oreo" },
  { ar: "مانجو", en: "Mango" },
];
