import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { supabaseConfig } from "@/lib/env";
import { AUTH_COOKIE_OPTIONS } from "@/lib/supabase/cookie-options";
import type { Database } from "@/lib/db/types";

/**
 * Server Supabase client bound to the request's cookies. Uses the anon key, so
 * every query runs under Row-Level Security as the signed-in user. Use this in
 * Server Components, Route Handlers, and Server Actions for user-facing reads.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = supabaseConfig();

  return createServerClient<Database>(url, anonKey, {
      cookieOptions: AUTH_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // `setAll` was called from a Server Component, where cookies are
            // read-only. Safe to ignore when middleware refreshes the session.
          }
        },
      },
    },
  );
}
