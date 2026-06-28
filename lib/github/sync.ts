import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt } from "@/lib/crypto";
import {
  createInstallationToken,
  getInstallationAccount,
  listInstallationRepos,
} from "@/lib/github/app";

export interface SyncedRepo {
  id: string;
  full_name: string;
  default_branch: string;
}

export interface SyncResult {
  installId: string;
  repos: SyncedRepo[];
}

/**
 * Reconcile a GitHub App installation into the database: upsert the installation
 * (with a freshly minted, encrypted token) and its repositories. Shared by the
 * post-install redirect (synchronous, so repos appear immediately) and the
 * Inngest webhook handler (async). Pass `ownerUserId` to claim the installation
 * for the signed-in user. Idempotent.
 */
export async function syncInstallation(
  githubInstallId: number,
  ownerUserId?: string,
): Promise<SyncResult> {
  const account = await getInstallationAccount(githubInstallId);
  const { token, expiresAt } = await createInstallationToken(githubInstallId);

  const db = createAdminClient();
  const { data: install, error } = await db
    .from("installations")
    .upsert(
      {
        github_install_id: githubInstallId,
        account_login: account.accountLogin,
        account_id: account.accountId,
        encrypted_token: encrypt(token),
        token_expires_at: expiresAt,
        // Only set the owner when we have one (don't clobber it from webhooks).
        ...(ownerUserId ? { owner_user_id: ownerUserId } : {}),
      },
      { onConflict: "github_install_id" },
    )
    .select("id")
    .single();
  if (error || !install) {
    throw new Error(`upsert installation: ${error?.message ?? "no row"}`);
  }

  const repos = await listInstallationRepos(githubInstallId);
  let stored: SyncedRepo[] = [];
  if (repos.length > 0) {
    const { data, error: repoErr } = await db
      .from("repos")
      .upsert(
        repos.map((r) => ({
          install_id: install.id,
          github_repo_id: r.githubRepoId,
          name: r.name,
          full_name: r.fullName,
          default_branch: r.defaultBranch,
        })),
        { onConflict: "github_repo_id" },
      )
      .select("id, full_name, default_branch");
    if (repoErr) throw new Error(`upsert repos: ${repoErr.message}`);
    stored = data ?? [];
  }

  return { installId: install.id, repos: stored };
}
