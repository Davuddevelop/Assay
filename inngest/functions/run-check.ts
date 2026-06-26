import {
  inngest,
  EVENTS,
  type PullRequestEventData,
} from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";
import { log } from "@/lib/log";
import { consumeUsage } from "@/lib/usage";
import { getInstallationOctokit } from "@/lib/github/app";
import { fetchPullDiff } from "@/lib/github/diff";
import { reviewDiff } from "@/lib/anthropic/review";
import { decideVerdict } from "@/lib/verdict";
import { postCheckRun } from "@/lib/github/checks";
import { upsertPrComment } from "@/lib/github/comments";
import { renderComment, renderCheckDetails } from "@/lib/report";

/**
 * The check pipeline. On a pull request: enforce the usage limit, record a
 * running check, fetch the diff, run the structured AI review, decide the
 * hallmark, persist findings, and post the verdict back to GitHub as a Check
 * Run and a single PR comment. Each side effect is its own durable step so a
 * retry resumes rather than repeats.
 */
export const runCheck = inngest.createFunction(
  {
    id: "run-check",
    name: "Run a check on a pull request",
    triggers: [{ event: EVENTS.pullRequest }],
  },
  async ({ event, step }) => {
    const { githubInstallId, repoGithubId, fullName, commitSha, prNumber } =
      event.data as PullRequestEventData;

    // Resolve the repo + installation we synced earlier.
    const ctx = await step.run("load-repo", async () => {
      const db = createAdminClient();
      const { data: repo, error } = await db
        .from("repos")
        .select("id, rules, install_id")
        .eq("github_repo_id", repoGithubId)
        .single();
      if (error || !repo) {
        return null;
      }
      const { data: install } = await db
        .from("installations")
        .select("id, plan, encrypted_token")
        .eq("id", repo.install_id)
        .single();
      return install ? { repo, install } : null;
    });

    if (!ctx) {
      log.warn("check skipped: repo or installation not found", {
        githubInstallId,
        repoGithubId,
      });
      return { skipped: "not-synced" };
    }

    // Enforce the monthly limit before doing any work.
    const allowed = await step.run("enforce-usage", () =>
      consumeUsage(ctx.install.id, ctx.install.plan),
    );
    if (!allowed) {
      log.warn("check skipped: usage limit reached", {
        installId: ctx.install.id,
      });
      return { skipped: "limit-reached" };
    }

    // Record a running check (idempotent on repo_id + commit_sha).
    const checkId = await step.run("create-check", async () => {
      const db = createAdminClient();
      const { data, error } = await db
        .from("checks")
        .upsert(
          {
            repo_id: ctx.repo.id,
            commit_sha: commitSha,
            pr_number: prNumber,
            status: "running",
            verdict: null,
            summary: null,
            completed_at: null,
          },
          { onConflict: "repo_id,commit_sha" },
        )
        .select("id")
        .single();
      if (error) throw new Error(`create check: ${error.message}`);
      return data.id;
    });

    // Fetch the diff with an installation-scoped Octokit. Decrypt the token
    // inside the step; never return plaintext from a step.
    const diff = await step.run("fetch-diff", async () => {
      if (ctx.install.encrypted_token) {
        // Touch decrypt to fail fast if the stored token is corrupt; the
        // App-minted Octokit below is what actually authorizes the call.
        decrypt(ctx.install.encrypted_token);
      }
      const octokit = await getInstallationOctokit(githubInstallId);
      return fetchPullDiff(octokit, fullName, prNumber);
    });

    // Structured AI review.
    const findings = await step.run("ai-review", () =>
      reviewDiff({ rules: ctx.repo.rules, diff }),
    );

    const { verdict, summary } = decideVerdict(findings);

    // Persist findings + the verdict.
    await step.run("save-results", async () => {
      const db = createAdminClient();
      // Replace any prior findings for this check (idempotent on retry).
      await db.from("findings").delete().eq("check_id", checkId);
      if (findings.length > 0) {
        const { error } = await db.from("findings").insert(
          findings.map((f) => ({
            check_id: checkId,
            type: f.type,
            severity: f.severity,
            message: f.message,
            file: f.file,
            line: f.line,
            suggestion: f.suggestion,
          })),
        );
        if (error) throw new Error(`insert findings: ${error.message}`);
      }
      const { error: upd } = await db
        .from("checks")
        .update({
          status: "completed",
          verdict,
          summary,
          completed_at: new Date().toISOString(),
        })
        .eq("id", checkId);
      if (upd) throw new Error(`update check: ${upd.message}`);
    });

    // Post the verdict to GitHub.
    await step.run("post-to-github", async () => {
      const octokit = await getInstallationOctokit(githubInstallId);
      await postCheckRun(
        octokit,
        fullName,
        commitSha,
        verdict,
        summary,
        renderCheckDetails(findings),
      );
      await upsertPrComment(
        octokit,
        fullName,
        prNumber,
        renderComment(verdict, summary, findings),
      );
    });

    log.info("check completed", {
      checkId,
      verdict,
      findingCount: findings.length,
    });

    return { checkId, verdict, findingCount: findings.length };
  },
);
