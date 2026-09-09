import type { Metadata, Viewport } from "next";
import { Cairo, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import { STORE } from "@/lib/dictionary";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

/**
 * Display face for headlines.
 *
 * Latin only — Arabic headings stay on Cairo, which sits next in the
 * `--font-display` stack. Loaded at 500-700 only; the lighter weights are
 * never used at display size and would just cost bytes.
 */
const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sos-bakery-coffee.example"),
  title: {
    default: "SOS Bakery And Coffee — حوش عيسى | قهوة مختصة ومخبوزات طازجة",
    template: "%s | SOS Bakery And Coffee",
  },
  description:
    "SOS Bakery And Coffee في حوش عيسى، بجوار مسجد العاشر. قهوة مختصة، وافل وبان كيك طازج، عصائر فريش، موهيتو وميلك شيك. أكثر من 160 صنف. اطلب الآن 01034326985.",
  keywords: [
    "SOS Bakery And Coffee",
    "قهوة حوش عيسى",
    "كافيه حوش عيسى",
    "وافل حوش عيسى",
    "بان كيك",
    "قهوة مختصة",
    "البحيرة",
    "Housh Eissa coffee",
    "specialty coffee Egypt",
  ],
  authors: [{ name: STORE.nameEn }],
  openGraph: {
    type: "website",
    locale: "ar_EG",
    alternateLocale: "en_US",
    siteName: STORE.nameEn,
    title: "SOS Bakery And Coffee — من قلب حوش عيسى",
    description:
      "قهوة مختصة تُحضَّر لحظة الطلب، ومخبوزات طازجة، ومشروبات منعشة. حوش عيسى — بجوار مسجد العاشر.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SOS Bakery And Coffee — من قلب حوش عيسى",
    description: "قهوة مختصة ومخبوزات طازجة في حوش عيسى. أكثر من 160 صنف.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#07070B",
  width: "device-width",
  initialScale: 1,
  // Zoom is never disabled — pinch-to-zoom stays available (a11y requirement).
  maximumScale: 5,
};

/** Local-business structured data, so the shop shows up properly in search. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CafeOrCoffeeShop",
  name: STORE.nameEn,
  alternateName: STORE.nameAr,
  foundingDate: STORE.est,
  telephone: `+${STORE.whatsapp}`,
  priceRange: "EGP 5 - EGP 75",
  servesCuisine: ["Coffee", "Bakery", "Desserts", "Juices"],
  address: {
    "@type": "PostalAddress",
    streetAddress: STORE.addressEn,
    addressLocality: "Housh Eissa",
    addressRegion: "Beheira",
    addressCountry: "EG",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "09:00",
      closes: "01:00",
    },
  ],
  sameAs: [STORE.tiktokHref],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Arabic + RTL is the server-rendered default; the provider swaps it live.
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${jakarta.variable} ${space.variable}`}
    >
      {/* `grain` lays a fixed film-grain overlay over everything, which is what
          keeps a near-black background from banding on cheap panels. */}
      <body className="grain bg-sand-50 text-espresso antialiased">
        {/* Scroll-reveal wrappers start at opacity 0 and are animated in by JS.
            If JS never runs, force them visible so the page is still readable. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
