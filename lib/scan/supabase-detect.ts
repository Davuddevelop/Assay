export interface SupabaseRef {
  url: string;
  anonKey: string;
}

// Supabase ships two key generations and live apps use both. The original is a
// JWT carrying a `role` claim; the current default is a prefixed opaque string
// (`sb_publishable_` for the browser, `sb_secret_` for the server). Matching
// only the JWT form silently skipped the whole RLS/storage branch on every
// modern project — and the scan then reported the database as locked down.
const JWT_KEY_RE = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g;
const PUBLISHABLE_KEY_RE = /sb_publishable_[A-Za-z0-9_-]{16,}/g;
const SECRET_KEY_RE = /sb_secret_[A-Za-z0-9_-]{16,}/g;

/**
 * Whether a Supabase key grants full, security-bypassing access — either the
 * legacy `service_role` JWT or the current `sb_secret_` form. Pure.
 */
export function isSupabaseServiceKey(key: string): boolean {
  if (key.startsWith("sb_secret_")) return true;
  return decodeJwtRole(key) === "service_role";
}

/**
 * Find a Supabase project URL + a usable client key in page/bundle text.
 *
 * When several keys are present we deliberately prefer a NON-service key, so
 * the probe exercises exactly the access an anonymous visitor has rather than
 * whichever key the minifier happened to emit first. A service key is still
 * returned when it's the only one found — on its own that's already critical.
 * Pure — tested.
 */
export function detectSupabase(text: string): SupabaseRef | null {
  const url = text.match(/https?:\/\/[a-z0-9-]+\.supabase\.co/i)?.[0];
  if (!url) return null;

  const candidates = [
    ...(text.match(PUBLISHABLE_KEY_RE) ?? []),
    ...(text.match(JWT_KEY_RE) ?? []),
    ...(text.match(SECRET_KEY_RE) ?? []),
  ];
  if (candidates.length === 0) return null;

  const usable = candidates.find((k) => !isSupabaseServiceKey(k));
  return { url, anonKey: usable ?? candidates[0] };
}

/**
 * Table names exposed by a PostgREST OpenAPI root (`/rest/v1/`). The spec lists
 * every table as a path regardless of RLS, so this is how we enumerate what to
 * probe. We drop the root path and `rpc/*` (stored procedures, not tables). Pure.
 */
export function tablesFromOpenApi(body: unknown): string[] {
  if (!body || typeof body !== "object" || !("paths" in body)) return [];
  const paths = (body as { paths: Record<string, unknown> }).paths;
  if (!paths || typeof paths !== "object") return [];
  return Object.keys(paths)
    .map((p) => p.replace(/^\//, ""))
    .filter((t) => t.length > 0 && !t.startsWith("rpc/"));
}

/**
 * Whether an unauthenticated table read came back with data — the signal that
 * RLS is off or misconfigured. We look ONLY at the shape (200 + non-empty
 * array); the row contents are never inspected or stored. Pure.
 */
export function isExposedResponse(status: number, body: unknown): boolean {
  return status === 200 && Array.isArray(body) && body.length > 0;
}

/**
 * Whether an unauthenticated storage bucket list came back with objects — the
 * signal that the bucket's RLS policy (or its `public` flag) lets anyone
 * browse it. Pure.
 */
export function isExposedBucketListing(status: number, count: number): boolean {
  return status === 200 && count > 0;
}

/**
 * The column NAMES on the first returned row — the schema of what's exposed,
 * never the values. Turns "RLS misconfigured" into "your email, phone, and
 * stripe_customer_id columns are public", which is what a founder actually
 * needs to feel. Pure.
 */
export function columnsFromRow(body: unknown): string[] {
  if (
    Array.isArray(body) &&
    body.length > 0 &&
    body[0] &&
    typeof body[0] === "object"
  ) {
    return Object.keys(body[0] as Record<string, unknown>);
  }
  return [];
}

/** Columns that read as sensitive to a non-technical owner, for emphasis. Pure. */
export function sensitiveColumns(cols: string[]): string[] {
  return cols.filter((c) =>
    /email|phone|name|address|pass|token|secret|stripe|card|ssn|dob|birth|api|key|customer|billing|payment|account/i.test(
      c,
    ),
  );
}

/** Decode a JWT's `role` claim without verifying (we only read it). Pure. */
export function decodeJwtRole(jwt: string): string | null {
  const parts = jwt.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
    ) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
}
