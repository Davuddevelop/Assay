import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { supabaseConfig } from "@/lib/env";
import type { Database } from "@/lib/db/types";

/**
 * Service-role Supabase client. Bypasses Row-Level Security — use ONLY in
 * trusted server contexts (Inngest jobs, webhook handlers) that act on behalf
 * of the system, never in response to an untrusted user request without an
 * explicit ownership check. Never expose this key to the client.
 */
export function createAdminClient() {
  const { url, serviceKey } = supabaseConfig();
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }
  return createSupabaseClient<Database>(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
