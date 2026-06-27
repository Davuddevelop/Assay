import type { Octokit } from "octokit";

import { isSkippablePath } from "@/lib/embeddings/chunk";

/** Extensions worth embedding (source/config/docs). */
const CODE_EXT =
  /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rb|rs|java|kt|php|c|h|cpp|cs|swift|scala|sql|sh|md|json|ya?ml|toml)$/i;

const MAX_FILES = 150;
const MAX_BLOB_BYTES = 100_000;

export interface SourceFile {
  path: string;
  content: string;
}

/**
 * Fetch a bounded set of a repo's source files at a ref, for embedding. Walks
 * the git tree once, filters to code/config/docs, and pulls blobs (base64) up
 * to a size + count cap so indexing stays cheap.
 */
export async function fetchRepoSourceFiles(
  octokit: Octokit,
  fullName: string,
  ref: string,
): Promise<SourceFile[]> {
  const [owner, repo] = fullName.split("/");

  const tree = await octokit.request(
    "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
    { owner, repo, tree_sha: ref, recursive: "1" },
  );

  const blobs = (tree.data.tree ?? [])
    .filter(
      (n) =>
        n.type === "blob" &&
        typeof n.path === "string" &&
        CODE_EXT.test(n.path) &&
        !isSkippablePath(n.path) &&
        (n.size ?? 0) <= MAX_BLOB_BYTES,
    )
    .slice(0, MAX_FILES);

  const files: SourceFile[] = [];
  for (const node of blobs) {
    if (!node.sha || !node.path) continue;
    const blob = await octokit.request(
      "GET /repos/{owner}/{repo}/git/blobs/{file_sha}",
      { owner, repo, file_sha: node.sha },
    );
    if (blob.data.encoding === "base64") {
      const content = Buffer.from(blob.data.content, "base64").toString("utf8");
      files.push({ path: node.path, content });
    }
  }
  return files;
}
