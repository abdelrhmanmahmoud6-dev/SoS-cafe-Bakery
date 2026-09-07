import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { normalizePgUrl } from "./pg-url";

/**
 * Prisma 7 connects through a driver adapter. This uses the node-postgres
 * adapter against Neon; the pooled Neon connection string works unchanged on
 * Vercel's serverless runtime.
 */
function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and fill it in."
    );
  }
  const adapter = new PrismaPg({ connectionString: normalizePgUrl(url) });
  return new PrismaClient({ adapter });
}

// Next.js hot-reloads modules in dev; cache the client on globalThis so we
// don't exhaust connections by creating one per reload.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
