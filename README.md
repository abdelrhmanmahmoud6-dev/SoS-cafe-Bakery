# SOS Bakery And Coffee — Ordering Platform

Bilingual (Arabic-first, RTL) storefront with online ordering, order tracking and an admin dashboard for **SOS Bakery And Coffee**, Housh Eissa — next to Al-Asher Mosque. Est. 2026.

## Run it

```bash
npm install
cp .env.example .env   # then fill in the Neon connection strings
npm run db:deploy      # apply migrations
npm run db:seed        # 14 categories, 166 items, admin user
npm run dev
```

Open <http://localhost:3000>. Admin panel at `/admin`, tracking at `/track`.

Already-linked Neon project: `cold-queen-57104675`, branch `production`. Pull fresh
credentials any time with `neon deploy`, which rewrites the Neon-managed variables
in `.env` (your `AUTH_SECRET` and `ADMIN_*` entries are left alone).

Seeded admin credentials come from `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) — by default `admin@sos.cafe` / `sos-admin-2026`. **Change both before deploying.**

To populate the dashboard with demo history: `npm run db:seed:orders` (adds 45 fake orders — never run this against real data).

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript (strict) |
| Database | Prisma 7 + PostgreSQL (Neon), `@prisma/adapter-pg` |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) |
| Motion | Framer Motion 12 |
| Cart state | Zustand (persisted to `localStorage`) |
| Charts | Recharts |
| Auth | `jose` JWT in an httpOnly cookie + bcrypt |

### Neon

| Variable | Endpoint | Used by |
| --- | --- | --- |
| `DATABASE_URL` | pooled (`-pooler` host) | the running app |
| `DIRECT_URL` / `DATABASE_URL_UNPOOLED` | direct | migrations (DDL through a pooler can hang) |

`neon deploy` rewrites `DATABASE_URL` with `sslmode=require` on every run. Recent
`pg` treats that as an alias for `verify-full` and warns about it, so
`src/lib/pg-url.ts` normalises the mode at the single point every connection
passes through — rather than hand-editing `.env`, which the next deploy would undo.

Status/type/payment columns are `String` rather than native Postgres enums, so the
schema stays portable; allowed values live in `src/lib/order-types.ts`.

### Deploying to Vercel

1. Import the repo; the framework preset is Next.js.
2. Set env vars: `DATABASE_URL` (pooled), `DIRECT_URL` (direct), `AUTH_SECRET`,
   `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
3. `vercel.json` sets the build to `npm run vercel-build`, which runs
   `prisma generate && prisma migrate deploy && next build` — migrations apply on
   each deploy. `src/generated/` is gitignored, so `postinstall` regenerates the
   client.

   The region is pinned to `iad1` to sit near the Neon database in
   `aws-us-east-2`. Every page is server-rendered and queries Postgres on each
   request, so the Vercel-to-Neon round trip dominates TTFB; a European region
   would put an Atlantic hop in front of every query. If you later move the Neon
   project to `eu-central-1` (better for customers in Egypt), change this to
   `fra1` at the same time — the two should always match.

   Note that `vercel.json` is validated with `additionalProperties: false`, so it
   accepts **no** comment or custom keys. Anything not in
   <https://openapi.vercel.sh/vercel.json> fails the deploy outright.
4. After the first deploy, run `npm run db:seed` once against the production
   database to load the menu.

## Structure

```
prisma/
├── schema.prisma       ← Category, MenuItem, Order, OrderItem, OrderItemAddon, OrderEvent, AdminUser
├── seed.ts             ← 14 categories, 166 items, admin user
└── seed-orders.ts      ← demo order history (dev only)
src/
├── app/
│   ├── page.tsx                ← storefront (server-rendered from the DB)
│   ├── track/                  ← customer order tracking
│   ├── admin/                  ← login, live orders, menu manager, analytics
│   ├── api/upload/             ← authenticated image upload
│   └── actions/                ← orders.ts · admin.ts · analytics.ts (server actions)
├── components/
│   ├── shop/                   ← CartDrawer, CheckoutModal, ItemSheet, CartButton
│   └── …                       ← Navbar, Hero, About, Menu, Contact, Footer
├── lib/                        ← db, auth, order-types, menu-service, i18n, dictionaries
├── store/cart.ts               ← Zustand cart
└── proxy.ts                    ← /admin route gate
```

## Ordering flow

Takeaway or delivery (delivery fee **15 EGP**, Housh Eissa only). Payment is cash on collection, or Vodafone Cash to `01034326985` with a transaction reference captured at checkout.

**Prices are never trusted from the client.** The browser sends only item ids, size, quantity and add-on ids; `placeOrder` re-reads every price from the database and recomputes the total server-side. It also rejects unavailable items, bad Egyptian phone numbers, a delivery order without an address, and a Vodafone Cash order without a reference.

Each order gets a tracking code (`SOS-XXXXXX`) and an append-only `OrderEvent` timeline driving the customer's 4-step tracker: received → preparing → on the way / ready for pickup → delivered.

## Admin

- **Live orders** — polls every 5s, chimes on genuinely new orders (Web Audio, no asset), status changes write a timeline event.
- **Menu manager** — full CRUD, image upload, availability toggle. Deleting an item that appears in past orders **hides** it instead, so order history is never rewritten.
- **Reports** — revenue, order count, average order value, daily/weekly/monthly series, top sellers. Cancelled orders are excluded from revenue and counted separately.

Two independent gates protect it: `src/proxy.ts` redirects unauthenticated `/admin/*` requests, and every admin server action independently calls `requireAdmin()` — because server actions can be invoked directly, middleware alone is not an authorisation boundary.

## Editing the menu

Day to day, use `/admin/menu`. `prisma/seed.ts` upserts by slug, so re-running it refreshes prices without touching orders.

## Charts

Every chart is single-series, so the brand gold encodes magnitude and the title carries identity — no legend needed and no categorical palette to mis-assign. No chart uses two y-axes. The status mix is a labelled bar list rather than a pie, so identity comes from text, not colour. Each chart ships a `<details>` table view of the same numbers.

The gold/rose pair was validated for colour-vision deficiency (ΔE 23.2 deutan, 31.7 normal, contrast ≥3:1). It fails the "lightness band" check, which applies to categorical palettes — not relevant here, and the brand gold is fixed.

## Accessibility

- Arabic default, `dir="rtl"`; the toggle mirrors the whole layout via CSS logical properties.
- Interactive targets ≥44px; verified at 375px with no horizontal overflow.
- Focus rings never removed; modals trap focus and close on Escape; skip link is the first tab stop.
- `prefers-reduced-motion` honoured globally and per component.
- Contrast measured on rendered pixels: dark-on-gold and gold-on-dark **15.37:1**, body text 19.32:1, dimmest tertiary 4.96:1.

## Cold starts

Neon scales its compute endpoint to zero when idle, so the first request after a
quiet period waits for it to resume. Four things keep that off the customer's
critical path:

1. **The storefront is ISR, not dynamic** (`revalidate = 300` in
   `src/app/page.tsx`). Most visitors are served a cached page and never touch
   Postgres at all. Admin mutations call `revalidatePath("/")`, so edits still
   publish immediately.
2. **The pool fails predictably** (`src/lib/db.ts`). `connectionTimeoutMillis`
   is 6s — pg's default of `0` means *wait forever*, which is what turned a cold
   start into a hung request. `statement_timeout` is 8s, `max` is 3, and idle
   sockets are returned after 10s so a frozen lambda doesn't squat a Neon slot.
3. **Transient failures retry** — up to 2 retries with 200ms/600ms backoff.
   The classification is deliberately asymmetric: a *connect-phase* failure
   (`ECONNREFUSED`, pool timeout, Prisma `P1001`) proves the statement never
   reached Postgres, so anything may be retried; an *in-flight* failure
   (`ECONNRESET`, "connection terminated") is retried **only for reads**,
   because re-issuing a `create` that already committed would place a second
   order. `isRetryable()` is exported so this is testable without a database.
4. **The UI degrades instead of crashing.** `loading.tsx` paints a branded
   skeleton immediately; `error.tsx` / `global-error.tsx` / `admin/error.tsx`
   catch a failure, retry once silently, then offer "try again" plus the shop's
   phone number. The auto-retry budget lives at module scope, not in component
   state — `reset()` remounts the component, so a state-based counter would
   retry forever.

If you later need longer than the platform's default function timeout, add
`export const maxDuration = 30` to a route segment — check your Vercel plan's
ceiling first, since exceeding it fails the build.

## Known limitations

- **Real-time is polling**, not push (5s admin, 10s tracking). Genuine subscriptions would need Supabase Realtime or a WebSocket layer.
- The admin pages are still dynamic by design — an order board must not be cached — so they pay the cold-start cost when the shop first opens the dashboard. The retry and skeleton cover it.
- **Uploads go to `public/uploads/`** on local disk, which does not work on Vercel (read-only filesystem, non-persistent `/tmp`). The route now detects `process.env.VERCEL` and returns a `501 STORAGE_NOT_CONFIGURED` with a pointer, instead of appearing to succeed. Wire it to Vercel Blob / S3 / Cloudinary before relying on images in production.
- `npm audit` reports advisories in the **Prisma CLI dev chain** (`deepmerge-ts`, and `mysql2`, a driver this project never uses). `npm audit --omit=dev` — what actually ships — reports **0 vulnerabilities**.
- Delivery fee is a flat constant in `src/lib/order-types.ts`, not zone-based.
- `neon.ts` declares `auth: true` and a preview function (`hello.ts`). Neon Auth is provisioned but the admin panel still uses its own bcrypt + JWT cookie login; moving admin sign-in onto Neon Auth would be a separate change.
- AI Gateway is left commented out in `neon.ts` — it needs a paid Neon plan.
