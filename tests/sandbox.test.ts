import { describe, it, expect } from "vitest";

import { detectTestPlan } from "@/lib/sandbox/detect";
import { parseTestOutput, skippedResult } from "@/lib/sandbox/parse";

describe("detectTestPlan", () => {
  it("detects a node project with a real test script (npm ci on lockfile)", () => {
    const plan = detectTestPlan({
      rootFiles: ["package.json", "package-lock.json"],
      packageJson: JSON.stringify({ scripts: { test: "vitest run" } }),
    });
    expect(plan?.runner).toBe("node");
    expect(plan?.installCommand).toBe("npm ci");
  });

  it("uses pnpm when a pnpm lockfile is present", () => {
    const plan = detectTestPlan({
      rootFiles: ["package.json", "pnpm-lock.yaml"],
      packageJson: JSON.stringify({ scripts: { test: "vitest" } }),
    });
    expect(plan?.testCommand).toBe("pnpm test");
  });

  it("ignores the npm placeholder test script", () => {
    const plan = detectTestPlan({
      rootFiles: ["package.json"],
      packageJson: JSON.stringify({
        scripts: { test: 'echo "Error: no test specified" && exit 1' },
      }),
    });
    expect(plan).toBeNull();
  });

  it("detects go, python, and rust", () => {
    expect(detectTestPlan({ rootFiles: ["go.mod"] })?.runner).toBe("go");
    expect(detectTestPlan({ rootFiles: ["requirements.txt"] })?.runner).toBe("python");
    expect(detectTestPlan({ rootFiles: ["Cargo.toml"] })?.runner).toBe("rust");
  });

  it("returns null when nothing is recognized", () => {
    expect(detectTestPlan({ rootFiles: ["README.md"] })).toBeNull();
  });
});

describe("parseTestOutput", () => {
  it("parses a passing vitest summary", () => {
    const r = parseTestOutput("Test Files 5 passed\n Tests 42 passed (42)", 0);
    expect(r.passedAll).toBe(true);
    expect(r.passed).toBe(42);
    expect(r.failed).toBe(0);
  });

  it("parses a failing jest summary", () => {
    const r = parseTestOutput("Tests: 2 failed, 40 passed, 42 total", 1);
    expect(r.passedAll).toBe(false);
    expect(r.failed).toBe(2);
    expect(r.passed).toBe(40);
  });

  it("parses pytest", () => {
    expect(parseTestOutput("=== 3 failed, 10 passed in 1.2s ===", 1).failed).toBe(3);
  });

  it("falls back to the exit code when counts are absent", () => {
    expect(parseTestOutput("boom", 1).passedAll).toBe(false);
    expect(parseTestOutput("done", 0).passedAll).toBe(true);
  });

  it("skippedResult never blocks the verdict", () => {
    const r = skippedResult("Sandbox off");
    expect(r.ran).toBe(false);
    expect(r.passedAll).toBe(true);
  });
});
