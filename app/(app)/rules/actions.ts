"use server";

import { revalidatePath } from "next/cache";

import { updateRepoRules } from "@/lib/data/queries";

export interface SaveRulesState {
  ok: boolean;
  message?: string;
}

/**
 * Save a repo's plain-language rules. Shaped for `useActionState` so the UI can
 * show a "Saved ✓" confirmation. Ownership is enforced under RLS.
 */
export async function saveRules(
  _prev: SaveRulesState,
  formData: FormData,
): Promise<SaveRulesState> {
  const repoId = String(formData.get("repoId") ?? "");
  const rules = String(formData.get("rules") ?? "");
  if (!repoId) return { ok: false, message: "Missing repository." };

  const ok = await updateRepoRules(repoId, rules);
  if (ok) {
    revalidatePath("/rules");
    revalidatePath(`/repos/${repoId}`);
  }
  return ok
    ? { ok: true }
    : { ok: false, message: "Couldn't save — please try again." };
}
