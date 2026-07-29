"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { createApiKey, listApiKeys, revokeApiKey } from "@/lib/api-keys";

/** A key can only be shown once, so the create action has to return it. */
export interface CreateKeyState {
  key?: string;
  error?: string;
}

/** How many live keys one account may hold. Enough for a laptop, a desktop,
 *  and CI; low enough that a leak has a small blast radius. */
const MAX_KEYS = 10;

export async function createKeyAction(
  _prev: CreateKeyState,
  formData: FormData,
): Promise<CreateKeyState> {
  const user = await requireUser();
  const label = String(formData.get("label") ?? "").trim();

  const existing = await listApiKeys(user.id);
  if (existing.length >= MAX_KEYS) {
    return { error: `You already have ${MAX_KEYS} keys. Revoke one to create another.` };
  }

  const created = await createApiKey(user.id, label);
  if (!created) return { error: "Couldn't create that key. Try again in a moment." };

  revalidatePath("/settings/keys");
  return { key: created.key };
}

export async function revokeKeyAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (id) await revokeApiKey(user.id, id);
  revalidatePath("/settings/keys");
}
