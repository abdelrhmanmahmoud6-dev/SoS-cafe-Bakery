import { STORE } from "./dictionary";
import {
  PAYMENT_LABELS,
  isCourierPriced,
  isWalletMethod,
  type DeliveryArea,
  type OrderType,
  type PaymentMethod,
} from "./order-types";

/* ============================================================================
   WHATSAPP MESSAGES

   Two distinct messages, addressed in opposite directions:

   1. buildWhatsAppMessage — customer -> shop, sent at checkout.
      Deliberately carries NO pricing, totals, order id or tracking link. It is
      a request to prepare food, not a receipt; the customer already has the
      order number on the confirmation screen.

   2. buildInvoiceMessage  — shop -> customer, sent from the admin board.
      This one IS the receipt: itemised charges, delivery fee, total due and
      the tracking link.

   Both are built from values the server persisted, never from the local cart.
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
 */
const MAX_ENCODED_CHARS = 7000;

const SIZE_LABEL: Record<string, string> = { L: "وسط L", XL: "كبير XL" };
const NL = String.fromCharCode(10);

function sizeSuffix(size: string | null): string {
  return size ? ` (الحجم: ${SIZE_LABEL[size] ?? size})` : "";
}

/** Trims a line list so the encoded URL stays inside the ceiling. */
function fitLines(
  lines: string[],
  fixedCost: number,
  overflowLabel: (n: number) => string
): string[] {
  const kept: string[] = [];
  for (const text of lines) {
    const soFar = encodeURIComponent([...kept, text].join(NL)).length;
    if (fixedCost + soFar > MAX_ENCODED_CHARS) {
      return [...kept, overflowLabel(lines.length - kept.length)];
    }
    kept.push(text);
  }
  return kept;
}

/* -------------------------------------------------------------------------- */
/*  1. Customer -> shop (checkout)                                            */
/* -------------------------------------------------------------------------- */

/**
 * What the customer sends when placing the order.
 *
 * No prices, no total, no order id, no tracking link: the shop prices the order
 * itself, and money figures echoed back from a client message only invite
 * disputes.
 */
export function buildWhatsAppMessage(order: OrderReceipt): string {
  const wallet = isWalletMethod(order.paymentMethod);

  const head = [
    "SOS Bakery & Coffee",
    "",
    `اسم العميل: ${order.customerName}`,
    `رقم الهاتف: ${order.customerPhone}`,
    `نوع الطلب: ${
      order.orderType === "DELIVERY"
        ? `دليفري - العنوان: ${order.address?.trim() || "—"}`
        : "استلام من الفرع"
    }`,
    `طريقة الدفع: ${wallet ? "محفظة إلكترونية" : "كاش عند الاستلام"}`,
  ];

  if (wallet) {
    head.push(`كود التحويل / رقم المحفظة: ${order.paymentRef?.trim() || "—"}`);
  }

  head.push("", "الطلب:");

  const itemLines = order.items.map((item) => {
    let out = `- ${item.nameAr}${sizeSuffix(item.size)} × ${item.quantity}`;
    if (item.addons.length > 0) {
      out += `${NL}  ${item.addons.map((a) => a.nameAr).join("، ")}`;
    }
    return out;
  });

  const fixedCost = encodeURIComponent(head.join(NL)).length + 400;
  const rendered = fitLines(itemLines, fixedCost, (n) => `- … و ${n} صنف إضافي`);

  const tail: string[] = [];
  if (order.notes?.trim()) {
    tail.push("", `ملاحظات: ${order.notes.trim()}`);
  }
  if (wallet) {
    tail.push("", "*يرجى إرفاق سكرين شوت التحويل مع الرسالة*");
  }

  return [...head, ...rendered, ...tail].join(NL);
}

/** Deep link addressed to the shop, carrying the customer's order request. */
export function whatsappOrderLink(order: OrderReceipt): string {
  return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(
    buildWhatsAppMessage(order)
  )}`;
}

/* -------------------------------------------------------------------------- */
/*  2. Shop -> customer (admin invoice)                                       */
/* -------------------------------------------------------------------------- */

export interface InvoiceOrder {
  code: string;
  customerPhone: string;
  orderType: string;
  deliveryArea: string | null;
  deliveryFee: number;
  total: number;
  items: { nameAr: string; quantity: number; lineTotal: number }[];
}

/** The itemised receipt the shop sends to the customer. */
export function buildInvoiceMessage(
  order: InvoiceOrder,
  trackBaseUrl: string
): string {
  const head = [
    "فاتورة طلب - SOS Bakery & Coffee",
    `رقم الطلب: #${order.code}`,
    "",
    "تفاصيل الحساب:",
  ];

  const itemLines = order.items.map(
    (i) => `- ${i.nameAr} × ${i.quantity} = ${i.lineTotal} ج.م`
  );

  const fixedCost = encodeURIComponent(head.join(NL)).length + 600;
  const rendered = fitLines(itemLines, fixedCost, (n) => `- … و ${n} صنف إضافي`);

  const courierPriced = isCourierPriced(
    order.orderType as OrderType,
    order.deliveryArea as DeliveryArea | null
  );

  const tail = [
    // Outside the town the fee is settled with the courier, so quoting 0 here
    // would read as free delivery.
    `رسوم التوصيل: ${
      courierPriced ? "يحدد مع الطيار حسب المكان" : `${order.deliveryFee} ج.م`
    }`,
    "---------------------------------",
    `الإجمالي المطلوب: ${order.total} ج.م${
      courierPriced ? " (بدون رسوم التوصيل)" : ""
    }`,
    "",
    "📍 لتتبع حالة طلبك لحظة بلحظة:",
    `${trackBaseUrl.replace(/\/$/, "")}/track?orderId=${order.code}`,
  ];

  return [...head, ...rendered, ...tail].join(NL);
}

/**
 * Deep link addressed to the CUSTOMER, not the shop.
 *
 * Stored phones are local format (01xxxxxxxxx); wa.me wants the country code
 * with no plus, so the leading 0 becomes Egypt's 20.
 */
export function whatsappInvoiceLink(
  order: InvoiceOrder,
  trackBaseUrl: string
): string {
  const local = order.customerPhone.replace(/\D/g, "");
  const international = local.startsWith("0") ? `20${local.slice(1)}` : local;
  return `https://wa.me/${international}?text=${encodeURIComponent(
    buildInvoiceMessage(order, trackBaseUrl)
  )}`;
}

/* -------------------------------------------------------------------------- */

/**
 * The origin to build tracking links from.
 *
 * Prefers the live origin so the link is correct on whatever domain is actually
 * in use (preview deploy, custom domain, localhost), and falls back to the
 * configured public URL during SSR.
 */
export function siteOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://so-s-cafe-bakery.vercel.app";
}

/** Label for a wallet, without importing order-types at the call site. */
export function walletLabel(method: PaymentMethod): string {
  return PAYMENT_LABELS[method]?.ar ?? "";
}
