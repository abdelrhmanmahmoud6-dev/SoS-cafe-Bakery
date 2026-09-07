import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Menu } from "@/components/Menu";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { getMenu, getAddons } from "@/lib/menu-service";

// The menu is admin-editable, so the storefront is rendered per request rather
// than baked at build time.
export const dynamic = "force-dynamic";

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
