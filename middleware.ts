import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";
import { AUTH_COOKIE_OPTIONS } from "@/lib/supabase/cookie-options";
import { PATH_HEADER, SESSION_HINT_COOKIE } from "@/lib/request-path";

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
  // Carry the requested path forward so `requireUser` can send someone back to
  // where they were trying to go after they sign in, instead of dropping them
  // on a default page and losing their intent.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PATH_HEADER, request.nextUrl.pathname);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

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
          response = NextResponse.next({ request: { headers: requestHeaders } });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Touch the session so @supabase/ssr can rotate the cookie if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Leave a non-secret flag the statically-prerendered marketing nav can read.
  // The real auth cookie is httpOnly and stays that way; this says only that a
  // session exists, which grants nothing on its own.
  if (user) {
    response.cookies.set(SESSION_HINT_COOKIE, "1", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  } else if (request.cookies.has(SESSION_HINT_COOKIE)) {
    response.cookies.delete(SESSION_HINT_COOKIE);
  }

  return response;
}

export const config = {
  // Run on everything except static assets and image optimization.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
