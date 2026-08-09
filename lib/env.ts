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
 * Lemon Squeezy config, or null when unset. Billing is optional: the app runs
 * fully without it (everyone is Free), the pricing page still renders, and
 * checkout simply reports it's unavailable. `variantIds` maps a paid plan id
 * to its Lemon Squeezy Variant id. `webhookSecret` verifies incoming webhook
 * signatures.
 *
 * Lemon Squeezy is the merchant of record, so it also collects and remits VAT
 * and sales tax — the reason to use it over a plain gateway when selling
 * software internationally from a one-person company, same reasoning that
 * ruled out a plain gateway the first time (see 0012_billing_provider.sql).
 *
 * Unlike Paddle, Lemon Squeezy has one API host and one set of keys for both
 * modes — test vs. live is a per-request `test_mode` flag, not a separate
 * credential, so `LEMONSQUEEZY_TEST_MODE` is this app's own switch rather than
 * something Lemon Squeezy issues.
 */

/**
 * Test-mode checkouts must never be created from the production deployment.
 *
 * There is no legitimate reason for the production deployment to open a test
 * checkout, so this refuses rather than warns. Previews and local development
 * are unaffected, which is where testing belongs. Pure, and exported so the
 * rule is pinned by a test rather than living only in a reviewer's memory.
 */
export function lemonSqueezyTestModeOnProduction(
  vercelEnv: string | undefined,
  testMode: string | undefined,
): boolean {
  return vercelEnv === "production" && testMode === "true";
}

/**
 * The other direction of the same mistake: a webhook that arrives claiming to
 * be a test event (the store's own "Test mode" toggle in the Lemon Squeezy
 * dashboard, left on by accident — nothing this app controls) must not be
 * allowed to grant a real paid plan just because the signature is genuinely
 * ours.
 */
export function lemonSqueezyTestEventOnProduction(
  vercelEnv: string | undefined,
  eventTestMode: boolean,
): boolean {
  return vercelEnv === "production" && eventTestMode === true;
}

export function lemonSqueezyConfig(): {
  apiKey: string;
  storeId: string;
  webhookSecret: string;
  testMode: boolean;
  variantIds: { pro: string; team: string };
} | null {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!apiKey || !storeId) return null;
  // Billing reports itself unconfigured rather than half-configured: the
  // upgrade buttons disappear and checkout stops opening, which is the
  // correct behaviour for a deployment holding the wrong credentials.
  if (
    lemonSqueezyTestModeOnProduction(process.env.VERCEL_ENV, process.env.LEMONSQUEEZY_TEST_MODE)
  ) {
    return null;
  }
  return {
    apiKey,
    storeId,
    webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? "",
    testMode: process.env.LEMONSQUEEZY_TEST_MODE === "true",
    variantIds: {
      pro: process.env.LEMONSQUEEZY_VARIANT_PRO ?? "",
      team: process.env.LEMONSQUEEZY_VARIANT_TEAM ?? "",
    },
  };
}
