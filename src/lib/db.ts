import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import type { PoolConfig } from "pg";
import { normalizePgUrl } from "./pg-url";

/* ============================================================================
   PRISMA CLIENT — tuned for Neon + Vercel serverless

   Neon scales the compute endpoint to zero when idle. The first request after
   that waits for the endpoint to resume, which is why a cold Vercel function
   could previously hang and then surface as "An error occurred".

   Three things address it here: a pool sized for serverless, timeouts that
   fail predictably instead of hanging, and a retry that distinguishes "the
   query never reached Postgres" from "the query may already have run".
   ========================================================================== */

/** Total attempts (1 initial + 2 retries). */
const MAX_ATTEMPTS = 3;

/** Backoff before each retry, in ms. Deliberately short: the connect timeout
 *  already dominates the budget, and serverless functions have a hard ceiling. */
const BACKOFF_MS = [200, 600];

function poolConfig(connectionString: string): PoolConfig {
  return {
    connectionString,

    // A serverless invocation handles one request at a time, so a large pool
    // just holds Neon connection slots open for nothing. 3 covers the
    // Promise.all fan-out on the storefront (menu + add-ons) with room spare.
    max: 3,

    // Neon's scale-to-zero resume is usually well under a second but can take
    // a few. The pg default of 0 means "wait forever" — that is what turned a
    // cold start into a hung request. Fail predictably instead, and stay inside
    // a serverless function's execution ceiling even after a retry.
    connectionTimeoutMillis: 6_000,

    // A frozen lambda holding an idle socket occupies a Neon slot, so hand it
    // back promptly.
    idleTimeoutMillis: 10_000,
    allowExitOnIdle: true,

    // Recycle sockets so a long-lived warm instance never reuses a connection
    // Neon has already reaped on its side.
    maxLifetimeSeconds: 300,
    keepAlive: true,

    // Cap a runaway query rather than burning the whole function budget on it.
    statement_timeout: 8_000,
    query_timeout: 8_000,
  };
}

/* -------------------------------------------------------------------------- */
/*  Retry classification                                                      */
/* -------------------------------------------------------------------------- */

/** Failures raised while establishing a connection. The statement provably
 *  never reached Postgres, so retrying is safe for reads AND writes. */
const CONNECT_PHASE = [
  "ECONNREFUSED",
  "ENOTFOUND",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "timeout exceeded when trying to connect",
  "Connection terminated due to connection timeout",
  "Timed out fetching a new connection from the connection pool",
  "P1001", // Prisma: can't reach database server
  "P1002", // Prisma: database server timed out
];

/** Failures that can surface *after* a statement was sent. Safe to retry for
 *  reads; NOT safe for writes, because the write may already have committed —
 *  re-issuing it could place a second order. */
const IN_FLIGHT = [
  "ECONNRESET",
  "EPIPE",
  "Connection terminated unexpectedly",
  "terminating connection due to administrator command",
  "server closed the connection unexpectedly",
  "P1017", // Prisma: server has closed the connection
];

const READ_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

function describe(error: unknown): string {
  if (!error) return "";
  const e = error as { message?: string; code?: string };
  return `${e.code ?? ""} ${e.message ?? String(error)}`;
}

function matches(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

/**
 * Decides whether a failed operation may be retried.
 *
 * The asymmetry is deliberate. A connect-phase failure means Postgres never saw
 * the statement, so any operation can be retried. An in-flight failure is only
 * retried for reads, because re-running a `create` that already committed would
 * duplicate it — a customer would be charged for two orders.
 *
 * Exported so the behaviour can be tested without opening a connection.
 */
export function isRetryable(error: unknown, operation: string): boolean {
  const text = describe(error);
  if (matches(text, CONNECT_PHASE)) return true;
  if (matches(text, IN_FLIGHT)) return READ_OPERATIONS.has(operation);
  return false;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* -------------------------------------------------------------------------- */
/*  Client                                                                    */
/* -------------------------------------------------------------------------- */

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and fill it in."
    );
  }

  const adapter = new PrismaPg(poolConfig(normalizePgUrl(url)), {
    // Without these, an error on an idle pooled client is emitted as an
    // unhandled 'error' event, which takes the whole process down.
    onPoolError: (err) => console.error("[prisma] pool error:", err.message),
    onConnectionError: (err) =>
      console.error("[prisma] connection error:", err.message),
  });

  return new PrismaClient({ adapter }).$extends({
    name: "neon-cold-start-retry",
    query: {
      async $allOperations({ operation, args, query }) {
        let lastError: unknown;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          try {
            return await query(args);
          } catch (error) {
            lastError = error;

            const canRetry =
              attempt < MAX_ATTEMPTS - 1 && isRetryable(error, operation);
            if (!canRetry) throw error;

            const delay = BACKOFF_MS[attempt] ?? 600;
            console.warn(
              `[prisma] ${operation} failed (${describe(lastError).trim().slice(0, 90)}) — ` +
                `retrying in ${delay}ms (attempt ${attempt + 2}/${MAX_ATTEMPTS})`
            );
            await sleep(delay);
          }
        }

        throw lastError;
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof createClient>;

// Next.js hot-reloads modules in dev, and a warm serverless instance re-imports
// this file; cache the client so a new pool isn't opened each time.
const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma: ExtendedPrismaClient =
  globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
