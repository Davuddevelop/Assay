import "server-only";

import { detectTestPlan, type RepoManifest } from "@/lib/sandbox/detect";
import { runInE2B } from "@/lib/sandbox/e2b";
import { skippedResult, type TestRunResult } from "@/lib/sandbox/parse";
import type { Finding } from "@/lib/findings";

export function isSandboxEnabled(): boolean {
  return Boolean(process.env.E2B_API_KEY);
}

/**
 * Run the repo's tests in the sandbox for this commit. Best-effort: returns a
 * skipped result (never throws into the pipeline) when the sandbox is off, no
 * suite is detected, or the run errors.
 */
export async function runRepoTests(opts: {
  cloneToken: string;
  fullName: string;
  ref: string;
  manifest: RepoManifest;
}): Promise<TestRunResult> {
  if (!isSandboxEnabled()) return skippedResult("Sandbox not configured.");

  const plan = detectTestPlan(opts.manifest);
  if (!plan) return skippedResult("No test suite detected.");

  try {
    return await runInE2B(plan, {
      cloneToken: opts.cloneToken,
      fullName: opts.fullName,
      ref: opts.ref,
    });
  } catch {
    return skippedResult("Test run could not complete.");
  }
}

/** Turn a failing test run into a check finding (pure). */
export function testResultToFindings(result: TestRunResult): Finding[] {
  if (!result.ran || result.passedAll) return [];
  return [
    {
      type: "test",
      severity: "high",
      message: `Tests fail on this change — ${result.summary}`,
      file: null,
      line: null,
      suggestion: "Fix the failing tests before this change is merged.",
    },
  ];
}
