import type { Octokit } from "octokit";

import type { Verdict } from "@/lib/db/types";

/**
 * Post the verdict as a GitHub Check Run on the head commit. Assayed →
 * success; Held → action_required (visible, blocking-looking, but not a hard
 * failure that breaks unrelated automation).
 */
export async function postCheckRun(
  octokit: Octokit,
  fullName: string,
  commitSha: string,
  verdict: Verdict,
  summary: string,
  details: string,
): Promise<void> {
  const [owner, repo] = fullName.split("/");
  await octokit.request("POST /repos/{owner}/{repo}/check-runs", {
    owner,
    repo,
    name: "Assay",
    head_sha: commitSha,
    status: "completed",
    conclusion: verdict === "assayed" ? "success" : "action_required",
    output: {
      title: verdict === "assayed" ? "✓ Assayed" : "⚠ Held",
      summary,
      text: details,
    },
  });
}
