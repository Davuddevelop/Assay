/** Build canonical github.com URLs from stored repo/check data. Pure. */
export const repoUrl = (fullName: string) => `https://github.com/${fullName}`;

export const prUrl = (fullName: string, prNumber: number) =>
  `https://github.com/${fullName}/pull/${prNumber}`;

export const commitUrl = (fullName: string, sha: string) =>
  `https://github.com/${fullName}/commit/${sha}`;

/** The most relevant GitHub link for a check: its PR, else its commit. */
export const checkUrl = (
  fullName: string,
  sha: string,
  prNumber: number | null,
) => (prNumber ? prUrl(fullName, prNumber) : commitUrl(fullName, sha));
