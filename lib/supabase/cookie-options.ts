/**
 * Auth cookie hardening. `@supabase/ssr` defaults to `httpOnly: false` (it
 * assumes a browser-side Supabase client may need to read the session cookie
 * directly) — but this app has no browser-side Supabase client anywhere; every
 * read/write goes through `createServerClient` in Server Components, Route
 * Handlers, and Server Actions. Nothing client-side ever needs this cookie, so
 * leaving it script-readable only widens the blast radius of any future XSS
 * (a malicious script could exfiltrate the session via `document.cookie`).
 * `secure` also isn't set by the library default; force it outside local dev.
 */
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};
