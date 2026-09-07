import { STORE } from "./dictionary";
import {
  DELIVERY_AREA_LABELS,
  PAYMENT_LABELS,
  isCourierPriced,
  isWalletMethod,
  type DeliveryArea,
  type OrderType,
  type PaymentMethod,
} from "./order-types";

/* ============================================================================
   WHATSAPP ORDER RECEIPT

   Builds the message the customer sends to the shop after checkout. The data
   comes back from the server (see placeOrder), not from the local cart, so the
   message always reflects what was actually written to the database — the
   server re-prices every line, and a stale client cart would otherwise quote a
   price the shop never agreed to.
   ========================================================================== */

export interface ReceiptAddon {
  nameAr: string;
  nameEn: string;
  price: number;
}

export interface ReceiptLine {
  nameAr: string;
  nameEn: string;
  size: string | null;
  quantity: number;
  lineTotal: number;
  addons: ReceiptAddon[];
}

export interface OrderReceipt {
  code: string;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  deliveryArea: DeliveryArea | null;
  address: string | null;
  paymentMethod: PaymentMethod;
  paymentRef: string | null;
  notes: string | null;
  items: ReceiptLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

/**
 * wa.me puts the whole message in the query string, so the limit that matters
 * is the length AFTER percent-encoding — and Arabic inflates roughly 4.6x
 * (each character becomes %XX%XX). Budgeting on the raw string would let a
 * large order produce a 16k+ character URL, which some clients reject.
 * 7000 encoded characters is comfortably inside what every browser and the
 * WhatsApp clients accept.
 */
const MAX_ENCODED_CHARS = 7000;

const SIZE_LABEL: Record<string, string> = { L: "وسط L", XL: "كبير XL" };

function line(item: ReceiptLine): string {
  const size = item.size ? ` (الحجم: ${SIZE_LABEL[item.size] ?? item.size})` : "";
  let out = `- ${item.nameAr}${size} × ${item.quantity} = ${item.lineTotal} ج.م`;
  if (item.addons.length > 0) {
    out += `\n  + إضافات: ${item.addons.map((a) => a.nameAr).join("، ")}`;
  }
  return out;
}

/** Builds the plain-text message body (unencoded). */
export function buildWhatsAppMessage(
  order: OrderReceipt,
  trackBaseUrl: string
): string {
  const courierPriced = isCourierPriced(order.orderType, order.deliveryArea);

  const delivery =
    order.orderType === "DELIVERY"
      ? `دليفري (${
          order.deliveryArea
            ? DELIVERY_AREA_LABELS[order.deliveryArea].ar
            : "المنطقة غير محددة"
        }) - العنوان: ${order.address?.trim() || "—"}`
      : "تيك أواي";

  // Every wallet reports the sender number the customer transferred from.
  const payment = isWalletMethod(order.paymentMethod)
    ? `${PAYMENT_LABELS[order.paymentMethod].ar} - المحفظة المحوّل منها: ${
        order.paymentRef?.trim() || "—"
      }`
    : "كاش عند الاستلام";

  const head = [
    "🛎️ *طلب جديد من موقع SOS Bakery & Coffee*",
    `🆔 *رقم الطلب:* #${order.code}`,
    `👤 *اسم العميل:* ${order.customerName}`,
    `📞 *رقم الهاتف:* ${order.customerPhone}`,
    `📍 *نوع الطلب:* ${delivery}`,
    `💳 *طريقة الدفع:* ${payment}`,
    "",
    "🛒 *تفاصيل الطلب:*",
  ];

  // Trim the item list rather than let the encoded URL blow past the ceiling.
  // The head and tail are always kept: the shop must see the total and the
  // tracking link even when the item list had to be cut short.
  const rendered: string[] = [];
  let omitted = 0;
  const fixedCost = encodeURIComponent(head.join(String.fromCharCode(10))).length + 700;

  for (const item of order.items) {
    const text = line(item);
    const soFar = encodeURIComponent([...rendered, text].join(String.fromCharCode(10))).length;
    if (fixedCost + soFar > MAX_ENCODED_CHARS) {
      omitted = order.items.length - rendered.length;
      break;
    }
    rendered.push(text);
  }
  if (omitted > 0) {
    rendered.push(`- … و ${omitted} صنف إضافي (شوف رابط التتبع للتفاصيل)`);
  }

  const tail: string[] = [""];
  // The total already includes delivery; itemising it stops the shop wondering
  // why the figure is higher than the lines add up to. Outside the town the fee
  // is 0 here but NOT free — say so explicitly so nobody reads it as included.
  if (courierPriced) {
    tail.push("🛵 *رسوم التوصيل:* يحدد مع الطيار حسب المكان (غير مضاف للإجمالي)");
  } else if (order.deliveryFee > 0) {
    tail.push(`🛵 *رسوم التوصيل:* ${order.deliveryFee} ج.م`);
  }
  tail.push(
    `💰 *الإجمالي:* ${order.total} ج.م${courierPriced ? " (قيمة الطلب فقط)" : ""}`
  );
  if (order.notes?.trim()) {
    tail.push(`📝 *ملاحظات:* ${order.notes.trim()}`);
  }

  const base = trackBaseUrl.replace(/\/$/, "");
  tail.push(`🔗 *رابط تتبع الطلب:* ${base}/track?orderId=${order.code}`);

  return [...head, ...rendered, ...tail].join("\n");
}

/** Full wa.me deep link, URL-encoded, addressed to the shop. */
export function whatsappOrderLink(
  order: OrderReceipt,
  trackBaseUrl: string
): string {
  const text = buildWhatsAppMessage(order, trackBaseUrl);
  return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}`;
}

/**
 * The origin to build tracking links from.
 *
 * Prefers the live origin so the link is correct on whatever domain the
 * customer is actually using (preview deploy, custom domain, localhost), and
 * falls back to the configured public URL during SSR.
 */
export function siteOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://so-s-cafe-bakery.vercel.app";
}
