"use server";

import { revalidatePath } from "next/cache";

import { updateRepoRules } from "@/lib/data/queries";

/** Save a repo's plain-language rules. Ownership is enforced under RLS. */
export async function saveRules(formData: FormData) {
  const repoId = String(formData.get("repoId") ?? "");
  const rules = String(formData.get("rules") ?? "");
  if (!repoId) return;

  await updateRepoRules(repoId, rules);
  revalidatePath("/rules");
  revalidatePath(`/repos/${repoId}`);
}
