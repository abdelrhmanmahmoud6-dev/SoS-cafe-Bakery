import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma 7 keeps the connection URL here rather than in schema.prisma.
 *
 * Migrations run over the unpooled endpoint (DIRECT_URL, or the
 * DATABASE_URL_UNPOOLED that `neon deploy` writes) because DDL through a
 * connection pooler can fail or hang. The application itself uses the pooled
 * DATABASE_URL — see src/lib/db.ts.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL_UNPOOLED ??
      env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
