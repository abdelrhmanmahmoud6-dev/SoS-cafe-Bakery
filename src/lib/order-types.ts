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

/**
 * VODAFONE_CASH predates the multi-wallet selector and is kept as a value so
 * orders placed before it still read correctly. New orders pick any of the
 * four wallets below.
 */
export const PAYMENT_METHODS = [
  "CASH",
  "VODAFONE_CASH",
  "ORANGE_CASH",
  "ETISALAT_CASH",
  "WE_PAY",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** The wallet options shown in checkout. CASH is handled separately. */
export const WALLET_METHODS = [
  "VODAFONE_CASH",
  "ORANGE_CASH",
  "ETISALAT_CASH",
  "WE_PAY",
] as const;
export type WalletMethod = (typeof WALLET_METHODS)[number];

export function isWalletMethod(v: string): v is WalletMethod {
  return (WALLET_METHODS as readonly string[]).includes(v);
}

/* -------------------------------------------------------------------------- */
/*  Delivery areas                                                            */
/* -------------------------------------------------------------------------- */

export const DELIVERY_AREAS = ["INSIDE", "OUTSIDE"] as const;
export type DeliveryArea = (typeof DELIVERY_AREAS)[number];

export function isDeliveryArea(v: string): v is DeliveryArea {
  return (DELIVERY_AREAS as readonly string[]).includes(v);
}

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

/** Delivery fee, in EGP, for DELIVERY orders inside Housh Eissa. */
export const DELIVERY_FEE = 15;

/**
 * Resolves the fee actually charged at checkout.
 *
 * Orders outside Housh Eissa return 0 — not because delivery is free, but
 * because the courier agrees the fee with the customer on the doorstep. The UI
 * must therefore never render this 0 as "free"; use `isCourierPriced` to show
 * "يحدد مع الطيار" instead.
 */
export function resolveDeliveryFee(
  orderType: OrderType,
  area: DeliveryArea | null
): number {
  if (orderType !== "DELIVERY") return 0;
  return area === "INSIDE" ? DELIVERY_FEE : 0;
}

/** True when the delivery cost is settled with the courier, not by the site. */
export function isCourierPriced(
  orderType: OrderType,
  area: DeliveryArea | null
): boolean {
  return orderType === "DELIVERY" && area === "OUTSIDE";
}

/**
 * Wallet number customers transfer to. Deliberately separate from the
 * WhatsApp ordering number so the shop can move money to a different line
 * without changing where orders arrive. Override with NEXT_PUBLIC_WALLET_NUMBER.
 */
export const WALLET_TRANSFER_NUMBER =
  process.env.NEXT_PUBLIC_WALLET_NUMBER ?? "01034326985";

/** Kept for older imports; the wallet number is the canonical name now. */
export const VODAFONE_CASH_NUMBER = WALLET_TRANSFER_NUMBER;

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
  ORANGE_CASH: { ar: "أورنج كاش", en: "Orange Cash" },
  ETISALAT_CASH: { ar: "اتصالات كاش", en: "Etisalat Cash" },
  WE_PAY: { ar: "وي باي", en: "WE Pay" },
};

/** Brand tint per wallet, used only as a swatch beside a text label. */
export const WALLET_TONE: Record<WalletMethod, string> = {
  VODAFONE_CASH: "#E60000",
  ORANGE_CASH: "#FF7900",
  ETISALAT_CASH: "#8DC63F",
  WE_PAY: "#7B1FA2",
};

export const DELIVERY_AREA_LABELS: Record<DeliveryArea, Bilingual> = {
  INSIDE: { ar: "داخل حوش عيسى", en: "Inside Housh Eissa" },
  OUTSIDE: {
    ar: "خارج نطاق البلد / قرى ومناطق مجاورة",
    en: "Outside the town / nearby villages",
  },
};

/**
 * Badge colour per status, shared by the admin board and the tracking page.
 *
 * Re-derived for the cream theme. The previous values were 300-weight text on
 * a 12%-alpha fill, which was tuned for a near-black ground and lands around
 * 1.6:1 on cream — the badges were effectively invisible after the theme flip.
 * Each one is now a soft tinted fill with 900-weight text on top.
 */
export const STATUS_TONE: Record<OrderStatus, string> = {
  PENDING: "text-amber-900 bg-amber-100 border-amber-300",
  PREPARING: "text-sky-900 bg-sky-100 border-sky-300",
  READY: "text-violet-900 bg-violet-100 border-violet-300",
  DELIVERED: "text-emerald-900 bg-emerald-100 border-emerald-300",
  // Soft pink fill, deep rose type — the cancelled badge has to read as a
  // terminal state at a glance on both boards.
  CANCELLED: "text-rose-900 bg-rose-100 border-rose-300",
};

/* -------------------------------------------------------------------------- */
/*  Lifecycle                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Every status the admin's single status button steps through, in order.
 *
 * This is deliberately NOT `TRACKING_STEPS`. That array is the customer-facing
 * timeline, which has exactly four stops and excludes CANCELLED because a
 * cancelled order is a terminal state rather than a point on a journey. This
 * one is the admin's control surface, and it includes CANCELLED so the counter
 * can reach it without a second control.
 */
export const STATUS_CYCLE: readonly OrderStatus[] = [
  "PENDING",
  "PREPARING",
  "READY",
  "DELIVERED",
  "CANCELLED",
];

/**
 * The status one click advances to.
 *
 * Wraps: CANCELLED steps back round to PENDING. Without the wrap a mis-tap on
 * a delivered order would strand it as cancelled with no way back from this
 * control, and the customer would be looking at a "ملغي" badge for an order
 * they have already received.
 */
export function cycleStatus(current: OrderStatus): OrderStatus {
  const i = STATUS_CYCLE.indexOf(current);
  if (i === -1) return STATUS_CYCLE[0];
  return STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length];
}

/**
 * Whether the CUSTOMER may still cancel.
 *
 * Strictly PENDING: once the kitchen has started, ingredients are committed and
 * the shop absorbs the loss. This is the single source of truth for the rule —
 * the tracking UI uses it to decide what to show, and the server action uses
 * the same rule in its WHERE clause so the check cannot be bypassed by calling
 * the action directly.
 */
export function canCustomerCancel(status: OrderStatus): boolean {
  return status === "PENDING";
}

/** Generates a short, unambiguous tracking code (no O/0/I/1 confusion). */
export function generateOrderCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `SOS-${out}`;
}
