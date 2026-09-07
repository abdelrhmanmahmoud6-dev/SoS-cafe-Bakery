/**
 * Normalises a Neon connection string before it reaches node-postgres.
 *
 * `neon deploy` rewrites DATABASE_URL in .env on every run and always writes
 * `sslmode=require`. Recent versions of `pg` treat 'prefer', 'require' and
 * 'verify-ca' as aliases for 'verify-full' and emit a deprecation warning
 * saying so. Rather than hand-editing .env after each deploy — which Neon
 * would simply undo — we make the intent explicit here, at the one point every
 * connection passes through.
 *
 * The resulting behaviour is identical; it is the warning, and the ambiguity,
 * that go away.
 */
export function normalizePgUrl(raw: string): string {
  try {
    const url = new URL(raw);
    const mode = url.searchParams.get("sslmode");
    if (mode === "require" || mode === "prefer" || mode === "verify-ca") {
      url.searchParams.set("sslmode", "verify-full");
    }
    return url.toString();
  } catch {
    // Not a parseable URL — hand it back untouched and let pg report the error.
    return raw;
  }
}
