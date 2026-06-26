import { App, Octokit } from "octokit";

import { getEnv } from "@/lib/env";

/**
 * GitHub App authentication. The App's JWT lets us mint short-lived,
 * per-installation access tokens; those tokens are what we encrypt at rest and
 * what each installation's Octokit uses to call the API.
 */
let app: App | null = null;

function getApp(): App {
  if (app) return app;
  const env = getEnv();
  app = new App({
    appId: env.GITHUB_APP_ID,
    // Allow both literal "\n" escapes (single-line .env) and real newlines.
    privateKey: env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n"),
    webhooks: { secret: env.GITHUB_WEBHOOK_SECRET },
  });
  return app;
}

/** An Octokit authenticated as a specific installation. */
export async function getInstallationOctokit(
  githubInstallId: number,
): Promise<Octokit> {
  return getApp().getInstallationOctokit(githubInstallId);
}

export interface InstallationToken {
  token: string;
  expiresAt: string | null;
}

/**
 * Mint a fresh installation access token. The returned token is a secret —
 * encrypt it before storing (see lib/crypto.ts) and never log it.
 */
export async function createInstallationToken(
  githubInstallId: number,
): Promise<InstallationToken> {
  const res = await getApp().octokit.request(
    "POST /app/installations/{installation_id}/access_tokens",
    { installation_id: githubInstallId },
  );
  return {
    token: res.data.token,
    expiresAt: res.data.expires_at ?? null,
  };
}

/** List the repositories an installation can access (id, name, full_name, branch). */
export async function listInstallationRepos(githubInstallId: number) {
  const octokit = await getInstallationOctokit(githubInstallId);
  const repos = await octokit.paginate(
    "GET /installation/repositories",
    { per_page: 100 },
  );
  return repos.map((r) => ({
    githubRepoId: r.id,
    name: r.name,
    fullName: r.full_name,
    defaultBranch: r.default_branch ?? "main",
  }));
}

/** The installation's account login + id, for the installations row. */
export async function getInstallationAccount(githubInstallId: number) {
  const res = await getApp().octokit.request(
    "GET /app/installations/{installation_id}",
    { installation_id: githubInstallId },
  );
  const account = res.data.account;
  // account is a User or Enterprise; both have id, login differs by shape.
  const login =
    account && "login" in account
      ? account.login
      : (account?.name ?? "unknown");
  return { accountId: account?.id ?? 0, accountLogin: login };
}
