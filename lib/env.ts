/**
 * Environment access, kept deliberately small.
 *
 * Never import server secrets from a client component. Only `NEXT_PUBLIC_*`
 * values are safe for the browser bundle.
 */

/**
 * Public environment, safe to read on the client. Only `NEXT_PUBLIC_*` values.
 * Referenced statically so Next can inline them into the client bundle.
 */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
} as const;

/**
 * Supabase configuration read directly from env. This lets Supabase (auth,
 * data) work as soon as its own keys are set, before Anthropic/Inngest are
 * configured.
 */
export function supabaseConfig(): { url: string; anonKey: string; serviceKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return { url, anonKey, serviceKey };
}

/** The Anthropic API key, read directly so callers don't need the full env. */
export function anthropicKey(): string | null {
  return process.env.ANTHROPIC_API_KEY ?? null;
}
