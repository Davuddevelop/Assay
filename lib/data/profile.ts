import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/log";
import { isPlatform, isAudience, type Profile } from "@/lib/onboarding";

/**
 * Reading and writing the two onboarding answers.
 *
 * Both directions fail soft, and in the direction that costs least. A read
 * that fails returns an empty profile, so the questions get asked again —
 * mildly annoying, and much better than a dashboard that can't render because
 * a personalization query fell over. A write that fails is logged and
 * swallowed, because losing "which builder do you use" must never be the
 * reason someone can't get past their first screen.
 *
 * That also means the whole feature degrades to "questions shown, nothing
 * saved" until migration 0017 is applied, rather than breaking the dashboard
 * for everyone the moment this deploys.
 */
export async function getProfile(userId: string): Promise<Profile> {
  const empty: Profile = { platform: null, audience: null, skipped: false };
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from("user_profile")
      .select("platform, audience, skipped")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      log.warn("profile read failed", { reason: error.message });
      return empty;
    }
    // Validated on the way out as well as in. The column is plain text, and a
    // value written by hand in the SQL editor shouldn't be able to produce a
    // placeholder or a dashboard branch that doesn't exist.
    return {
      platform: isPlatform(data?.platform) ? data.platform : null,
      audience: isAudience(data?.audience) ? data.audience : null,
      skipped: data?.skipped === true,
    };
  } catch (err) {
    log.warn("profile read failed", {
      reason: err instanceof Error ? err.message : "unknown",
    });
    return empty;
  }
}

export async function saveProfile(userId: string, profile: Profile): Promise<void> {
  try {
    const db = createAdminClient();
    const { error } = await db.from("user_profile").upsert(
      {
        user_id: userId,
        platform: profile.platform,
        audience: profile.audience,
        skipped: profile.skipped,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) log.warn("profile write failed", { reason: error.message });
  } catch (err) {
    log.warn("profile write failed", {
      reason: err instanceof Error ? err.message : "unknown",
    });
  }
}
