import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/log";
import { LEGAL_VERSION } from "@/lib/legal";

/**
 * Reading and writing the record of what a user agreed to.
 *
 * Service role for both, deliberately. The table has a read policy for the
 * owner and no write policy at all: evidence of consent that the consenting
 * party can insert or amend from their own browser is not evidence. Writes
 * therefore have to come from here.
 */

/**
 * Record that this user accepted the current documents.
 *
 * Never throws, and never blocks. This is called on the sign-in path, and a
 * consent row failing to write must not be the reason someone can't get into
 * their account — a missing row means we ask them again next time, which is
 * the safe direction to fail in. It also means the whole feature degrades to
 * "notice shown, nothing recorded" if migration 0016 hasn't been applied yet,
 * rather than locking everyone out of a deployed site.
 *
 * `upsert` with `ignoreDuplicates` rather than `insert`: the unique index on
 * (user_id, version) is what makes this idempotent, and hitting it is the
 * normal case — every sign-in after the first is a duplicate.
 */
export async function recordAcceptance(
  userId: string,
  context: "signup" | "reaccept",
): Promise<void> {
  try {
    const db = createAdminClient();
    const { error } = await db
      .from("legal_acceptances")
      .upsert(
        { user_id: userId, version: LEGAL_VERSION, context },
        { onConflict: "user_id,version", ignoreDuplicates: true },
      );
    if (error) {
      log.warn("legal acceptance write failed", { reason: error.message });
    }
  } catch (err) {
    log.warn("legal acceptance write failed", {
      reason: err instanceof Error ? err.message : "unknown",
    });
  }
}

/**
 * The most recent version this user has accepted, or null if we have no record
 * — which is also what a failed read returns.
 *
 * Failing to null means the update notice appears. That is the right way round:
 * showing the banner to someone who did accept is a small annoyance, while
 * hiding it from someone who didn't is the failure that matters.
 */
export async function acceptedVersion(userId: string): Promise<string | null> {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from("legal_acceptances")
      .select("version")
      .eq("user_id", userId)
      .order("accepted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      log.warn("legal acceptance read failed", { reason: error.message });
      return null;
    }
    return data?.version ?? null;
  } catch (err) {
    log.warn("legal acceptance read failed", {
      reason: err instanceof Error ? err.message : "unknown",
    });
    return null;
  }
}
