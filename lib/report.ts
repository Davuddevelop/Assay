import type { FindingSeverity, FindingType, Verdict } from "@/lib/db/types";

export interface ReportFinding {
  type: FindingType;
  severity: FindingSeverity;
  message: string;
  file: string | null;
  line: number | null;
  suggestion: string | null;
}

const SEVERITY_ORDER: Record<FindingSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const SEVERITY_LABEL: Record<FindingSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const TYPE_LABEL: Record<FindingType, string> = {
  rule: "Rule",
  security: "Security",
  test: "Test",
  quality: "Quality",
};

function locate(f: ReportFinding): string {
  if (!f.file) return "";
  return f.line ? ` — \`${f.file}:${f.line}\`` : ` — \`${f.file}\``;
}

function renderFinding(f: ReportFinding): string {
  const head = `- **${TYPE_LABEL[f.type]} · ${SEVERITY_LABEL[f.severity]}**${locate(f)}`;
  const msg = `\n  ${f.message}`;
  const fix = f.suggestion ? `\n  _Suggestion:_ ${f.suggestion}` : "";
  return head + msg + fix;
}

function sortFindings(findings: readonly ReportFinding[]): ReportFinding[] {
  return [...findings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}

/** Markdown body for the PR comment. Plain-language, no hype. */
export function renderComment(
  verdict: Verdict,
  summary: string,
  findings: readonly ReportFinding[],
): string {
  const title = verdict === "assayed" ? "## ✓ Assayed" : "## ⚠ Held";
  const lines = [title, "", summary];

  if (findings.length > 0) {
    lines.push("", "### What was found", "");
    for (const f of sortFindings(findings)) lines.push(renderFinding(f));
  }

  lines.push(
    "",
    "---",
    "_Assay checks each change against your tests, a security pass, and your own rules._",
  );
  return lines.join("\n");
}

/** Plain-text details for the Check Run output body. */
export function renderCheckDetails(findings: readonly ReportFinding[]): string {
  if (findings.length === 0) return "No issues found.";
  return sortFindings(findings)
    .map((f) => {
      const loc = f.file ? (f.line ? `${f.file}:${f.line} — ` : `${f.file} — `) : "";
      return `[${TYPE_LABEL[f.type]}/${SEVERITY_LABEL[f.severity]}] ${loc}${f.message}`;
    })
    .join("\n");
}
