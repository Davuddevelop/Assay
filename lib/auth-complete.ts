import "server-only";
import type { User } from "@supabase/supabase-js";

import { claimInstallations } from "@/lib/auth";
import { recordFunnelEvent } from "@/lib/data/funnel";

/**
 * Everything that must happen the moment a session is established, regardless
 * of which door they came through — GitHub OAuth, a clicked magic link, or a
 * typed sign-in code. All three call this so the funnel numbers and
 * installation-claiming can't quietly diverge by sign-in method.
 *
 * Separate file from lib/auth.ts on purpose: that module stays free of
 * `server-only` so its pure helpers (githubIdFromUser, toSessionUser) can be
 * unit-tested directly, and recordFunnelEvent pulls `server-only` in — the
 * same pure/impure split used elsewhere in this repo (lib/auth-email.ts vs
 * app/auth/actions.ts, lib/scan/redact.ts vs its callers).
 *
 * `carrying` means they arrived from an anonymous report rather than the
 * front door — the only attribution available without tracking anyone across
 * the site — and decides which funnel step closes.
 */
export async function completeSignIn(
  user: User,
  carrying: boolean,
): Promise<void> {
  await claimInstallations(user);
  recordFunnelEvent("signup");
  if (carrying) recordFunnelEvent("signup_from_scan");
}
