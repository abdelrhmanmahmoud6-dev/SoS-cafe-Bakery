/* ============================================================================
   ORDER DOMAIN TYPES
   The database stores these as plain strings (so the same schema runs on both
   SQLite and PostgreSQL). These constants are the single source of truth for
   the allowed values, and every write path validates against them.
   ========================================================================== */

export const ORDER_STATUSES = [
  "PENDING",
  "PREPARING",
  "READY",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_TYPES = ["TAKEAWAY", "DELIVERY"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const PAYMENT_METHODS = ["CASH", "VODAFONE_CASH"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const SIZES = ["L", "XL"] as const;
export type SizeKey = (typeof SIZES)[number];

export function isOrderStatus(v: string): v is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(v);
}
export function isOrderType(v: string): v is OrderType {
  return (ORDER_TYPES as readonly string[]).includes(v);
}
export function isPaymentMethod(v: string): v is PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(v);
}

/** Delivery fee, in EGP, applied to DELIVERY orders inside Housh Eissa. */
export const DELIVERY_FEE = 15;

/** Vodafone Cash wallet the customer transfers to. */
export const VODAFONE_CASH_NUMBER = "01034326985";

/**
 * The four customer-visible tracking steps. CANCELLED is deliberately absent —
 * it is rendered as a terminal error state rather than a step on the timeline.
 */
export const TRACKING_STEPS: OrderStatus[] = [
  "PENDING",
  "PREPARING",
  "READY",
  "DELIVERED",
];

type Bilingual = { ar: string; en: string };

export const STATUS_LABELS: Record<OrderStatus, Bilingual> = {
  PENDING: { ar: "تم استلام الطلب", en: "Order received" },
  PREPARING: { ar: "جاري التحضير", en: "Preparing" },
  READY: { ar: "جاهز", en: "Ready" },
  DELIVERED: { ar: "تم التسليم", en: "Delivered" },
  CANCELLED: { ar: "ملغي", en: "Cancelled" },
};

/**
 * Step 3 reads differently depending on how the customer is receiving the
 * order: "on the way" for delivery, "ready for pickup" for takeaway.
 */
export function statusLabel(
  status: OrderStatus,
  orderType: OrderType
): Bilingual {
  if (status === "READY") {
    return orderType === "DELIVERY"
      ? { ar: "في الطريق إليك", en: "On the way" }
      : { ar: "جاهز للاستلام", en: "Ready for pickup" };
  }
  return STATUS_LABELS[status];
}

export const ORDER_TYPE_LABELS: Record<OrderType, Bilingual> = {
  TAKEAWAY: { ar: "استلام من الفرع", en: "Takeaway" },
  DELIVERY: { ar: "دليفري للمنازل", en: "Delivery" },
};

export const PAYMENT_LABELS: Record<PaymentMethod, Bilingual> = {
  CASH: { ar: "الدفع عند الاستلام", en: "Cash on delivery / pickup" },
  VODAFONE_CASH: { ar: "فودافون كاش", en: "Vodafone Cash" },
};

/** Badge colour per status, shared by the admin board and the tracking page. */
export const STATUS_TONE: Record<OrderStatus, string> = {
  PENDING: "text-amber-300 bg-amber-400/12 border-amber-400/30",
  PREPARING: "text-sky-300 bg-sky-400/12 border-sky-400/30",
  READY: "text-violet-300 bg-violet-400/12 border-violet-400/30",
  DELIVERED: "text-emerald-300 bg-emerald-400/12 border-emerald-400/30",
  CANCELLED: "text-rose-300 bg-rose-400/12 border-rose-400/30",
};

/** Generates a short, unambiguous tracking code (no O/0/I/1 confusion). */
export function generateOrderCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `SOS-${out}`;
}
