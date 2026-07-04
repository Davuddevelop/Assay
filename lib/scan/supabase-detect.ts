export interface SupabaseRef {
  url: string;
  anonKey: string;
}

/** Find a Supabase project URL + a JWT key in client text. Pure — tested. */
export function detectSupabase(text: string): SupabaseRef | null {
  const url = text.match(/https?:\/\/[a-z0-9-]+\.supabase\.co/i)?.[0];
  const anonKey = text.match(
    /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/,
  )?.[0];
  if (!url || !anonKey) return null;
  return { url, anonKey };
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
