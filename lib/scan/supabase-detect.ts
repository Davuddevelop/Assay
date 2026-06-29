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
