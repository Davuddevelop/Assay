import type { Octokit } from "octokit";

export interface DiffFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  /** The unified-diff patch for this file (may be absent for huge/binary files). */
  patch?: string;
}

export interface PullDiff {
  files: DiffFile[];
  /** True if we truncated the file list / patches to stay within budget. */
  truncated: boolean;
}

// Keep the review prompt bounded: skip patches past a per-file size and stop
// collecting once the combined patch text gets large. Binary/generated files
// have no patch and are listed without one.
const MAX_PATCH_CHARS_PER_FILE = 12_000;
const MAX_TOTAL_PATCH_CHARS = 60_000;
const MAX_FILES = 60;

/** Fetch the changed files + patches for a pull request. */
export async function fetchPullDiff(
  octokit: Octokit,
  fullName: string,
  prNumber: number,
): Promise<PullDiff> {
  const [owner, repo] = fullName.split("/");
  const raw = await octokit.paginate("GET /repos/{owner}/{repo}/pulls/{pull_number}/files", {
    owner,
    repo,
    pull_number: prNumber,
    per_page: 100,
  });

  const files: DiffFile[] = [];
  let total = 0;
  let truncated = false;

  for (const f of raw) {
    if (files.length >= MAX_FILES) {
      truncated = true;
      break;
    }
    let patch = f.patch;
    if (patch && patch.length > MAX_PATCH_CHARS_PER_FILE) {
      patch = patch.slice(0, MAX_PATCH_CHARS_PER_FILE);
      truncated = true;
    }
    if (patch && total + patch.length > MAX_TOTAL_PATCH_CHARS) {
      patch = undefined;
      truncated = true;
    }
    if (patch) total += patch.length;

    files.push({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      patch,
    });
  }

  return { files, truncated };
}

/** Render a diff as compact text for the review prompt. */
export function renderDiff(diff: PullDiff): string {
  const parts = diff.files.map((f) => {
    const header = `### ${f.filename} (${f.status}, +${f.additions} -${f.deletions})`;
    return f.patch ? `${header}\n${f.patch}` : `${header}\n(no patch available)`;
  });
  if (diff.truncated) {
    parts.push("\n(diff truncated for length)");
  }
  return parts.join("\n\n");
}
