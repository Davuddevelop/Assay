import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getEnv } from "@/lib/env";
import type { Database } from "@/lib/db/types";

/**
 * Service-role Supabase client. Bypasses Row-Level Security — use ONLY in
 * trusted server contexts (Inngest jobs, webhook handlers) that act on behalf
 * of the system, never in response to an untrusted user request without an
 * explicit ownership check. Never expose this key to the client.
 */
export function createAdminClient() {
  const env = getEnv();
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
