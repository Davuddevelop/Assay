import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "assay" });

/**
 * Event payload shapes. The webhook handler only *sends* these (returning in
 * well under a second); durable functions cast `event.data` to the matching
 * interface. Kept here as the single source of truth for both producer and
 * consumer.
 */
export interface PullRequestEventData {
  githubInstallId: number;
  repoGithubId: number;
  fullName: string;
  defaultBranch: string;
  commitSha: string;
  prNumber: number;
}

export interface InstallationSyncEventData {
  githubInstallId: number;
}

export interface RepoIndexEventData {
  githubInstallId: number;
  repoId: string;
  fullName: string;
  ref: string;
}

export const EVENTS = {
  pullRequest: "github/pull_request",
  installationSync: "github/installation.sync",
  repoIndex: "github/repo.index",
} as const;
