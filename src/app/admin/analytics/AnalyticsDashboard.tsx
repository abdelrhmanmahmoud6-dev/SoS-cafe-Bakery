"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Wallet,
  ReceiptText,
  TrendingUp,
  CalendarDays,
  XCircle,
  Bike,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { AnalyticsPayload, SeriesPoint } from "@/app/actions/analytics";
import { statusLabel, type OrderStatus } from "@/lib/order-types";
import { formatEGP } from "@/lib/utils";

/* ---------------------------------------------------------------------------
   Chart colour decisions (per the dataviz procedure):
   Every chart here is SINGLE-SERIES, so there is no categorical palette to
   assign — the brand gold encodes magnitude and the chart title carries
   identity, which is why none of these charts needs a legend.
   No chart uses two y-axes. The status breakdown is deliberately NOT a pie:
   it is a labelled bar list in one hue, so identity comes from the text label
   rather than from colour.
   --------------------------------------------------------------------------- */
const GOLD = "#DFFF3C";
const GRID = "#26262E";
const AXIS_TEXT = "#8A8A94";
const SURFACE = "#141418";

export function AnalyticsDashboard({ data }: { data: AnalyticsPayload }) {
  const { sh, lang } = useI18n();
  const a = sh.admin.analytics;

  const hasData = data.summary.totalOrders > 0;

  const tiles: {
    icon: typeof Wallet;
    label: string;
    value: string;
    sub?: string;
  }[] = [
    {
      icon: Wallet,
      label: a.totalRevenue,
      value: formatEGP(data.summary.totalRevenue, lang),
    },
    {
      icon: ReceiptText,
      label: a.totalOrders,
      value: String(data.summary.totalOrders),
    },
    {
      icon: TrendingUp,
      label: a.avgOrder,
      value: formatEGP(data.summary.averageOrderValue, lang),
    },
    {
      icon: CalendarDays,
      label: a.today,
      value: formatEGP(data.summary.todayRevenue, lang),
      // Two numbers in one string read ambiguously in RTL, so the order count
      // gets its own line rather than a bullet separator.
      sub: `${data.summary.todayOrders} ${a.orders}`,
    },
    {
      icon: Bike,
      label: a.deliveryShare,
      value: `${data.summary.deliveryShare}%`,
    },
    {
      icon: XCircle,
      label: a.cancelled,
      value: String(data.summary.cancelledOrders),
    },
  ];

  /** Short axis label: "05-09" -> "05/09" for days, "2026-03" -> "Mar". */
  function dayTick(label: string): string {
    const [, m, d] = label.split("-");
    return `${d}/${m}`;
  }
  function monthTick(label: string): string {
    const [y, m] = label.split("-");
    return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en", {
      month: "short",
    }).format(new Date(Number(y), Number(m) - 1, 1));
  }

  return (
    <div dir="ltr" className="flex flex-col gap-6">
      <div dir={lang === "ar" ? "rtl" : "ltr"}>
        <h1 className="text-2xl font-extrabold text-cream sm:text-3xl">
          {a.title}
        </h1>
      </div>

      {/* Stat tiles — a headline number is not a chart */}
      <section
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <div
              key={tile.label}
              className="flex items-center gap-4 rounded-2xl border border-ink-700 bg-ink-900/80 p-5"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gold-500/10 text-gold-500 ring-1 ring-gold-500/25">
                <Icon aria-hidden className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-muted">{tile.label}</p>
                <p className="mt-0.5 truncate font-en text-2xl font-extrabold text-cream num">
                  {tile.value}
                </p>
                {tile.sub && (
                  <p className="mt-0.5 truncate text-xs font-semibold text-muted-dim">
                    <span className="num">{tile.sub}</span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {!hasData && (
        <p className="rounded-2xl border border-dashed border-ink-600 bg-ink-900/50 p-8 text-center text-muted">
          {a.noData}
        </p>
      )}

      {/* Daily sales — discrete days, magnitude comparison => bars */}
      <ChartCard title={a.daily} rows={data.daily} rtl={lang === "ar"} tickFn={dayTick} lang={lang}>
        <BarChart data={data.daily} barCategoryGap="18%">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tickFormatter={dayTick}
            tick={{ fill: AXIS_TEXT, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: AXIS_TEXT, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            cursor={{ fill: "rgba(223,255,60,0.06)" }}
            content={<ChartTooltip lang={lang} labelFn={dayTick} revenueLabel={a.revenue} ordersLabel={a.orders} />}
          />
          {/* 4px rounded data-end, anchored to the baseline */}
          <Bar dataKey="revenue" fill={GOLD} radius={[4, 4, 0, 0]} maxBarSize={38} />
        </BarChart>
      </ChartCard>

      {/* Weekly trend — change over time => line.
          Revenue only: plotting orders here too would need a second y-scale. */}
      <ChartCard title={a.weekly} rows={data.weekly} rtl={lang === "ar"} tickFn={dayTick} lang={lang}>
        <LineChart data={data.weekly}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tickFormatter={dayTick}
            tick={{ fill: AXIS_TEXT, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: AXIS_TEXT, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            cursor={{ stroke: GOLD, strokeWidth: 1, strokeDasharray: "4 4" }}
            content={<ChartTooltip lang={lang} labelFn={dayTick} revenueLabel={a.revenue} ordersLabel={a.orders} />}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke={GOLD}
            strokeWidth={2}
            /* >=8px markers, ringed in the surface colour so overlaps stay legible */
            dot={{ r: 4, fill: GOLD, stroke: SURFACE, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: GOLD, stroke: SURFACE, strokeWidth: 2 }}
          />
        </LineChart>
      </ChartCard>

      {/* Monthly revenue */}
      <ChartCard title={a.monthly} rows={data.monthly} rtl={lang === "ar"} tickFn={monthTick} lang={lang}>
        <BarChart data={data.monthly} barCategoryGap="26%">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tickFormatter={monthTick}
            tick={{ fill: AXIS_TEXT, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: AXIS_TEXT, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            cursor={{ fill: "rgba(223,255,60,0.06)" }}
            content={<ChartTooltip lang={lang} labelFn={monthTick} revenueLabel={a.revenue} ordersLabel={a.orders} />}
          />
          <Bar dataKey="revenue" fill={GOLD} radius={[4, 4, 0, 0]} maxBarSize={54} />
        </BarChart>
      </ChartCard>

      {/* Top products + status breakdown */}
      <div dir={lang === "ar" ? "rtl" : "ltr"} className="grid gap-6 lg:grid-cols-2">
        {/* Ranked magnitude => horizontal bars, sorted, directly labelled */}
        <section className="rounded-2xl border border-ink-700 bg-ink-900/80 p-5">
          <h2 className="mb-4 font-extrabold text-cream">{a.topProducts}</h2>
          {data.topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">{a.noData}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.topProducts.map((p) => {
                const max = data.topProducts[0].quantity || 1;
                const pct = Math.round((p.quantity / max) * 100);
                return (
                  <li key={p.nameEn}>
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-bold text-cream">
                        {lang === "ar" ? p.nameAr : p.nameEn}
                      </span>
                      <span className="shrink-0 font-en text-sm font-bold text-muted num">
                        {p.quantity} · {formatEGP(p.revenue, lang)}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-ink-800">
                      <div
                        className="h-full rounded-full bg-gold-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Status mix — labelled bars in ONE hue, so identity is the text,
            never the colour alone. */}
        <section className="rounded-2xl border border-ink-700 bg-ink-900/80 p-5">
          <h2 className="mb-4 font-extrabold text-cream">{a.statusBreakdown}</h2>
          {data.statusBreakdown.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">{a.noData}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.statusBreakdown.map((s) => {
                const max =
                  Math.max(...data.statusBreakdown.map((x) => x.count)) || 1;
                const pct = Math.round((s.count / max) * 100);
                return (
                  <li key={s.status}>
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-bold text-cream">
                        {statusLabel(s.status as OrderStatus, "TAKEAWAY")[lang]}
                      </span>
                      <span className="shrink-0 font-en text-sm font-bold text-muted num">
                        {s.count}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-ink-800">
                      <div
                        className="h-full rounded-full bg-gold-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ChartCard({
  title,
  children,
  rows,
  rtl,
  tickFn,
  lang,
}: {
  title: string;
  children: React.ReactElement;
  rows: SeriesPoint[];
  rtl: boolean;
  tickFn: (label: string) => string;
  lang: "ar" | "en";
}) {
  return (
    <section className="rounded-2xl border border-ink-700 bg-ink-900/80 p-5">
      <h2 dir={rtl ? "rtl" : "ltr"} className="mb-4 font-extrabold text-cream">
        {title}
      </h2>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>

      {/* Table view — the same numbers, reachable without reading the chart */}
      <details dir={rtl ? "rtl" : "ltr"} className="mt-4 group">
        <summary className="cursor-pointer list-none text-xs font-bold text-muted-dim transition-colors duration-200 hover:text-gold-500">
          {lang === "ar" ? "عرض البيانات كجدول" : "View as table"}
        </summary>
        <div className="mt-3 max-h-56 overflow-auto rounded-xl border border-ink-700">
          <table className="w-full text-start text-xs">
            <thead className="sticky top-0 bg-ink-800 text-muted">
              <tr>
                <th scope="col" className="p-2 text-start font-bold">
                  {lang === "ar" ? "التاريخ" : "Period"}
                </th>
                <th scope="col" className="p-2 text-start font-bold">
                  {lang === "ar" ? "الإيرادات" : "Revenue"}
                </th>
                <th scope="col" className="p-2 text-start font-bold">
                  {lang === "ar" ? "الطلبات" : "Orders"}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-ink-800">
                  <td className="p-2 font-en text-cream num">{tickFn(r.label)}</td>
                  <td className="p-2 font-en text-cream num">{r.revenue}</td>
                  <td className="p-2 font-en text-cream num">{r.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

interface TooltipPayloadEntry {
  payload: SeriesPoint;
}

function ChartTooltip({
  active,
  payload,
  lang,
  labelFn,
  revenueLabel,
  ordersLabel,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  lang: "ar" | "en";
  labelFn: (label: string) => string;
  revenueLabel: string;
  ordersLabel: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-xl border border-ink-600 bg-ink-950/95 px-3.5 py-2.5 shadow-float backdrop-blur-sm">
      <p className="font-en text-xs font-bold text-muted num">
        {labelFn(point.label)}
      </p>
      {/* Values wear text tokens; the gold dot beside them carries identity. */}
      <p className="mt-1 flex items-center gap-2 text-sm font-extrabold text-cream">
        <span className="size-2 rounded-full bg-gold-500" />
        <span className="font-en num">{formatEGP(point.revenue, lang)}</span>
      </p>
      <p className="mt-0.5 text-xs text-muted">
        {ordersLabel}: <span className="font-en num">{point.orders}</span>
      </p>
      <span className="sr-only">{revenueLabel}</span>
    </div>
  );
}
