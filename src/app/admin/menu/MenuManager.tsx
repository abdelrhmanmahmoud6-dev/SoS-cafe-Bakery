"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Loader2,
  Eye,
  EyeOff,
  Star,
  Upload,
  AlertCircle,
  ImageOff,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { MenuItemDTO } from "@/lib/menu-service";
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
  type MenuItemInput,
} from "@/app/actions/admin";
import { cn, foldForSearch, formatEGP, isUsableImageUrl } from "@/lib/utils";

type Category = { id: string; ar: string; en: string };

/**
 * Whether the file-upload route can actually store anything.
 *
 * /api/upload writes to the local filesystem, which is read-only on Vercel, so
 * the button is hidden there instead of offering an action that can only fail.
 * Set NEXT_PUBLIC_UPLOADS_ENABLED=1 once a blob store is wired up.
 */
const UPLOADS_ENABLED =
  process.env.NEXT_PUBLIC_UPLOADS_ENABLED === "1" ||
  !process.env.NEXT_PUBLIC_VERCEL_ENV;

type MenuStrings = { [k: string]: string };

function uploadErrorText(code: string, m: MenuStrings): string {
  const map: Record<string, string | undefined> = {
    STORAGE_NOT_CONFIGURED: m.uploadUnavailable,
    TOO_LARGE: m.uploadTooLarge,
    TYPE_NOT_ALLOWED: m.uploadBadType,
    UNAUTHORISED: m.uploadUnauthorised,
  };
  return map[code] ?? m.uploadFailed;
}

function saveErrorText(code: string, m: MenuStrings): string {
  const map: Record<string, string | undefined> = {
    NAME_AR_REQUIRED: m.errNameAr,
    NAME_EN_REQUIRED: m.errNameEn,
    CATEGORY_REQUIRED: m.errCategory,
    PRICE_REQUIRED: m.errPrice,
    PRICE_INVALID: m.errPrice,
    PRICE_AMBIGUOUS: m.errPrice,
  };
  return map[code] ?? m.errGeneric;
}

/**
 * Square image preview that degrades to a placeholder icon.
 *
 * Failure is tracked in React state rather than by hiding the node with an
 * inline style: the old approach left `display:none` on the element, so once an
 * admin pasted a broken link the preview stayed blank even after they fixed it.
 * Callers pass `key={url}` so a new URL remounts with a clean slate.
 */
function UrlThumb({
  url,
  size = "lg",
}: {
  url: string | null | undefined;
  size?: "sm" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const box = size === "sm" ? "size-10 rounded-lg" : "size-20 rounded-xl";

  if (!url || failed) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center bg-ink-800 text-muted-dim",
          box
        )}
      >
        <ImageOff aria-hidden className={size === "sm" ? "size-4" : "size-6"} />
      </span>
    );
  }

  return (
    // Plain <img>: an admin can paste any host, and routing those through
    // next/image would need wildcard remotePatterns and turn the optimiser
    // into an open image proxy.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("shrink-0 object-cover ring-1 ring-ink-600", box)}
    />
  );
}

export function MenuManager({
  initialItems,
  categories,
}: {
  initialItems: MenuItemDTO[];
  categories: Category[];
}) {
  const { sh, lang } = useI18n();
  const m = sh.admin.menu;

  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [editing, setEditing] = useState<MenuItemDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = foldForSearch(query);
    return items.filter((i) => {
      if (catFilter !== "all" && i.cat !== catFilter) return false;
      if (!q) return true;
      return foldForSearch(`${i.ar} ${i.en}`).includes(q);
    });
  }, [items, query, catFilter]);

  function upsertLocal(item: MenuItemDTO) {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id);
      if (idx === -1) return [item, ...prev];
      const next = [...prev];
      next[idx] = item;
      return next;
    });
  }

  async function handleToggle(item: MenuItemDTO) {
    setBusyId(item.id);
    const res = await toggleAvailability(item.id, !item.available);
    if (res.ok && res.item) upsertLocal(res.item);
    setBusyId(null);
  }

  async function handleDelete(item: MenuItemDTO) {
    if (!window.confirm(m.confirmDelete)) return;
    setBusyId(item.id);
    const res = await deleteMenuItem(item.id);
    if (res.ok) {
      setItems((prev) => prev.filter((p) => p.id !== item.id));
    } else if (res.error === "IN_USE_HIDDEN_INSTEAD") {
      // Referenced by past orders — hidden rather than destroyed.
      setItems((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, available: false } : p))
      );
      setNotice(m.inUseHidden);
      window.setTimeout(() => setNotice(null), 6000);
    }
    setBusyId(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-cream sm:text-3xl">
            {m.title}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {m.subtitle} · <span className="num">{items.length}</span>{" "}
            {m.itemsCount}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-gold-500 px-5 font-extrabold text-ink-950 shadow-glow transition-colors duration-200 hover:bg-gold-400"
        >
          <Plus aria-hidden className="size-5" />
          {m.add}
        </button>
      </div>

      {notice && (
        <p
          role="status"
          className="mb-4 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3.5 text-sm font-semibold text-amber-200"
        >
          <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {notice}
        </p>
      )}

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="admin-menu-search" className="sr-only">
            {m.searchPlaceholder}
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-dim"
          />
          <input
            id="admin-menu-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={m.searchPlaceholder}
            className="h-13 w-full rounded-xl border border-ink-700 bg-ink-900 ps-12 pe-4 text-cream placeholder:text-muted-dim focus:border-gold-500/60 focus:outline-none"
          />
        </div>
        <div className="sm:w-64">
          <label htmlFor="admin-cat-filter" className="sr-only">
            {m.category}
          </label>
          <select
            id="admin-cat-filter"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="h-13 w-full cursor-pointer appearance-none rounded-xl border border-ink-700 bg-ink-900 px-4 text-sm font-semibold text-cream focus:border-gold-500/60 focus:outline-none"
          >
            <option value="all">{sh.admin.orders.filterAll}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {lang === "ar" ? c.ar : c.en}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-ink-700">
        <table className="w-full min-w-[46rem] text-start text-sm">
          <thead className="bg-ink-800 text-muted">
            <tr>
              <th scope="col" className="p-3 text-start font-bold">
                {m.nameAr} / {m.nameEn}
              </th>
              <th scope="col" className="p-3 text-start font-bold">
                {m.category}
              </th>
              <th scope="col" className="p-3 text-start font-bold">
                {m.price}
              </th>
              <th scope="col" className="p-3 text-start font-bold">
                {m.available}
              </th>
              <th scope="col" className="p-3 text-end font-bold">
                <span className="sr-only">{m.edit}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr
                key={item.id}
                className={cn(
                  "border-t border-ink-800 transition-colors duration-150 hover:bg-ink-800/40",
                  !item.available && "opacity-55"
                )}
              >
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <UrlThumb
                      key={item.imageUrl ?? "none"}
                      url={item.imageUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-bold text-cream">
                        {item.ar}
                        {item.best && (
                          <Star
                            aria-label="Best seller"
                            className="size-3.5 shrink-0 fill-gold-500 text-gold-500"
                          />
                        )}
                      </p>
                      <p className="truncate font-en text-xs text-muted-dim">
                        {item.en}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-muted">
                  {lang === "ar"
                    ? categories.find((c) => c.id === item.cat)?.ar
                    : categories.find((c) => c.id === item.cat)?.en}
                </td>
                <td className="p-3 font-en font-bold text-gold-500 num">
                  {item.sizes
                    ? `L ${item.sizes.L} · XL ${item.sizes.XL}`
                    : formatEGP(item.price ?? 0, lang)}
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => void handleToggle(item)}
                    disabled={busyId === item.id}
                    aria-pressed={item.available}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition-colors duration-200",
                      item.available
                        ? "text-emerald-300 hover:bg-emerald-400/10"
                        : "text-rose-300 hover:bg-rose-400/10"
                    )}
                  >
                    {busyId === item.id ? (
                      <Loader2 aria-hidden className="size-4 animate-spin" />
                    ) : item.available ? (
                      <Eye aria-hidden className="size-4" />
                    ) : (
                      <EyeOff aria-hidden className="size-4" />
                    )}
                    {item.available ? m.available : m.outOfStock}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(item)}
                      aria-label={`${m.edit}: ${item.ar}`}
                      className="flex size-11 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors duration-200 hover:bg-ink-800 hover:text-gold-500"
                    >
                      <Pencil aria-hidden className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item)}
                      aria-label={`${m.delete}: ${item.ar}`}
                      className="flex size-11 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors duration-200 hover:bg-rose-400/10 hover:text-rose-300"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="p-10 text-center text-muted">{sh.admin.analytics.noData}</p>
        )}
      </div>

      {/* Editor */}
      <AnimatePresence>
        {(editing || creating) && (
          <ItemEditor
            item={editing}
            categories={categories}
            onClose={() => {
              setEditing(null);
              setCreating(false);
            }}
            onSaved={(saved) => {
              upsertLocal(saved);
              setEditing(null);
              setCreating(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Create / edit dialog                                                      */
/* -------------------------------------------------------------------------- */

function ItemEditor({
  item,
  categories,
  onClose,
  onSaved,
}: {
  item: MenuItemDTO | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (item: MenuItemDTO) => void;
}) {
  const { sh, lang } = useI18n();
  const m = sh.admin.menu;
  const fileRef = useRef<HTMLInputElement>(null);

  const [nameAr, setNameAr] = useState(item?.ar ?? "");
  const [nameEn, setNameEn] = useState(item?.en ?? "");
  const [descAr, setDescAr] = useState(item?.descAr ?? "");
  const [descEn, setDescEn] = useState(item?.descEn ?? "");
  const [categoryId, setCategoryId] = useState(item?.cat ?? categories[0]?.id ?? "");
  const [twoSizes, setTwoSizes] = useState(item?.sizes != null);
  const [price, setPrice] = useState(String(item?.price ?? ""));
  const [priceL, setPriceL] = useState(String(item?.sizes?.L ?? ""));
  const [priceXL, setPriceXL] = useState(String(item?.sizes?.XL ?? ""));
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "");
  const [best, setBest] = useState(item?.best ?? false);
  const [available, setAvailable] = useState(item?.available ?? true);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  /**
   * Upload and save failures are tracked separately on purpose.
   *
   * They shared one `error` slot before, which is what made pasting a URL look
   * broken: a failed upload set STORAGE_NOT_CONFIGURED, typing a URL did not
   * clear it, and the banner sat there implying the URL had been rejected too.
   * The two paths are independent — a pasted URL never touches storage — so
   * their errors are now reported independently as well.
   */
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setUploadError(json.error ?? "UPLOAD_FAILED");
        return;
      }
      setImageUrl(json.url);
    } catch {
      setUploadError("UPLOAD_FAILED");
    } finally {
      setUploading(false);
    }
  }

  /**
   * Typing in the URL field clears any leftover upload complaint — the two are
   * unrelated, and a stale storage error must never make a valid URL look
   * rejected.
   */
  function changeImageUrl(next: string) {
    setImageUrl(next);
    if (uploadError) setUploadError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    const payload: MenuItemInput = {
      id: item?.id,
      nameAr,
      nameEn,
      descAr,
      descEn,
      categoryId,
      price: twoSizes ? null : Number(price),
      priceL: twoSizes ? Number(priceL) : null,
      priceXL: twoSizes ? Number(priceXL) : null,
      imageUrl: imageUrl || null,
      isBestSeller: best,
      isAvailable: available,
    };

    const res = item
      ? await updateMenuItem(payload)
      : await createMenuItem(payload);

    if (res.ok && res.item) {
      onSaved(res.item);
    } else if (!res.ok) {
      setSaveError(res.error);
    }
    setSaving(false);
  }

  // Only complain once there is something to complain about.
  const urlLooksWrong = imageUrl.trim() !== "" && !isUsableImageUrl(imageUrl);

  const inputClass =
    "h-12 w-full rounded-xl border border-ink-600 bg-ink-800 px-4 text-cream placeholder:text-muted-dim focus:border-gold-500/60 focus:outline-none";
  const labelClass = "mb-1.5 block text-sm font-bold text-cream";

  return (
    <div className="fixed inset-0 z-80 flex items-end justify-center sm:items-center sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/88 backdrop-blur-md"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 330, damping: 30 }}
        className="relative flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-ink-700 bg-ink-900 shadow-float sm:rounded-3xl"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-ink-700 p-5">
          <h2 id="editor-title" className="text-xl font-extrabold text-cream">
            {item ? m.edit : m.add}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={m.cancel}
            className="flex size-11 cursor-pointer items-center justify-center rounded-xl border border-ink-600 text-cream hover:border-gold-500/60 hover:text-gold-500"
          >
            <X aria-hidden className="size-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="f-ar" className={labelClass}>{m.nameAr}</label>
                <input id="f-ar" required value={nameAr} onChange={(e) => setNameAr(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="f-en" className={labelClass}>{m.nameEn}</label>
                <input id="f-en" required dir="ltr" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={cn(inputClass, "font-en text-start")} />
              </div>
              <div>
                <label htmlFor="f-dar" className={labelClass}>{m.descAr}</label>
                <input id="f-dar" value={descAr} onChange={(e) => setDescAr(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="f-den" className={labelClass}>{m.descEn}</label>
                <input id="f-den" dir="ltr" value={descEn} onChange={(e) => setDescEn(e.target.value)} className={cn(inputClass, "font-en text-start")} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="f-cat" className={labelClass}>{m.category}</label>
                <select id="f-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={cn(inputClass, "cursor-pointer appearance-none")}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{lang === "ar" ? c.ar : c.en}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing */}
            <fieldset className="mt-5">
              <legend className={labelClass}>{m.pricingMode}</legend>
              <div className="mb-3 grid grid-cols-2 gap-2">
                {[
                  { key: false, label: m.singlePrice },
                  { key: true, label: m.twoSizes },
                ].map((opt) => (
                  <button
                    key={String(opt.key)}
                    type="button"
                    onClick={() => setTwoSizes(opt.key)}
                    aria-pressed={twoSizes === opt.key}
                    className={cn(
                      "min-h-12 cursor-pointer rounded-xl border text-sm font-bold transition-colors duration-200",
                      twoSizes === opt.key
                        ? "border-gold-500 bg-gold-500/12 text-gold-500"
                        : "border-ink-600 bg-ink-800 text-muted hover:text-cream"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {twoSizes ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="f-l" className={labelClass}>{m.priceL}</label>
                    <input id="f-l" required type="number" min={0} dir="ltr" value={priceL} onChange={(e) => setPriceL(e.target.value)} className={cn(inputClass, "font-en text-start")} />
                  </div>
                  <div>
                    <label htmlFor="f-xl" className={labelClass}>{m.priceXL}</label>
                    <input id="f-xl" required type="number" min={0} dir="ltr" value={priceXL} onChange={(e) => setPriceXL(e.target.value)} className={cn(inputClass, "font-en text-start")} />
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="f-p" className={labelClass}>{m.price}</label>
                  <input id="f-p" required type="number" min={0} dir="ltr" value={price} onChange={(e) => setPrice(e.target.value)} className={cn(inputClass, "font-en text-start")} />
                </div>
              )}
            </fieldset>

            {/* Image */}
            <div className="mt-5">
              <span className={labelClass}>{m.image}</span>
              <div className="flex items-center gap-4">
                {/* Live thumbnail, re-evaluated on every keystroke. Keyed on
                    the URL so pasting a corrected link clears a previous
                    failure instead of leaving the preview permanently blank. */}
                <UrlThumb key={imageUrl} url={imageUrl} />

                <div className="flex flex-col gap-2">
                  {/* File upload writes to local disk, which does not exist on
                      Vercel. Rather than offer a button that can only fail, it
                      is hidden there and the URL field below carries the job. */}
                  {UPLOADS_ENABLED ? (
                    <>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void handleUpload(f);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-ink-600 px-4 text-sm font-bold text-cream hover:border-gold-500/60 hover:text-gold-500 disabled:opacity-60"
                      >
                        {uploading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Upload aria-hidden className="size-4" />}
                        {uploading ? m.uploading : m.uploadImage}
                      </button>
                    </>
                  ) : (
                    <p className="max-w-56 text-xs leading-relaxed text-muted-dim">
                      {m.uploadUnavailable}
                    </p>
                  )}

                  {imageUrl && (
                    <button type="button" onClick={() => changeImageUrl("")} className="min-h-11 cursor-pointer text-start text-xs font-bold text-muted-dim hover:text-rose-300">
                      {m.removeImage}
                    </button>
                  )}
                </div>
              </div>

              {uploadError && (
                <p
                  role="alert"
                  className="mt-2.5 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs font-semibold leading-relaxed text-amber-200"
                >
                  <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
                  {uploadErrorText(uploadError, m)}
                </p>
              )}

              {/* Paste a URL instead of uploading — the only route that works
                  on Vercel, where the filesystem is read-only. */}
              <div className="mt-3">
                <label htmlFor="f-imgurl" className={labelClass}>
                  {m.imageUrl}
                </label>
                <input
                  id="f-imgurl"
                  dir="ltr"
                  type="url"
                  inputMode="url"
                  value={imageUrl}
                  onChange={(e) => changeImageUrl(e.target.value)}
                  placeholder="https://example.com/waffle.jpg"
                  className={cn(
                    inputClass,
                    "font-en text-start",
                    urlLooksWrong && "border-amber-400/60"
                  )}
                />
                <p
                  className={cn(
                    "mt-1.5 text-xs leading-relaxed",
                    urlLooksWrong ? "text-amber-300" : "text-muted-dim"
                  )}
                >
                  {urlLooksWrong ? m.imageUrlInvalid : m.imageUrlHint}
                </p>
              </div>
            </div>

            {/* Flags */}
            <div className="mt-5 flex flex-wrap gap-3">
              <label className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border border-ink-600 bg-ink-800 px-4 text-sm font-bold text-cream">
                <input type="checkbox" checked={best} onChange={(e) => setBest(e.target.checked)} className="size-4 accent-gold-500" />
                {m.bestSeller}
              </label>
              <label className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-xl border border-ink-600 bg-ink-800 px-4 text-sm font-bold text-cream">
                <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="size-4 accent-gold-500" />
                {m.available}
              </label>
            </div>

            {saveError && (
              <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3.5 text-sm font-semibold text-rose-200">
                <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
                {saveErrorText(saveError, m)}
              </p>
            )}
          </div>

          <footer className="flex shrink-0 gap-3 border-t border-ink-700 p-5">
            <button
              type="submit"
              disabled={saving}
              className="flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold-500 px-5 font-extrabold text-ink-950 hover:bg-gold-400 disabled:opacity-60"
            >
              {saving && <Loader2 aria-hidden className="size-5 animate-spin" />}
              {saving ? m.saving : m.save}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 cursor-pointer rounded-xl border border-ink-600 px-5 font-bold text-cream hover:border-gold-500/60 hover:text-gold-500"
            >
              {m.cancel}
            </button>
          </footer>
        </form>
      </motion.div>
    </div>
  );
}
