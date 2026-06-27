import { getEnv } from "@/lib/env";
import { parseTestOutput, type TestRunResult } from "@/lib/sandbox/parse";
import type { TestPlan } from "@/lib/sandbox/detect";

const CLONE_TIMEOUT_MS = 120_000;
const STEP_TIMEOUT_MS = 300_000;

interface CommandError {
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  message?: string;
}

/**
 * Run a repo's tests inside an E2B sandbox — never on our own infra. Clones the
 * PR commit with a short-lived installation token, installs deps, runs the
 * suite, and parses the result. The SDK is imported dynamically so it only
 * loads when a sandbox run actually happens.
 */
export async function runInE2B(
  plan: TestPlan,
  opts: { cloneToken: string; fullName: string; ref: string },
): Promise<TestRunResult> {
  const { Sandbox } = await import("e2b");
  const sandbox = await Sandbox.create({ apiKey: getEnv().E2B_API_KEY });

  // Run a shell command, tolerating non-zero exits (test failures are expected).
  const run = async (cmd: string, timeoutMs: number) => {
    try {
      const r = await sandbox.commands.run(cmd, { timeoutMs });
      return { out: `${r.stdout}\n${r.stderr}`, code: r.exitCode ?? 0 };
    } catch (err) {
      const e = err as CommandError;
      return {
        out: `${e.stdout ?? ""}\n${e.stderr ?? e.message ?? ""}`,
        code: e.exitCode ?? 1,
      };
    }
  };

  try {
    // Token is interpolated into the clone URL only; never logged.
    const url = `https://x-access-token:${opts.cloneToken}@github.com/${opts.fullName}.git`;
    await run(`git clone --no-tags ${url} repo`, CLONE_TIMEOUT_MS);
    await run(`cd repo && git checkout ${opts.ref}`, 60_000);

    if (plan.installCommand) {
      await run(`cd repo && ${plan.installCommand}`, STEP_TIMEOUT_MS);
    }

    const { out, code } = await run(`cd repo && ${plan.testCommand}`, STEP_TIMEOUT_MS);
    return parseTestOutput(out, code);
  } finally {
    await sandbox.kill();
  }
}
