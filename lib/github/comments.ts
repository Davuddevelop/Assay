import type { Octokit } from "octokit";

// A hidden marker so we update our own comment on each push instead of stacking
// a new one. GitHub treats PR comments as issue comments.
const MARKER = "<!-- assay:verdict -->";

/** Create or update Assay's single verdict comment on the PR. */
export async function upsertPrComment(
  octokit: Octokit,
  fullName: string,
  prNumber: number,
  body: string,
): Promise<void> {
  const [owner, repo] = fullName.split("/");
  const withMarker = `${MARKER}\n${body}`;

  const existing = await octokit.paginate(
    "GET /repos/{owner}/{repo}/issues/{issue_number}/comments",
    { owner, repo, issue_number: prNumber, per_page: 100 },
  );
  const mine = existing.find((c) => c.body?.includes(MARKER));

  if (mine) {
    await octokit.request(
      "PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}",
      { owner, repo, comment_id: mine.id, body: withMarker },
    );
  } else {
    await octokit.request(
      "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
      { owner, repo, issue_number: prNumber, body: withMarker },
    );
  }
}
