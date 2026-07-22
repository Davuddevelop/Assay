import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";
import { AUTH_COOKIE_OPTIONS } from "@/lib/supabase/cookie-options";

/**
 * Refreshes the Supabase auth session on each request so Server Components see
 * a valid user and cookies stay fresh. No-ops if Supabase env isn't configured
 * (e.g. before keys are added) so the app still serves.
 *
 * Tried and reverted: a per-request nonce'd CSP (`script-src 'nonce-...'
 * 'strict-dynamic'`) per Next's documented pattern. Verified empirically with
 * Chromium — Next 16 + Turbopack does not propagate the nonce to its own
 * chunk `<script>` tags or inline hydration scripts in this setup, so every
 * script on the page gets blocked and the app never hydrates. The static CSP
 * in next.config.ts (no script-src/style-src restriction) stays until that's
 * fixed upstream or a working nonce path is found — a real gap, not resolved
 * here, and it should stay something later work checks for again rather than
 * silently re-attempting the same broken approach.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookieOptions: AUTH_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Touch the session so @supabase/ssr can rotate the cookie if needed.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Run on everything except static assets and image optimization.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
