import { describe, it, expect } from "vitest";

import { parseAddedLines, scanLine, scanDiff } from "@/lib/security/scan";
import type { PullDiff } from "@/lib/github/diff";

describe("parseAddedLines", () => {
  it("tracks new-file line numbers across hunks", () => {
    const patch = [
      "@@ -1,2 +1,3 @@",
      " context",
      "+added one", // line 2
      " more context",
      "@@ -10,1 +20,2 @@",
      "+added two", // line 20
    ].join("\n");
    const lines = parseAddedLines(patch);
    expect(lines).toEqual([
      { line: 2, text: "added one" },
      { line: 20, text: "added two" },
    ]);
  });
});

describe("scanLine", () => {
  it("flags committed private keys (critical)", () => {
    const hits = scanLine("-----BEGIN RSA PRIVATE KEY-----");
    expect(hits[0].severity).toBe("critical");
    expect(hits[0].type).toBe("security");
  });

  it("flags sensitive logging", () => {
    const hits = scanLine('logger.info("charge", { body: req.body })');
    expect(hits.some((h) => h.message.includes("sensitive"))).toBe(true);
  });

  it("flags eval and disabled TLS", () => {
    expect(scanLine("const x = eval(userInput)").length).toBeGreaterThan(0);
    expect(scanLine("{ rejectUnauthorized: false }").length).toBeGreaterThan(0);
  });

  it("ignores clean code", () => {
    expect(scanLine("const sum = a + b;")).toEqual([]);
    expect(scanLine('import { foo } from "bar";')).toEqual([]);
  });
});

describe("scanDiff", () => {
  it("locates findings by file and line", () => {
    const diff: PullDiff = {
      truncated: false,
      files: [
        {
          filename: "payments/charge.ts",
          status: "modified",
          additions: 1,
          deletions: 0,
          patch: ["@@ -47,0 +48,1 @@", '+logger.info("c", { card: req.body })'].join("\n"),
        },
      ],
    };
    const findings = scanDiff(diff);
    expect(findings).toHaveLength(1);
    expect(findings[0].file).toBe("payments/charge.ts");
    expect(findings[0].line).toBe(48);
  });

  it("skips files without a patch", () => {
    const diff: PullDiff = {
      truncated: false,
      files: [{ filename: "img.png", status: "added", additions: 0, deletions: 0 }],
    };
    expect(scanDiff(diff)).toEqual([]);
  });
});
