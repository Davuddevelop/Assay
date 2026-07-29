import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { User } from "@supabase/supabase-js";

import { safeNext } from "@/lib/safe-redirect";
import { PATH_HEADER } from "@/lib/request-path";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/log";

/**
 * Auth helpers built on Supabase Auth (GitHub OAuth). The signed-in user is a
 * Supabase auth user; their GitHub numeric id links them to the GitHub App
 * installations they own.
 */

/** The current signed-in user, or null. Safe to call in Server Components. */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

/**
 * Require a signed-in user, or send them to sign in and bring them back.
 *
 * The path they were trying to reach travels as `?next=`, so someone who
 * clicked "Upgrade to Pro" lands on billing after authenticating rather than
 * on a default page with no memory of what they wanted. Middleware supplies
 * the path, since Next gives a Server Component no way to ask.
 */
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) {
    const path = (await headers()).get(PATH_HEADER);
    const next = safeNext(path, "");
    redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  }
  return user;
}

/**
 * The user's GitHub numeric id, from the OAuth identity. Pure — exported for
 * tests. Supabase stores it in user_metadata.provider_id and/or the GitHub
 * identity's `id`.
 */
export function githubIdFromUser(user: Pick<User, "user_metadata" | "identities">): number | null {
  const fromMeta = user.user_metadata?.provider_id ?? user.user_metadata?.sub;
  const n = Number(fromMeta);
  if (Number.isFinite(n) && n > 0) return n;

  const gh = user.identities?.find((i) => i.provider === "github");
  const fromIdentity = Number(gh?.id);
  return Number.isFinite(fromIdentity) && fromIdentity > 0 ? fromIdentity : null;
}

/** A small view of the user for UI chrome. */
export interface SessionUser {
  id: string;
  handle: string;
  name: string;
  initial: string;
  avatarUrl: string | null;
}

export function toSessionUser(user: User): SessionUser {
  const meta = user.user_metadata ?? {};
  const handle: string =
    meta.user_name ?? meta.preferred_username ?? meta.name ?? user.email ?? "you";
  const name: string = meta.full_name ?? meta.name ?? handle;
  return {
    id: user.id,
    handle,
    name,
    initial: (name || handle).charAt(0).toUpperCase(),
    avatarUrl: meta.avatar_url ?? null,
  };
}

/**
 * Claim any GitHub App installations that belong to this user's GitHub account
 * but aren't linked yet (sets installations.owner_user_id). Runs with the
 * service role; idempotent. Best-effort — never throws into the request.
 */
export async function claimInstallations(user: User): Promise<void> {
  const githubId = githubIdFromUser(user);
  if (!githubId) return;
  try {
    const db = createAdminClient();
    await db
      .from("installations")
      .update({ owner_user_id: user.id })
      .eq("account_id", githubId)
      .is("owner_user_id", null);
  } catch {
    log.warn("claimInstallations failed", { userId: user.id });
  }
}
