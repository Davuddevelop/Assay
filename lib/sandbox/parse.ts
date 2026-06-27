/** Outcome of running a test suite in the sandbox. */
export interface TestRunResult {
  ran: boolean;
  passedAll: boolean;
  passed: number;
  failed: number;
  total: number;
  summary: string;
}

/** The last integer captured by `re` across the text (summaries come last). */
function lastInt(re: RegExp, text: string): number | null {
  const matches = [...text.matchAll(new RegExp(re, "gi"))];
  const last = matches.at(-1);
  return last ? parseInt(last[1], 10) : null;
}

/**
 * Parse common test-runner output (jest/vitest, pytest, go, cargo) into a
 * structured result. Pure — exported for tests. Falls back to the exit code
 * when counts can't be found.
 */
export function parseTestOutput(output: string, exitCode: number): TestRunResult {
  const text = output.slice(-20_000); // tail is where summaries live

  const failed =
    lastInt(/(\d+)\s+failed/i, text) ??
    lastInt(/(\d+)\s+failures?/i, text) ??
    (exitCode === 0 ? 0 : null);

  const passed =
    lastInt(/(\d+)\s+passed/i, text) ?? lastInt(/(\d+)\s+ok\b/i, text) ?? 0;

  const resolvedFailed = failed ?? (exitCode === 0 ? 0 : 1);
  const total = passed + resolvedFailed;
  const passedAll = exitCode === 0 && resolvedFailed === 0;

  const summary = passedAll
    ? total > 0
      ? `${passed} test${passed === 1 ? "" : "s"} passed.`
      : "Tests passed."
    : `${resolvedFailed} test${resolvedFailed === 1 ? "" : "s"} failed.`;

  return {
    ran: true,
    passedAll,
    passed,
    failed: resolvedFailed,
    total,
    summary,
  };
}

/** A result for "we couldn't run tests" (no suite detected / sandbox off). */
export function skippedResult(summary: string): TestRunResult {
  return { ran: false, passedAll: true, passed: 0, failed: 0, total: 0, summary };
}
