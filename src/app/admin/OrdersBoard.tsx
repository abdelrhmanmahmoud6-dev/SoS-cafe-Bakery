"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Phone,
  MapPin,
  StickyNote,
  Volume2,
  VolumeX,
  Inbox,
  Loader2,
  Smartphone,
  Banknote,
  Bike,
  Store,
  Receipt,
  ChevronsRight,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { listOrders, updateOrderStatus, type AdminOrder } from "@/app/actions/orders";
import {
  ORDER_STATUSES,
  STATUS_TONE,
  cycleStatus,
  statusLabel,
  ORDER_TYPE_LABELS,
  DELIVERY_AREA_LABELS,
  PAYMENT_LABELS,
  isCourierPriced,
  type DeliveryArea,
  type OrderStatus,
  type OrderType,
  type PaymentMethod,
} from "@/lib/order-types";
import { cn, formatEGP, timeAgo } from "@/lib/utils";
import { useAdminUi } from "@/store/admin-ui";
import { whatsappInvoiceLink, siteOrigin } from "@/lib/whatsapp";
import { playChime, unlockChime } from "@/lib/chime";

const POLL_MS = 5000;

export function OrdersBoard({ initial }: { initial: AdminOrder[] }) {
  const { sh, lang } = useI18n();
  const [orders, setOrders] = useState<AdminOrder[]>(initial);
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
  const soundOn = useAdminUi((s) => s.soundOn);
  const setSoundOn = useAdminUi((s) => s.setSoundOn);
  const markAudioUnlocked = useAdminUi((s) => s.markAudioUnlocked);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Track known order ids so we only chime for genuinely new ones.
  const knownIds = useRef<Set<string>>(new Set(initial.map((o) => o.id)));

  const refresh = useCallback(async () => {
    try {
      const next = await listOrders({ limit: 60 });
      const fresh = next.filter((o) => !knownIds.current.has(o.id));
      if (fresh.length > 0) {
        next.forEach((o) => knownIds.current.add(o.id));
        if (soundOn) playChime();
      }
      setOrders(next);
    } catch (err) {
      console.error("Order poll failed:", err);
    }
  }, [soundOn]);

  useEffect(() => {
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  async function changeStatus(orderId: string, status: OrderStatus) {
    setBusyId(orderId);
    // Optimistic: reflect immediately, then reconcile from the server.
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    try {
      await updateOrderStatus(orderId, status);
      await refresh();
    } catch (err) {
      console.error(err);
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  const visible =
    filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  const counts = ORDER_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-espresso sm:text-3xl">
            {sh.admin.orders.title}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            {sh.admin.orders.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const next = !soundOn;
            setSoundOn(next);
            if (next) {
              unlockChime();
              markAudioUnlocked();
              playChime();
            }
          }}
          aria-pressed={soundOn}
          className={cn(
            "flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm font-bold transition-colors duration-200",
            soundOn
              ? "border-gold-500/50 bg-gold-500/10 text-gold-800"
              : "border-sand-400 text-muted hover:text-espresso"
          )}
        >
          {soundOn ? (
            <Volume2 aria-hidden className="size-4" />
          ) : (
            <VolumeX aria-hidden className="size-4" />
          )}
          {soundOn ? sh.admin.orders.soundOn : sh.admin.orders.soundOff}
        </button>
      </div>

      {/* Status filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <FilterPill
          active={filter === "ALL"}
          onClick={() => setFilter("ALL")}
          label={sh.admin.orders.filterAll}
          count={orders.length}
        />
        {ORDER_STATUSES.map((s) => (
          <FilterPill
            key={s}
            active={filter === s}
            onClick={() => setFilter(s)}
            label={statusLabel(s, "TAKEAWAY")[lang]}
            count={counts[s] ?? 0}
          />
        ))}
      </div>

      {/* Board */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-sand-400 bg-sand-100/50 px-6 py-20 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-sand-200 text-muted-dim">
            <Inbox aria-hidden className="size-8" />
          </span>
          <h2 className="text-xl font-extrabold text-espresso">
            {sh.admin.orders.none}
          </h2>
          <p className="max-w-sm leading-relaxed text-muted">
            {sh.admin.orders.noneHint}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((order) => (
              <motion.article
                key={order.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col overflow-hidden rounded-2xl border border-sand-300 bg-sand-100/80"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-3 border-b border-sand-300 p-4">
                  <div>
                    <p className="font-en text-lg font-extrabold text-espresso num">
                      {order.code}
                    </p>
                    <p className="text-xs text-muted-dim">
                      {timeAgo(order.createdAt, lang)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1 text-xs font-extrabold",
                      STATUS_TONE[order.status]
                    )}
                  >
                    {statusLabel(order.status, order.orderType as OrderType)[lang]}
                  </span>
                </div>

                {/* Customer */}
                <div className="flex flex-col gap-2 border-b border-sand-300 p-4 text-sm">
                  <p className="font-bold text-espresso">{order.customerName}</p>

                  <a
                    href={`tel:+2${order.customerPhone}`}
                    className="flex min-h-11 w-fit cursor-pointer items-center gap-2 text-muted transition-colors duration-200 hover:text-gold-800"
                  >
                    <Phone aria-hidden className="size-4 shrink-0 text-gold-800" />
                    <span dir="ltr" className="font-en font-bold num">
                      {order.customerPhone}
                    </span>
                  </a>

                  <p className="flex items-start gap-2 text-muted">
                    {order.orderType === "DELIVERY" ? (
                      <Bike aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-800" />
                    ) : (
                      <Store aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-800" />
                    )}
                    <span>
                      {ORDER_TYPE_LABELS[order.orderType as OrderType]?.[lang]}
                      {order.deliveryArea && (
                        <span className="block text-xs text-muted-dim">
                          {
                            DELIVERY_AREA_LABELS[
                              order.deliveryArea as DeliveryArea
                            ]?.[lang]
                          }
                        </span>
                      )}
                    </span>
                  </p>

                  {/* The courier collects this fee, so it must not read as
                      "free delivery" on the board. */}
                  {isCourierPriced(
                    order.orderType as OrderType,
                    order.deliveryArea as DeliveryArea | null
                  ) && (
                    <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-2.5 py-1.5 text-xs font-bold text-amber-200">
                      {sh.checkout.courierPriced}
                    </p>
                  )}

                  <p className="flex items-center gap-2 text-muted">
                    {order.paymentMethod === "VODAFONE_CASH" ? (
                      <Smartphone aria-hidden className="size-4 shrink-0 text-gold-800" />
                    ) : (
                      <Banknote aria-hidden className="size-4 shrink-0 text-gold-800" />
                    )}
                    {PAYMENT_LABELS[order.paymentMethod as PaymentMethod]?.[lang]}
                  </p>

                  {order.paymentRef && (
                    <p className="rounded-lg border border-gold-500/25 bg-gold-500/[0.07] px-2.5 py-1.5 text-xs text-gold-800">
                      <span className="font-bold">
                        {sh.admin.orders.paymentRef}:{" "}
                      </span>
                      <span dir="ltr" className="font-en num">
                        {order.paymentRef}
                      </span>
                    </p>
                  )}

                  {order.address && (
                    <p className="flex items-start gap-2 text-muted">
                      <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-800" />
                      <span className="leading-relaxed">{order.address}</span>
                    </p>
                  )}

                  {order.notes && (
                    <p className="flex items-start gap-2 rounded-lg bg-sand-200 p-2.5 text-xs leading-relaxed text-espresso">
                      <StickyNote aria-hidden className="mt-0.5 size-3.5 shrink-0 text-gold-800" />
                      {order.notes}
                    </p>
                  )}
                </div>

                {/* Items */}
                <ul className="flex flex-1 flex-col gap-2 border-b border-sand-300 p-4 text-sm">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex items-start justify-between gap-3">
                      <span className="min-w-0 text-espresso">
                        <span className="font-en font-extrabold text-gold-800 num">
                          {item.quantity}×
                        </span>{" "}
                        {lang === "ar" ? item.nameAr : item.nameEn}
                        {item.size && (
                          <span className="ms-1.5 rounded bg-gold-500/12 px-1.5 py-0.5 font-en text-[10px] font-extrabold text-gold-800">
                            {item.size}
                          </span>
                        )}
                        {item.addons.length > 0 && (
                          <span className="block text-xs text-muted-dim">
                            +{" "}
                            {item.addons
                              .map((a) => (lang === "ar" ? a.nameAr : a.nameEn))
                              .join("، ")}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 font-en font-bold text-muted num">
                        {item.lineTotal}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Total + status control */}
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-muted">
                      {sh.admin.orders.total}
                    </span>
                    <span className="font-en text-xl font-extrabold text-gold-800 num">
                      {formatEGP(order.total, lang)}
                    </span>
                  </div>

                  {/* One tap: opens WhatsApp addressed to the CUSTOMER with
                      the itemised receipt and their tracking link. */}
                  <a
                    href={whatsappInvoiceLink(
                      {
                        code: order.code,
                        customerName: order.customerName,
                        customerPhone: order.customerPhone,
                        orderType: order.orderType,
                        deliveryArea: order.deliveryArea,
                        paymentMethod: order.paymentMethod,
                        subtotal: order.subtotal,
                        deliveryFee: order.deliveryFee,
                        total: order.total,
                        items: order.items.map((i) => ({
                          nameAr: i.nameAr,
                          quantity: i.quantity,
                          lineTotal: i.lineTotal,
                        })),
                      },
                      siteOrigin()
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-3 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-extrabold text-[#04310f] transition-colors duration-200 hover:bg-[#1FBF5A]"
                  >
                    <Receipt aria-hidden className="size-4" />
                    {sh.admin.orders.sendInvoice}
                  </a>

                  <StatusFlow
                    order={order}
                    busy={busyId === order.id}
                    onSet={(status) => void changeStatus(order.id, status)}
                  />
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm font-bold transition-colors duration-200",
        active
          ? "border-gold-500 bg-gold-500 text-espresso"
          : "border-sand-400 bg-sand-100/60 text-muted hover:text-espresso"
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-md px-1.5 py-0.5 font-en text-[10px] font-extrabold num",
          active ? "bg-sand-50/15 text-espresso" : "bg-sand-200 text-muted-dim"
        )}
      >
        {count}
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  StatusFlow — one button, cycling the order lifecycle                      */
/* -------------------------------------------------------------------------- */

/**
 * A single badge that IS the control.
 *
 * It shows the status the order is in and, on click, advances to the next one:
 * received -> preparing -> on the way -> delivered -> cancelled -> back round.
 * There is nothing else to aim at, which is the point — the counter reads the
 * state and changes it in the same glance, one tap, without a dropdown to open
 * or a grid of look-alike buttons to pick from.
 *
 * Two details that keep a one-tap control honest:
 *
 * - The next stage is printed on the button itself, so the outcome is legible
 *   BEFORE the tap rather than discovered after it.
 * - The badge takes the status colour from STATUS_TONE, so the card changes
 *   appearance the moment the write lands and the change is visible from across
 *   the counter, not just in the text.
 */
function StatusFlow({
  order,
  busy,
  onSet,
}: {
  order: AdminOrder;
  busy: boolean;
  onSet: (status: OrderStatus) => void;
}) {
  const { sh, lang } = useI18n();
  const m = sh.admin.orders;
  const upcoming = cycleStatus(order.status);
  const currentText = statusLabel(order.status, order.orderType as OrderType)[lang];
  const nextText = statusLabel(upcoming, order.orderType as OrderType)[lang];

  return (
    <div>
      <span className="mb-1.5 block text-xs font-bold text-muted-dim">
        {m.statusFlow}
      </span>

      <button
        type="button"
        disabled={busy}
        onClick={() => onSet(upcoming)}
        // The accessible name carries both halves: a screen reader user gets
        // the current state and what pressing will do, which is exactly what
        // the sighted user reads off the two lines.
        aria-label={`${currentText} — ${m.advanceTo}: ${nextText}`}
        className={cn(
          "flex w-full min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4",
          "transition-[transform,background-color,border-color] duration-200 active:scale-[0.97] disabled:opacity-60",
          STATUS_TONE[order.status],
          "hover:brightness-95"
        )}
      >
        <span className="flex min-w-0 flex-col items-start text-start">
          <span className="truncate text-sm font-extrabold">{currentText}</span>
          <span className="truncate text-[10px] font-bold opacity-70">
            {m.advanceTo}: {nextText}
          </span>
        </span>

        {busy ? (
          <Loader2 aria-hidden className="size-5 shrink-0 animate-spin" />
        ) : (
          <ChevronsRight aria-hidden className="size-5 shrink-0 rtl:-scale-x-100" />
        )}
      </button>
    </div>
  );
}
