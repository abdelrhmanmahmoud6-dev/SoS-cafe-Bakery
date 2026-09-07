"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { OrderReceipt } from "@/lib/whatsapp";
import {
  generateOrderCode,
  isDeliveryArea,
  isOrderStatus,
  isOrderType,
  isPaymentMethod,
  isWalletMethod,
  resolveDeliveryFee,
  type DeliveryArea,
  type OrderStatus,
} from "@/lib/order-types";

/* ============================================================================
   CUSTOMER — place and track orders
   ========================================================================== */

export interface PlaceOrderLine {
  itemId: string;
  size: "L" | "XL" | null;
  quantity: number;
  addonIds: string[];
}

export interface PlaceOrderInput {
  customerName: string;
  customerPhone: string;
  orderType: string;
  deliveryArea?: string;
  paymentMethod: string;
  address?: string;
  notes?: string;
  paymentRef?: string;
  lines: PlaceOrderLine[];
}

export type PlaceOrderResult =
  | { ok: true; code: string; total: number; receipt: OrderReceipt }
  | { ok: false; error: string };

const EG_PHONE = /^01[0125][0-9]{8}$/;

export async function placeOrder(
  input: PlaceOrderInput
): Promise<PlaceOrderResult> {
  // ---- Validate the envelope ---------------------------------------------
  const name = input.customerName?.trim() ?? "";
  const phone = (input.customerPhone ?? "").replace(/[\s-]/g, "");

  if (name.length < 2) return { ok: false, error: "NAME_REQUIRED" };
  if (!EG_PHONE.test(phone)) return { ok: false, error: "PHONE_INVALID" };
  if (!isOrderType(input.orderType)) return { ok: false, error: "TYPE_INVALID" };
  if (!isPaymentMethod(input.paymentMethod))
    return { ok: false, error: "PAYMENT_INVALID" };
  if (!input.lines?.length) return { ok: false, error: "CART_EMPTY" };

  const address = input.address?.trim() ?? "";
  if (input.orderType === "DELIVERY" && address.length < 6) {
    return { ok: false, error: "ADDRESS_REQUIRED" };
  }

  // Delivery area decides the fee, so it is required for delivery orders and
  // ignored entirely for takeaway.
  let deliveryArea: DeliveryArea | null = null;
  if (input.orderType === "DELIVERY") {
    if (!input.deliveryArea || !isDeliveryArea(input.deliveryArea)) {
      return { ok: false, error: "AREA_REQUIRED" };
    }
    deliveryArea = input.deliveryArea;
  }

  // Every wallet needs a sender number / transaction reference; cash does not.
  const paymentRef = input.paymentRef?.trim() ?? "";
  if (isWalletMethod(input.paymentMethod) && paymentRef.length < 4) {
    return { ok: false, error: "PAYMENT_REF_REQUIRED" };
  }

  // ---- Re-price server-side ------------------------------------------------
  // Prices are ALWAYS recomputed from the database. Whatever the client sent is
  // treated as a request, never as an amount to charge.
  const itemIds = [
    ...new Set([
      ...input.lines.map((l) => l.itemId),
      ...input.lines.flatMap((l) => l.addonIds),
    ]),
  ];

  const dbItems = await prisma.menuItem.findMany({
    where: { id: { in: itemIds } },
  });
  const byId = new Map(dbItems.map((i) => [i.id, i]));

  type BuiltLine = {
    menuItemId: string;
    nameAr: string;
    nameEn: string;
    size: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    addons: { menuItemId: string; nameAr: string; nameEn: string; price: number }[];
  };

  const built: BuiltLine[] = [];

  for (const line of input.lines) {
    const item = byId.get(line.itemId);
    if (!item) return { ok: false, error: "ITEM_NOT_FOUND" };
    if (!item.isAvailable) return { ok: false, error: `UNAVAILABLE:${item.nameEn}` };

    const quantity = Math.floor(line.quantity);
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
      return { ok: false, error: "QUANTITY_INVALID" };
    }

    // Resolve the unit price for the requested size.
    let unitPrice: number;
    if (item.priceL !== null && item.priceXL !== null) {
      if (line.size !== "L" && line.size !== "XL") {
        return { ok: false, error: "SIZE_REQUIRED" };
      }
      unitPrice = line.size === "L" ? item.priceL : item.priceXL;
    } else {
      if (line.size) return { ok: false, error: "SIZE_NOT_APPLICABLE" };
      unitPrice = item.price ?? 0;
    }

    const addons = [];
    for (const addonId of line.addonIds) {
      const addon = byId.get(addonId);
      if (!addon || addon.categoryId !== "addons") {
        return { ok: false, error: "ADDON_INVALID" };
      }
      if (!addon.isAvailable) {
        return { ok: false, error: `UNAVAILABLE:${addon.nameEn}` };
      }
      addons.push({
        menuItemId: addon.id,
        nameAr: addon.nameAr,
        nameEn: addon.nameEn,
        price: addon.price ?? 0,
      });
    }

    const addonSum = addons.reduce((s, a) => s + a.price, 0);
    built.push({
      menuItemId: item.id,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      size: line.size,
      unitPrice,
      quantity,
      lineTotal: (unitPrice + addonSum) * quantity,
      addons,
    });
  }

  const subtotal = built.reduce((s, l) => s + l.lineTotal, 0);
  // Outside the town this is 0 because the courier prices it on delivery — the
  // stored deliveryArea is what tells the shop the difference.
  const deliveryFee = resolveDeliveryFee(input.orderType, deliveryArea);
  const total = subtotal + deliveryFee;

  // ---- Persist -------------------------------------------------------------
  // Retry on the (vanishingly unlikely) event of a tracking-code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateOrderCode();
    try {
      await prisma.order.create({
        data: {
          code,
          status: "PENDING",
          orderType: input.orderType,
          deliveryArea,
          paymentMethod: input.paymentMethod,
          paymentRef: isWalletMethod(input.paymentMethod) ? paymentRef : null,
          customerName: name,
          customerPhone: phone,
          address: input.orderType === "DELIVERY" ? address : null,
          notes: input.notes?.trim() || null,
          subtotal,
          deliveryFee,
          total,
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
          events: {
            create: [{ status: "PENDING", note: "Order placed" }],
          },
        },
      });

      revalidatePath("/admin");

      // Built from the re-priced server values, not the client cart, so the
      // WhatsApp receipt can never quote a price the shop did not agree to.
      const receipt: OrderReceipt = {
        code,
        customerName: name,
        customerPhone: phone,
        orderType: input.orderType as OrderReceipt["orderType"],
        deliveryArea,
        address: input.orderType === "DELIVERY" ? address : null,
        paymentMethod: input.paymentMethod as OrderReceipt["paymentMethod"],
        paymentRef: isWalletMethod(input.paymentMethod) ? paymentRef : null,
        notes: input.notes?.trim() || null,
        items: built.map((l) => ({
          nameAr: l.nameAr,
          nameEn: l.nameEn,
          size: l.size,
          quantity: l.quantity,
          lineTotal: l.lineTotal,
          addons: l.addons.map((a) => ({
            nameAr: a.nameAr,
            nameEn: a.nameEn,
            price: a.price,
          })),
        })),
        subtotal,
        deliveryFee,
        total,
      };

      return { ok: true, code, total, receipt };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Unique constraint on `code` — try a fresh one.
      if (message.includes("Unique") || message.includes("UNIQUE")) continue;
      console.error("placeOrder failed:", err);
      return { ok: false, error: "SERVER_ERROR" };
    }
  }

  return { ok: false, error: "CODE_COLLISION" };
}

/* ============================================================================
   CUSTOMER — tracking lookup
   ========================================================================== */

export interface TrackedOrder {
  code: string;
  status: OrderStatus;
  orderType: string;
  deliveryArea: string | null;
  paymentMethod: string;
  customerName: string;
  address: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  items: {
    nameAr: string;
    nameEn: string;
    size: string | null;
    quantity: number;
    lineTotal: number;
    addons: { nameAr: string; nameEn: string; price: number }[];
  }[];
  events: { status: string; createdAt: string }[];
}

export async function trackOrder(
  rawCode: string
): Promise<TrackedOrder | null> {
  const code = rawCode.trim().toUpperCase();
  if (!/^SOS-[A-Z0-9]{6}$/.test(code)) return null;

  const order = await prisma.order.findUnique({
    where: { code },
    include: {
      items: { include: { addons: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) return null;

  return {
    code: order.code,
    status: order.status as OrderStatus,
    orderType: order.orderType,
    deliveryArea: order.deliveryArea,
    paymentMethod: order.paymentMethod,
    customerName: order.customerName,
    address: order.address,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((i) => ({
      nameAr: i.nameAr,
      nameEn: i.nameEn,
      size: i.size,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
      addons: i.addons.map((a) => ({
        nameAr: a.nameAr,
        nameEn: a.nameEn,
        price: a.price,
      })),
    })),
    events: order.events.map((e) => ({
      status: e.status,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}

/* ============================================================================
   ADMIN — live board
   ========================================================================== */

export interface AdminOrder extends TrackedOrder {
  id: string;
  customerPhone: string;
  paymentRef: string | null;
  notes: string | null;
}

/** Orders for the admin board, newest first. Polled by the client. */
export async function listOrders(opts?: {
  status?: string;
  limit?: number;
}): Promise<AdminOrder[]> {
  await requireAdmin();

  const where =
    opts?.status && isOrderStatus(opts.status) ? { status: opts.status } : {};

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(opts?.limit ?? 60, 200),
    include: {
      items: { include: { addons: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    code: order.code,
    status: order.status as OrderStatus,
    orderType: order.orderType,
    deliveryArea: order.deliveryArea,
    paymentMethod: order.paymentMethod,
    paymentRef: order.paymentRef,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    address: order.address,
    notes: order.notes,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((i) => ({
      nameAr: i.nameAr,
      nameEn: i.nameEn,
      size: i.size,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
      addons: i.addons.map((a) => ({
        nameAr: a.nameAr,
        nameEn: a.nameEn,
        price: a.price,
      })),
    })),
    events: order.events.map((e) => ({
      status: e.status,
      createdAt: e.createdAt.toISOString(),
    })),
  }));
}

export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  if (!isOrderStatus(status)) return { ok: false, error: "STATUS_INVALID" };

  try {
    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { status } }),
      prisma.orderEvent.create({ data: { orderId, status } }),
    ]);
    revalidatePath("/admin");
    return { ok: true };
  } catch (err) {
    console.error("updateOrderStatus failed:", err);
    return { ok: false, error: "SERVER_ERROR" };
  }
}
