import { describe, it, expect } from "vitest";

import { parseFindings } from "@/lib/anthropic/review";

describe("structured review parsing", () => {
  it("parses a valid findings payload", () => {
    const raw = {
      findings: [
        {
          type: "security",
          severity: "high",
          message: "Logs the full request body, which includes the card number.",
          file: "payments/charge.ts",
          line: 48,
          suggestion: "Redact card fields before logging.",
        },
      ],
    };
    const findings = parseFindings(raw);
    expect(findings).toHaveLength(1);
    expect(findings[0].type).toBe("security");
    expect(findings[0].line).toBe(48);
  });

  it("accepts an empty findings list (clean change)", () => {
    expect(parseFindings({ findings: [] })).toEqual([]);
  });

  it("accepts null file/line/suggestion", () => {
    const findings = parseFindings({
      findings: [
        {
          type: "quality",
          severity: "low",
          message: "Consider extracting this helper.",
          file: null,
          line: null,
          suggestion: null,
        },
      ],
    });
    expect(findings[0].file).toBeNull();
  });

  it("rejects an invalid finding type", () => {
    expect(() =>
      parseFindings({
        findings: [
          { type: "nonsense", severity: "high", message: "x", file: null, line: null, suggestion: null },
        ],
      }),
    ).toThrow();
  });

  it("rejects a missing required field", () => {
    expect(() =>
      parseFindings({ findings: [{ type: "rule", severity: "high" }] }),
    ).toThrow();
  });

  it("rejects a non-object payload", () => {
    expect(() => parseFindings("not json")).toThrow();
  });
});
