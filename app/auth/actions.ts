"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-redirect";
import { siteUrl } from "@/lib/env";
import { consumeRateLimit } from "@/lib/rate-limit-global";
import { looksLikeEmail, normalizeEmail } from "@/lib/auth-email";
import { log } from "@/lib/log";

/**
 * Begin GitHub OAuth: redirect the user to GitHub via Supabase.
 *
 * `next` carries where they were headed before they hit the login wall, so
 * the callback can return them there. It is validated by `safeNext` before it
 * is ever put in a URL — this value reaches Supabase and comes back, so it is
 * attacker-reachable and must not be able to name another origin.
 *
 * The return address is built from `siteUrl()` rather than the request's own
 * headers. A preview alias or a `www.` host would produce a `redirectTo` that
 * isn't in Supabase's allowlist, and Supabase silently substitutes the
 * project's Site URL — dropping the user on the landing page with an
 * unexchanged code and no session.
 */
export async function signInWithGitHub(formData?: FormData) {
  const supabase = await createClient();
  const next = safeNext(
    typeof formData?.get("next") === "string" ? String(formData.get("next")) : null,
    "",
  );
  const callback = `${siteUrl()}/auth/callback${
    next ? `?next=${encodeURIComponent(next)}` : ""
  }`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: callback,
      // Sign-in only — no repository access is ever requested.
      scopes: "read:user user:email",
    },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth");
  }
  redirect(data.url);
}

/**
 * Send a sign-in link to an email address.
 *
 * GitHub was the only door, in a product whose whole premise is that you don't
 * need to be a developer. A person who built an app on Lovable without ever
 * touching git has no GitHub account and no reason to make one — so the wall
 * was in the shape of an assumption the product had already abandoned.
 *
 * This endpoint is unauthenticated and causes mail to be sent, so it is rate
 * limited per IP before anything else happens. The address is validated for
 * shape only: whether it exists is Supabase's problem, but a newline in it
 * would be ours.
 */
export async function signInWithEmail(formData: FormData) {
  const next = safeNext(
    typeof formData?.get("next") === "string" ? String(formData.get("next")) : null,
    "",
  );
  const qs = next ? `&next=${encodeURIComponent(next)}` : "";

  const raw = formData.get("email");
  if (!looksLikeEmail(raw)) redirect(`/login?error=email${qs}`);
  const email = normalizeEmail(raw);

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ||
    (await headers()).get("x-real-ip") ||
    "unknown";
  // Bound both the burst and the day: this is a free way to make us send mail
  // to an address the sender doesn't control, which is someone else's inbox.
  const burst = await consumeRateLimit(`login-email:${ip}`, 3, 300);
  const daily = burst && (await consumeRateLimit(`login-email-day:${ip}`, 20, 86_400));
  if (!burst || !daily) redirect(`/login?error=throttled${qs}`);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback${
        next ? `?next=${encodeURIComponent(next)}` : ""
      }`,
    },
  });

  if (error) {
    // Never echo the provider's message: it distinguishes "this address has an
    // account" from "it doesn't", which is an enumeration oracle.
    log.warn("magic link send failed", { reason: error.message });
    redirect(`/login?error=email${qs}`);
  }

  // Always the same screen, whether or not that address has an account.
  redirect(`/login?sent=1${qs}`);
}

/** Sign out and return to the home page. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
