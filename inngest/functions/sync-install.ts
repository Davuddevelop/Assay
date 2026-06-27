import {
  inngest,
  EVENTS,
  type InstallationSyncEventData,
} from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt } from "@/lib/crypto";
import { log } from "@/lib/log";
import {
  createInstallationToken,
  getInstallationAccount,
  listInstallationRepos,
} from "@/lib/github/app";

/**
 * Reconcile a GitHub App installation into our database: upsert the
 * installation (with a freshly minted, encrypted access token) and the set of
 * repositories it can access. Runs on install/uninstall and whenever the repo
 * selection changes. Idempotent — repeated syncs converge to the same state.
 */
export const syncInstall = inngest.createFunction(
  {
    id: "sync-install",
    name: "Sync GitHub installation",
    triggers: [{ event: EVENTS.installationSync }],
  },
  async ({ event, step }) => {
    const { githubInstallId } = event.data as InstallationSyncEventData;

    const account = await step.run("fetch-account", () =>
      getInstallationAccount(githubInstallId),
    );

    // Mint + encrypt a token inside the step so the plaintext never leaves it.
    const encryptedToken = await step.run("mint-token", async () => {
      const { token, expiresAt } = await createInstallationToken(githubInstallId);
      return { ciphertext: encrypt(token), expiresAt };
    });

    const installId = await step.run("upsert-installation", async () => {
      const db = createAdminClient();
      const { data, error } = await db
        .from("installations")
        .upsert(
          {
            github_install_id: githubInstallId,
            account_login: account.accountLogin,
            account_id: account.accountId,
            encrypted_token: encryptedToken.ciphertext,
            token_expires_at: encryptedToken.expiresAt,
          },
          { onConflict: "github_install_id" },
        )
        .select("id")
        .single();
      if (error) throw new Error(`upsert installation: ${error.message}`);
      return data.id;
    });

    const repos = await step.run("fetch-repos", () =>
      listInstallationRepos(githubInstallId),
    );

    const stored = await step.run("upsert-repos", async () => {
      if (repos.length === 0) return [];
      const db = createAdminClient();
      const { data, error } = await db
        .from("repos")
        .upsert(
          repos.map((r) => ({
            install_id: installId,
            github_repo_id: r.githubRepoId,
            name: r.name,
            full_name: r.fullName,
            default_branch: r.defaultBranch,
          })),
          { onConflict: "github_repo_id" },
        )
        .select("id, full_name, default_branch");
      if (error) throw new Error(`upsert repos: ${error.message}`);
      return data ?? [];
    });

    // Kick off embedding indexing for each repo (the job no-ops if embeddings
    // aren't configured, so this is safe to always emit).
    if (stored.length > 0) {
      await step.sendEvent(
        "enqueue-index",
        stored.map((r) => ({
          name: EVENTS.repoIndex,
          data: {
            githubInstallId,
            repoId: r.id,
            fullName: r.full_name,
            ref: r.default_branch,
          },
        })),
      );
    }

    log.info("installation synced", {
      githubInstallId,
      repoCount: repos.length,
    });

    return { installId, repoCount: repos.length };
  },
);
