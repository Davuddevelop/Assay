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
  // Paddle's client-side token is designed to be public — it can only open a
  // checkout, never read or change anything. The secret API key stays server-
  // side in paddleConfig().
  paddleClientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "",
  paddleEnv: process.env.NEXT_PUBLIC_PADDLE_ENV ?? "",
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

/**
 * Resend (transactional email) config, or null when unset. Alerts are a paid
 * feature but the whole app must run without it — every send path no-ops when
 * this returns null. `from` must be a verified Resend sender/domain in prod.
 */
export function resendConfig(): { apiKey: string; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return { apiKey, from: process.env.EMAIL_FROM ?? "Assay <alerts@assaysecurity.com>" };
}

/** Absolute base URL for links inside emails (no trailing slash). */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "https://assaysecurity.com";
  return raw.replace(/\/+$/, "");
}

/**
 * Paddle config, or null when unset. Billing is optional: the app runs fully
 * without it (everyone is Free), the pricing page still renders, and checkout
 * simply reports it's unavailable. `priceIds` maps a paid plan id to its Paddle
 * Price (`pri_…`). `webhookSecret` verifies incoming webhook signatures.
 *
 * Paddle is the merchant of record, so it also collects and remits VAT — the
 * reason to use it over a plain gateway when selling software internationally
 * from a one-person company.
 *
 * `PADDLE_ENV=sandbox` points at Paddle's test stack; anything else is live.
 */
export function paddleConfig(): {
  apiKey: string;
  apiBase: string;
  webhookSecret: string;
  priceIds: { pro: string; team: string };
} | null {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) return null;
  const sandbox = process.env.PADDLE_ENV === "sandbox";
  return {
    apiKey,
    apiBase: sandbox ? "https://sandbox-api.paddle.com" : "https://api.paddle.com",
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET ?? "",
    priceIds: {
      pro: process.env.PADDLE_PRICE_PRO ?? "",
      team: process.env.PADDLE_PRICE_TEAM ?? "",
    },
  };
}
