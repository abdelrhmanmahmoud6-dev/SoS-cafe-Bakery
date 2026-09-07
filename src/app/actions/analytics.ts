"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/* ============================================================================
   ANALYTICS
   Cancelled orders are excluded from every revenue figure — they were never
   money. They are still counted separately so the cancellation rate is visible.
   ========================================================================== */

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  cancelledOrders: number;
  todayRevenue: number;
  todayOrders: number;
  deliveryShare: number; // 0-100
}

export interface SeriesPoint {
  label: string; // ISO date or month key
  revenue: number;
  orders: number;
}

export interface TopProduct {
  nameAr: string;
  nameEn: string;
  quantity: number;
  revenue: number;
}

export interface AnalyticsPayload {
  summary: AnalyticsSummary;
  daily: SeriesPoint[]; // last 14 days
  weekly: SeriesPoint[]; // last 8 ISO weeks
  monthly: SeriesPoint[]; // last 6 months
  topProducts: TopProduct[];
  statusBreakdown: { status: string; count: number }[];
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Monday-based start of the week containing `d`. */
function weekStart(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (out.getDay() + 6) % 7; // Mon = 0
  out.setDate(out.getDate() - dow);
  return out;
}

export async function getAnalytics(): Promise<AnalyticsPayload> {
  await requireAdmin();

  const orders = await prisma.order.findMany({
    select: {
      total: true,
      status: true,
      orderType: true,
      createdAt: true,
    },
  });

  const paid = orders.filter((o) => o.status !== "CANCELLED");
  const totalRevenue = paid.reduce((s, o) => s + o.total, 0);
  const totalOrders = paid.length;

  const todayStr = dayKey(new Date());
  const todayOrders = paid.filter((o) => dayKey(o.createdAt) === todayStr);

  const deliveryCount = paid.filter((o) => o.orderType === "DELIVERY").length;

  const summary: AnalyticsSummary = {
    totalRevenue,
    totalOrders,
    averageOrderValue: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
    cancelledOrders: orders.length - paid.length,
    todayRevenue: todayOrders.reduce((s, o) => s + o.total, 0),
    todayOrders: todayOrders.length,
    deliveryShare: totalOrders
      ? Math.round((deliveryCount / totalOrders) * 100)
      : 0,
  };

  // ---- Daily: last 14 days, zero-filled so the chart has no gaps ----------
  const daily: SeriesPoint[] = [];
  const dayBuckets = new Map<string, { revenue: number; orders: number }>();
  for (const o of paid) {
    const k = dayKey(o.createdAt);
    const b = dayBuckets.get(k) ?? { revenue: 0, orders: 0 };
    b.revenue += o.total;
    b.orders += 1;
    dayBuckets.set(k, b);
  }
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = dayKey(d);
    const b = dayBuckets.get(k) ?? { revenue: 0, orders: 0 };
    daily.push({ label: k, revenue: b.revenue, orders: b.orders });
  }

  // ---- Weekly: last 8 weeks ----------------------------------------------
  const weekBuckets = new Map<string, { revenue: number; orders: number }>();
  for (const o of paid) {
    const k = dayKey(weekStart(o.createdAt));
    const b = weekBuckets.get(k) ?? { revenue: 0, orders: 0 };
    b.revenue += o.total;
    b.orders += 1;
    weekBuckets.set(k, b);
  }
  const weekly: SeriesPoint[] = [];
  const thisWeek = weekStart(new Date());
  for (let i = 7; i >= 0; i--) {
    const d = new Date(thisWeek);
    d.setDate(d.getDate() - i * 7);
    const k = dayKey(d);
    const b = weekBuckets.get(k) ?? { revenue: 0, orders: 0 };
    weekly.push({ label: k, revenue: b.revenue, orders: b.orders });
  }

  // ---- Monthly: last 6 months --------------------------------------------
  const monthBuckets = new Map<string, { revenue: number; orders: number }>();
  for (const o of paid) {
    const k = monthKey(o.createdAt);
    const b = monthBuckets.get(k) ?? { revenue: 0, orders: 0 };
    b.revenue += o.total;
    b.orders += 1;
    monthBuckets.set(k, b);
  }
  const monthly: SeriesPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i, 1);
    const k = monthKey(d);
    const b = monthBuckets.get(k) ?? { revenue: 0, orders: 0 };
    monthly.push({ label: k, revenue: b.revenue, orders: b.orders });
  }

  // ---- Top products -------------------------------------------------------
  const lineItems = await prisma.orderItem.findMany({
    where: { order: { status: { not: "CANCELLED" } } },
    select: { nameAr: true, nameEn: true, quantity: true, lineTotal: true },
  });

  const productMap = new Map<string, TopProduct>();
  for (const li of lineItems) {
    const key = li.nameEn;
    const p =
      productMap.get(key) ??
      { nameAr: li.nameAr, nameEn: li.nameEn, quantity: 0, revenue: 0 };
    p.quantity += li.quantity;
    p.revenue += li.lineTotal;
    productMap.set(key, p);
  }
  const topProducts = [...productMap.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  // ---- Status breakdown ---------------------------------------------------
  const statusMap = new Map<string, number>();
  for (const o of orders) {
    statusMap.set(o.status, (statusMap.get(o.status) ?? 0) + 1);
  }
  const statusBreakdown = [...statusMap.entries()].map(([status, count]) => ({
    status,
    count,
  }));

  return { summary, daily, weekly, monthly, topProducts, statusBreakdown };
}
