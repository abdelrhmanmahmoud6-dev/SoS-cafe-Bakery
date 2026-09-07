import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalizePgUrl } from "../src/lib/pg-url";
import bcrypt from "bcryptjs";
import { CATEGORIES, MENU_ITEMS } from "../src/lib/menu-data";

const adapter = new PrismaPg({
  connectionString: normalizePgUrl(process.env.DATABASE_URL!),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding SOS Bakery And Coffee…");

  // ---- Categories --------------------------------------------------------
  for (const [i, c] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { id: c.id },
      update: {
        nameAr: c.ar,
        nameEn: c.en,
        icon: c.icon,
        blurbAr: c.blurbAr,
        blurbEn: c.blurbEn,
        sortOrder: i,
      },
      create: {
        id: c.id,
        nameAr: c.ar,
        nameEn: c.en,
        icon: c.icon,
        blurbAr: c.blurbAr,
        blurbEn: c.blurbEn,
        sortOrder: i,
      },
    });
  }
  console.log(`  categories: ${CATEGORIES.length}`);

  // ---- Menu items --------------------------------------------------------
  // Upsert by slug so re-running the seed refreshes prices without wiping
  // orders that reference these items.
  for (const [i, item] of MENU_ITEMS.entries()) {
    const data = {
      nameAr: item.ar,
      nameEn: item.en,
      categoryId: item.cat,
      price: item.sizes ? null : (item.price ?? 0),
      priceL: item.sizes ? item.sizes.L : null,
      priceXL: item.sizes ? item.sizes.XL : null,
      isBestSeller: item.best ?? false,
      sortOrder: i,
    };
    await prisma.menuItem.upsert({
      where: { slug: item.id },
      update: data,
      create: { slug: item.id, ...data },
    });
  }
  console.log(`  menu items: ${MENU_ITEMS.length}`);

  // ---- Admin user --------------------------------------------------------
  const email = (process.env.ADMIN_EMAIL ?? "admin@sos.cafe").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD must be set in .env to seed the admin user.");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, name: "SOS Admin" },
    create: { email, passwordHash, name: "SOS Admin" },
  });
  console.log(`  admin user: ${email}`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
