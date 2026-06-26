import type { Finding } from "@/lib/findings";
import type { FindingSeverity } from "@/lib/db/types";
import type { PullDiff } from "@/lib/github/diff";

/**
 * Fast, deterministic security scan over the *added* lines of a diff. No binary
 * and no network, so it runs inline on every check (serverless-safe). It catches
 * the high-signal issues — committed secrets, sensitive logging, eval/exec,
 * injection, disabled TLS — and is structured so a heavier Semgrep pass (run in
 * the sandbox) can augment it later without changing the finding shape.
 */
interface Rule {
  id: string;
  pattern: RegExp;
  severity: FindingSeverity;
  message: string;
  suggestion: string;
}

const RULES: Rule[] = [
  {
    id: "private-key",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |PGP |DSA )?PRIVATE KEY-----/,
    severity: "critical",
    message: "A private key appears to be committed to source.",
    suggestion: "Remove it, rotate the key, and load it from a secret manager.",
  },
  {
    id: "aws-access-key",
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
    severity: "critical",
    message: "Looks like a hardcoded AWS access key id.",
    suggestion: "Move credentials to environment variables and rotate the key.",
  },
  {
    id: "anthropic-openai-key",
    pattern: /\bsk-(?:ant-)?[A-Za-z0-9_-]{20,}\b/,
    severity: "critical",
    message: "Looks like a hardcoded API key (OpenAI/Anthropic style).",
    suggestion: "Store the key in an env var; never commit it.",
  },
  {
    id: "github-token",
    pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
    severity: "critical",
    message: "Looks like a hardcoded GitHub token.",
    suggestion: "Revoke the token and load it from the environment.",
  },
  {
    id: "slack-token",
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
    severity: "high",
    message: "Looks like a hardcoded Slack token.",
    suggestion: "Revoke and move it to a secret store.",
  },
  {
    id: "generic-secret-assignment",
    pattern:
      /(?:api[_-]?key|secret|token|password|passwd|pwd)\s*[:=]\s*['"][^'"\s]{8,}['"]/i,
    severity: "high",
    message: "Possible hardcoded secret assigned in source.",
    suggestion: "Read the value from an environment variable instead.",
  },
  {
    id: "sensitive-logging",
    pattern:
      /(?:console\.(?:log|info|debug|warn|error)|logger\.\w+)\s*\([^)]*\b(?:password|passwd|secret|token|card(?:[_.]?number)?|cvv|ssn|req\.body)\b/i,
    severity: "high",
    message: "Logging may expose sensitive data.",
    suggestion: "Redact secrets and PII before logging.",
  },
  {
    id: "eval",
    pattern: /\beval\s*\(/,
    severity: "high",
    message: "Use of eval() can execute arbitrary code.",
    suggestion: "Replace eval with a safe parser or explicit logic.",
  },
  {
    id: "command-injection",
    pattern: /\b(?:exec|execSync|spawn|spawnSync)\s*\(\s*[`'"][^`'"]*\$\{/,
    severity: "high",
    message: "Shell command built with interpolation — possible command injection.",
    suggestion: "Pass arguments as an array, or validate/escape interpolated input.",
  },
  {
    id: "sql-injection",
    pattern:
      /(?:query|execute|raw)\s*\(\s*[`'"][^`'"]*(?:SELECT|INSERT|UPDATE|DELETE)[^`'"]*\$\{/i,
    severity: "high",
    message: "SQL built with string interpolation — possible SQL injection.",
    suggestion: "Use parameterized queries / prepared statements.",
  },
  {
    id: "dangerous-html",
    pattern: /dangerouslySetInnerHTML/,
    severity: "medium",
    message: "dangerouslySetInnerHTML can introduce XSS.",
    suggestion: "Sanitize the HTML or render as text.",
  },
  {
    id: "tls-disabled",
    pattern: /rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0|verify\s*=\s*False/,
    severity: "high",
    message: "TLS certificate verification appears to be disabled.",
    suggestion: "Keep certificate verification on; fix the underlying trust issue.",
  },
];

/** Parse the added lines of a unified-diff patch, with new-file line numbers. */
export function parseAddedLines(patch: string): { line: number; text: string }[] {
  const out: { line: number; text: string }[] = [];
  let newLine = 0;
  for (const raw of patch.split("\n")) {
    if (raw.startsWith("@@")) {
      const m = raw.match(/\+(\d+)/);
      if (m) newLine = parseInt(m[1], 10);
      continue;
    }
    if (raw.startsWith("+++") || raw.startsWith("---")) continue;
    if (raw.startsWith("+")) {
      out.push({ line: newLine, text: raw.slice(1) });
      newLine++;
    } else if (raw.startsWith("-")) {
      // removed line — does not advance the new-file counter
    } else {
      newLine++;
    }
  }
  return out;
}

/** Run all rules against a single line; returns matches (no location). */
export function scanLine(text: string): Omit<Finding, "file" | "line">[] {
  const found: Omit<Finding, "file" | "line">[] = [];
  for (const rule of RULES) {
    if (rule.pattern.test(text)) {
      found.push({
        type: "security",
        severity: rule.severity,
        message: rule.message,
        suggestion: rule.suggestion,
      });
    }
  }
  return found;
}

/** Scan a whole pull-request diff and return located security findings. */
export function scanDiff(diff: PullDiff): Finding[] {
  const findings: Finding[] = [];
  for (const file of diff.files) {
    if (!file.patch) continue;
    for (const { line, text } of parseAddedLines(file.patch)) {
      for (const hit of scanLine(text)) {
        findings.push({ ...hit, file: file.filename, line });
      }
    }
  }
  return findings;
}
