"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { saveProfile } from "@/lib/data/profile";
import { isPlatform, isAudience } from "@/lib/onboarding";

/**
 * Save the two onboarding answers.
 *
 * Anything not in the allowed sets is stored as null rather than rejected with
 * an error. Two reasons: `platform` is the grouping key for anything we might
 * ever publish about how these builders ship, so a junk value in that column
 * is worse than a missing one; and bouncing someone back to a form with a
 * validation error, on the first screen after sign-in, over a field they can
 * only have reached by editing the DOM, is a bad trade. A null simply means
 * they get asked again.
 */
export async function saveOnboarding(formData: FormData) {
  const user = await requireUser();
  const platform = formData.get("platform");
  const audience = formData.get("audience");

  await saveProfile(user.id, {
    platform: isPlatform(platform) ? platform : null,
    audience: isAudience(audience) ? audience : null,
    skipped: formData.get("skip") === "1",
  });

  revalidatePath("/dashboard");
  revalidatePath("/scan");
}
