import { createBrowserClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/lib/db/types";

/**
 * Browser Supabase client — uses the anon key and is bound by Row-Level
 * Security. Safe to call from client components. Never holds service-role
 * credentials.
 */
export function createClient() {
  return createBrowserClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
  );
}
