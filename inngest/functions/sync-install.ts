import {
  inngest,
  EVENTS,
  type InstallationSyncEventData,
} from "@/inngest/client";
import { syncInstallation } from "@/lib/github/sync";
import { log } from "@/lib/log";

/**
 * Reconcile a GitHub App installation into our database (webhook path). The
 * actual work lives in `syncInstallation` so the post-install redirect and this
 * durable handler stay in sync. Idempotent.
 */
export const syncInstall = inngest.createFunction(
  {
    id: "sync-install",
    name: "Sync GitHub installation",
    triggers: [{ event: EVENTS.installationSync }],
  },
  async ({ event, step }) => {
    const { githubInstallId } = event.data as InstallationSyncEventData;

    const result = await step.run("sync", () => syncInstallation(githubInstallId));

    // Kick off embedding indexing per repo (no-ops if embeddings are disabled).
    if (result.repos.length > 0) {
      await step.sendEvent(
        "enqueue-index",
        result.repos.map((r) => ({
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
      repoCount: result.repos.length,
    });

    return { installId: result.installId, repoCount: result.repos.length };
  },
);
