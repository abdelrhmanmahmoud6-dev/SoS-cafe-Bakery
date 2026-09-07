"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  resolveDeliveryFee,
  type DeliveryArea,
  type OrderType,
  type SizeKey,
} from "@/lib/order-types";

export interface CartAddon {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
}

export interface CartLine {
  /** Identity of a configuration: same item + size + add-ons merges quantity. */
  key: string;
  itemId: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  size: SizeKey | null;
  /** Base price for the chosen size, in EGP. */
  unitPrice: number;
  addons: CartAddon[];
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  orderType: OrderType;
  /** Only meaningful when orderType is DELIVERY. */
  deliveryArea: DeliveryArea;

  open: () => void;
  close: () => void;
  toggle: () => void;
  setOrderType: (t: OrderType) => void;
  setDeliveryArea: (a: DeliveryArea) => void;

  add: (line: Omit<CartLine, "key" | "quantity">, quantity?: number) => void;
  remove: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  clear: () => void;
}

/** Stable identity for a configured line. */
export function lineKey(
  itemId: string,
  size: SizeKey | null,
  addons: CartAddon[]
): string {
  const ids = addons.map((a) => a.id).sort().join(",");
  return `${itemId}::${size ?? "-"}::${ids}`;
}

export function linePrice(line: CartLine): number {
  const addons = line.addons.reduce((sum, a) => sum + a.price, 0);
  return (line.unitPrice + addons) * line.quantity;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      orderType: "TAKEAWAY",
      deliveryArea: "INSIDE",

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      setOrderType: (orderType) => set({ orderType }),
      setDeliveryArea: (deliveryArea) => set({ deliveryArea }),

      add: (line, quantity = 1) =>
        set((state) => {
          const key = lineKey(line.itemId, line.size, line.addons);
          const existing = state.lines.find((l) => l.key === key);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.key === key ? { ...l, quantity: l.quantity + quantity } : l
              ),
              isOpen: true,
            };
          }
          return {
            lines: [...state.lines, { ...line, key, quantity }],
            isOpen: true,
          };
        }),

      remove: (key) =>
        set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),

      setQuantity: (key, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.key !== key)
              : state.lines.map((l) => (l.key === key ? { ...l, quantity } : l)),
        })),

      increment: (key) =>
        set((state) => ({
          lines: state.lines.map((l) =>
            l.key === key ? { ...l, quantity: Math.min(l.quantity + 1, 99) } : l
          ),
        })),

      decrement: (key) =>
        set((state) => ({
          lines: state.lines.flatMap((l) => {
            if (l.key !== key) return [l];
            return l.quantity <= 1 ? [] : [{ ...l, quantity: l.quantity - 1 }];
          }),
        })),

      clear: () => set({ lines: [] }),
    }),
    {
      name: "sos-cart",
      storage: createJSONStorage(() => localStorage),
      // Never persist the drawer's open/closed state.
      partialize: (s) => ({
        lines: s.lines,
        orderType: s.orderType,
        deliveryArea: s.deliveryArea,
      }),
    }
  )
);

/* -------------------------------------------------------------------------- */
/*  Derived selectors                                                         */
/* -------------------------------------------------------------------------- */

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + linePrice(l), 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

/**
 * Fee charged at checkout. Outside Housh Eissa this is 0 because the courier
 * prices it on the doorstep — callers must render that case as
 * "يحدد مع الطيار", never as free delivery.
 */
export function cartDeliveryFee(
  orderType: OrderType,
  lines: CartLine[],
  area: DeliveryArea
): number {
  if (lines.length === 0) return 0;
  return resolveDeliveryFee(orderType, area);
}

export function cartTotal(
  lines: CartLine[],
  orderType: OrderType,
  area: DeliveryArea
): number {
  return cartSubtotal(lines) + cartDeliveryFee(orderType, lines, area);
}
