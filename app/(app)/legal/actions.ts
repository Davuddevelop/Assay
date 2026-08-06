"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { recordAcceptance } from "@/lib/data/legal";

/**
 * Accept the current documents from the in-app notice.
 *
 * Takes no arguments on purpose. The version accepted is always
 * LEGAL_VERSION, read server-side — a version passed up from the form would
 * let anyone record acceptance of any string they liked, which would make the
 * record worthless in exactly the situation it exists for.
 */
export async function acceptCurrentTerms() {
  const user = await requireUser();
  await recordAcceptance(user.id, "reaccept");
  // The notice is rendered in the app layout, so every page under it has to
  // re-render for the banner to disappear.
  revalidatePath("/", "layout");
}
