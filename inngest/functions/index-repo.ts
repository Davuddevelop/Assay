import {
  inngest,
  EVENTS,
  type RepoIndexEventData,
} from "@/inngest/client";
import { getInstallationOctokit } from "@/lib/github/app";
import { fetchRepoSourceFiles } from "@/lib/github/files";
import { indexRepoFiles } from "@/lib/embeddings/retrieve";
import { isEmbeddingsEnabled } from "@/lib/embeddings/voyage";
import { log } from "@/lib/log";

/**
 * Index a repository's source into the embeddings store so the AI review can
 * retrieve relevant context. No-ops when embeddings aren't configured.
 */
export const indexRepo = inngest.createFunction(
  {
    id: "index-repo",
    name: "Index a repository for retrieval",
    triggers: [{ event: EVENTS.repoIndex }],
    // Keep embedding cost bounded — one repo indexes at a time per install.
    concurrency: { limit: 2 },
  },
  async ({ event, step }) => {
    const { githubInstallId, repoId, fullName, ref } =
      event.data as RepoIndexEventData;

    if (!isEmbeddingsEnabled()) {
      return { skipped: "embeddings-disabled" };
    }

    const files = await step.run("fetch-files", async () => {
      const octokit = await getInstallationOctokit(githubInstallId);
      return fetchRepoSourceFiles(octokit, fullName, ref);
    });

    const count = await step.run("embed-and-store", () =>
      indexRepoFiles(repoId, files),
    );

    log.info("repo indexed", { repoId, chunks: count });
    return { repoId, chunks: count };
  },
);
