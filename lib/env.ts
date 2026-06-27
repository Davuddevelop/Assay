import { z } from "zod";

/**
 * Server-side environment validation.
 *
 * Validation is lazy (run on first access, then cached) so that `next build`
 * — which imports modules without a populated runtime env — never fails to
 * compile. The schema is enforced the first time a server handler actually
 * needs a secret, surfacing a clear error instead of an undefined value.
 *
 * Never import this from a client component. Secrets here must never reach the
 * browser bundle; only `NEXT_PUBLIC_*` values are safe for the client.
 */
const serverSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Token encryption — AES-256-GCM key, 32 bytes encoded as 64 hex chars.
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, "ENCRYPTION_KEY must be 64 hex chars (32 bytes)"),

  // GitHub App
  GITHUB_APP_ID: z.string().min(1),
  GITHUB_APP_PRIVATE_KEY: z.string().min(1),
  GITHUB_WEBHOOK_SECRET: z.string().min(1),
  GITHUB_APP_CLIENT_ID: z.string().min(1).optional(),
  GITHUB_APP_CLIENT_SECRET: z.string().min(1).optional(),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().min(1),

  // Voyage embeddings (optional — repo-aware review degrades gracefully without it)
  VOYAGE_API_KEY: z.string().min(1).optional(),

  // E2B sandbox for running untrusted repo tests (optional until Phase 6 is live)
  E2B_API_KEY: z.string().min(1).optional(),

  // Inngest (optional in local dev — the dev server runs without keys)
  INNGEST_EVENT_KEY: z.string().min(1).optional(),
  INNGEST_SIGNING_KEY: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

/** Validate and return the server environment. Cached after first call. */
export function getEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    // Report which keys are wrong without ever printing their values.
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid server environment. Check your .env (see .env.example):\n${issues}`,
    );
  }

  cached = parsed.data;
  return cached;
}

/**
 * Public environment, safe to read on the client. Only `NEXT_PUBLIC_*` values.
 * Referenced statically so Next can inline them into the client bundle.
 */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  /** GitHub App slug, for the "install on a repo" link. */
  githubAppSlug: process.env.NEXT_PUBLIC_GITHUB_APP_SLUG ?? "",
} as const;

/**
 * Supabase configuration read directly from env, independent of the full
 * `getEnv()` validation. This lets Supabase (auth, data) work as soon as its
 * own keys are set, before GitHub/Anthropic/etc. are configured.
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

/** URL to install/configure the GitHub App on the user's repos. */
export function githubAppInstallUrl(): string {
  return publicEnv.githubAppSlug
    ? `https://github.com/apps/${publicEnv.githubAppSlug}/installations/new`
    : "/docs";
}
