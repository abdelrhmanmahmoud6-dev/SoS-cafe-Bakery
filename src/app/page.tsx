import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Menu } from "@/components/Menu";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { getMenu, getAddons } from "@/lib/menu-service";

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
  const [menu, addons] = await Promise.all([getMenu(), getAddons()]);

  return (
    <>
      <Navbar />
      <main id="main">
        <Hero itemCount={menu.total} categoryCount={menu.categories.length} />
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
