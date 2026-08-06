"use server";

import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { completeSignIn } from "@/lib/auth-complete";
import { safeNext } from "@/lib/safe-redirect";
import { siteUrl } from "@/lib/env";
import { consumeRateLimit } from "@/lib/rate-limit-global";
import {
  looksLikeEmail,
  normalizeEmail,
  looksLikeOtpCode,
  normalizeOtpCode,
  PENDING_EMAIL_COOKIE,
  PENDING_EMAIL_MAX_AGE,
} from "@/lib/auth-email";
import { PREFILL_COOKIE } from "@/lib/scan/prefill";
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

  // Carry the address to the code form so they don't retype what they just
  // typed. Set only after a successful send, so it never appears for an
  // address we didn't actually mail.
  (await cookies()).set(PENDING_EMAIL_COOKIE, email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PENDING_EMAIL_MAX_AGE,
  });

  // Always the same screen, whether or not that address has an account.
  redirect(`/login?sent=1${qs}`);
}

/**
 * Verify the numeric code from the same email `signInWithEmail` sent, as a
 * fallback to the clickable link.
 *
 * The link is a single-use token, and some corporate mail gateways and
 * security scanners (Microsoft 365 Safe Links is the common one) pre-fetch
 * every link in an email server-side to scan it before the recipient ever
 * sees the message. That pre-fetch burns the one-time token, so by the time a
 * real person clicks it the link is already dead — "expired or already used"
 * for someone who never used it. A typed code has no URL for that kind of
 * scanner to visit, so it survives exactly the case the link doesn't.
 *
 * Rate limited more tightly than sending: this endpoint is a guess against a
 * live numeric secret, so it's the one place in this file defending against
 * brute force rather than mail abuse. Supabase enforces its own limits on
 * verification attempts against a token; this is defense in depth, the same
 * posture rate-limit-global.ts documents for the DB-backed limiter.
 */
export async function verifyEmailCode(formData: FormData) {
  const next = safeNext(
    typeof formData?.get("next") === "string" ? String(formData.get("next")) : null,
    "",
  );
  const qs = next ? `&next=${encodeURIComponent(next)}` : "";

  const rawEmail = formData.get("email");
  const rawCode = formData.get("code");
  if (!looksLikeEmail(rawEmail) || !looksLikeOtpCode(rawCode)) {
    redirect(`/login?error=code${qs}`);
  }
  const email = normalizeEmail(rawEmail);
  const code = normalizeOtpCode(rawCode);

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ||
    (await headers()).get("x-real-ip") ||
    "unknown";
  const allowed = await consumeRateLimit(`verify-code:${ip}`, 10, 600);
  if (!allowed) redirect(`/login?error=throttled${qs}`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });

  if (error || !data.user) {
    // Same non-committal failure as the link: never confirm whether the
    // address has an account, only that this attempt didn't work.
    log.warn("code verification failed", { reason: error?.message ?? "no user" });
    redirect(`/login?error=code${qs}`);
  }

  const jar = await cookies();
  const carrying = jar.has(PREFILL_COOKIE);
  jar.delete(PENDING_EMAIL_COOKIE);
  await completeSignIn(data.user, carrying);
  redirect(next || (carrying ? "/scan" : "/dashboard"));
}

/** Sign out and return to the home page. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
