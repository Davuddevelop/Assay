"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-redirect";
import { siteUrl } from "@/lib/env";

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

/** Sign out and return to the home page. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
