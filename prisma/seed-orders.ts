/**
 * Demo order generator — populates the admin board and analytics with
 * realistic-looking history so the dashboard can be evaluated.
 * Safe to re-run; it only ever ADDS orders. Never run against production data.
 *
 *   npm run db:seed:orders
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalizePgUrl } from "../src/lib/pg-url";
import { generateOrderCode, DELIVERY_FEE } from "../src/lib/order-types";

const adapter = new PrismaPg({
  connectionString: normalizePgUrl(process.env.DATABASE_URL!),
});
const prisma = new PrismaClient({ adapter });

const NAMES = [
  "أحمد محمود", "منة الله سيد", "كريم عبد الله", "سارة فتحي", "محمد رمضان",
  "نورهان علي", "يوسف حسن", "إسراء طارق", "عمر خالد", "دينا مصطفى",
];
const PHONES = [
  "01012345678", "01123456789", "01234567890", "01555123456", "01098765432",
];
const ADDRESSES = [
  "شارع الجمهورية، برج النور، الدور 3",
  "خلف مسجد العاشر، بيت أبيض، الدور الأرضي",
  "شارع المحطة، أمام الصيدلية، عمارة 12",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const items = await prisma.menuItem.findMany({
    where: { isAvailable: true, categoryId: { not: "addons" } },
  });
  const addons = await prisma.menuItem.findMany({
    where: { categoryId: "addons" },
  });
  if (items.length === 0) {
    throw new Error("No menu items found — run `npm run db:seed` first.");
  }

  const HOW_MANY = 45;
  console.log(`Generating ${HOW_MANY} demo orders…`);

  for (let n = 0; n < HOW_MANY; n++) {
    // Spread across the last 40 days, weighted towards recent days.
    const daysAgo = Math.floor(Math.pow(Math.random(), 1.7) * 40);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(randInt(9, 23), randInt(0, 59), 0, 0);

    const orderType = Math.random() < 0.45 ? "DELIVERY" : "TAKEAWAY";
    const paymentMethod = Math.random() < 0.3 ? "VODAFONE_CASH" : "CASH";

    // Recent orders are still in flight; older ones are settled.
    let status: string;
    if (daysAgo === 0) {
      status = pick(["PENDING", "PREPARING", "READY", "DELIVERED"]);
    } else if (Math.random() < 0.07) {
      status = "CANCELLED";
    } else {
      status = "DELIVERED";
    }

    const lineCount = randInt(1, 4);
    const built = [];
    for (let i = 0; i < lineCount; i++) {
      const item = pick(items);
      const quantity = randInt(1, 3);
      const hasSizes = item.priceL !== null && item.priceXL !== null;
      const size = hasSizes ? pick(["L", "XL"]) : null;
      const unitPrice = hasSizes
        ? size === "L"
          ? item.priceL!
          : item.priceXL!
        : (item.price ?? 0);

      const chosenAddons =
        hasSizes && Math.random() < 0.4
          ? [pick(addons)].map((a) => ({
              menuItemId: a.id,
              nameAr: a.nameAr,
              nameEn: a.nameEn,
              price: a.price ?? 0,
            }))
          : [];

      const addonSum = chosenAddons.reduce((s, a) => s + a.price, 0);
      built.push({
        menuItemId: item.id,
        nameAr: item.nameAr,
        nameEn: item.nameEn,
        size,
        unitPrice,
        quantity,
        lineTotal: (unitPrice + addonSum) * quantity,
        addons: chosenAddons,
      });
    }

    const subtotal = built.reduce((s, l) => s + l.lineTotal, 0);
    const deliveryFee = orderType === "DELIVERY" ? DELIVERY_FEE : 0;

    await prisma.order.create({
      data: {
        code: generateOrderCode(),
        status,
        orderType,
        paymentMethod,
        paymentRef:
          paymentMethod === "VODAFONE_CASH" ? String(randInt(100000000, 999999999)) : null,
        customerName: pick(NAMES),
        customerPhone: pick(PHONES),
        address: orderType === "DELIVERY" ? pick(ADDRESSES) : null,
        notes: Math.random() < 0.25 ? "سكر زيادة لو سمحت" : null,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        createdAt,
        updatedAt: createdAt,
        items: {
          create: built.map((l) => ({
            menuItemId: l.menuItemId,
            nameAr: l.nameAr,
            nameEn: l.nameEn,
            size: l.size,
            unitPrice: l.unitPrice,
            quantity: l.quantity,
            lineTotal: l.lineTotal,
            addons: { create: l.addons },
          })),
        },
        events: { create: [{ status: "PENDING", createdAt }] },
      },
    });
  }

  const total = await prisma.order.count();
  console.log(`Done. ${total} orders now in the database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
