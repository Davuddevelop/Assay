import "server-only";
import type { User } from "@supabase/supabase-js";

import { claimInstallations } from "@/lib/auth";
import { recordFunnelEvent } from "@/lib/data/funnel";
import { recordAcceptance } from "@/lib/data/legal";

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
  // Every door shows the same notice next to its button (LegalNotice on the
  // login page), so establishing a session is the moment the agreement is
  // made — and this is where it becomes a record rather than a claim. It
  // never throws and never blocks: a consent row that fails to write must not
  // be the reason someone can't reach their account, and the cost of the
  // failure is that we ask them again, which is the safe direction.
  await recordAcceptance(user.id, "signup");
  recordFunnelEvent("signup");
  if (carrying) recordFunnelEvent("signup_from_scan");
}
