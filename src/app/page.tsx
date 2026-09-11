import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Menu } from "@/components/Menu";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { ScrollReset } from "@/components/ScrollReset";
import { getMenu } from "@/lib/menu-service";

/**
 * Incremental static regeneration rather than `force-dynamic`.
 *
 * The menu changes a few times a week, not per request. Rendering dynamically
 * meant every single visitor waited on a Postgres round trip — and on a Neon
 * cold start, waited seconds for the endpoint to resume. Serving a cached page
 * takes the database off the critical path for almost all traffic.
 *
 * Freshness is preserved on both edges: the page revalidates every 5 minutes,
 * and every admin mutation calls `revalidatePath("/")`, so a price or
 * availability change is published immediately rather than after the window.
 */
export const revalidate = 300;

export default async function HomePage() {
  const menu = await getMenu();

  // Add-ons are already in the menu payload, so deriving them here saves a
  // third round trip to Postgres on every render.
  const addons = menu.items.filter((i) => i.cat === "addons" && i.available);

  // Photos for the hero cursor trail. Best-sellers first so the effect shows
  // off what the shop actually wants to sell, deduplicated because several
  // items in a section can share one stock photo and a trail that repeats the
  // same picture twice in a row looks broken rather than deliberate.
  const heroPhotos = [
    ...new Set(
      menu.items
        .filter((i) => i.available && i.imageUrl)
        .sort((a, b) => Number(b.best) - Number(a.best))
        .map((i) => i.imageUrl as string)
    ),
  ].slice(0, 10);

  return (
    <>
      <ScrollReset />
      <Navbar />
      <main id="main">
        <Hero
          itemCount={menu.total}
          categoryCount={menu.categories.length}
          photos={heroPhotos}
        />
        <About counts={menu.counts} />
        <Menu
          categories={menu.categories}
          items={menu.items}
          counts={menu.counts}
          addons={addons}
        />
        <Contact />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
