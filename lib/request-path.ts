/**
 * Small contracts shared between middleware (edge runtime) and app code. Kept
 * in their own module so neither side pulls the other's bundle along.
 */

/**
 * The request header middleware uses to tell a Server Component which path is
 * being rendered — Next exposes no other way to ask.
 */
export const PATH_HEADER = "x-assay-path";

/**
 * A cookie saying only "this browser has a session". Not a credential: it
 * carries no token, grants nothing, and forging it just earns you a button
 * that bounces you to the login page.
 *
 * It exists because the marketing pages are statically prerendered — built
 * once, served to everyone — so they cannot know who is asking, while the real
 * auth cookie is deliberately `httpOnly` and must stay unreadable to scripts.
 * This flag lets the nav show a signed-in person the way back into the app
 * without weakening that, and without shipping a Supabase client to pages that
 * otherwise need no JavaScript.
 */
export const SESSION_HINT_COOKIE = "assay_session";
