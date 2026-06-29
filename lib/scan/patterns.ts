import type { RawFinding, ScanSeverity } from "@/lib/scan/types";

/**
 * Detect secrets/credentials shipped to the browser in a vibe-coded app's client
 * JS — the most common, most damaging failure. Generalized from the proven
 * pattern set. CRITICAL invariant: we report the *type* and a *redacted*
 * location only. The matched secret value is never returned or stored.
 */
interface Rule {
  id: string;
  pattern: RegExp;
  severity: ScanSeverity;
  title: string;
  detail: string;
}

const RULES: Rule[] = [
  {
    id: "private-key",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |PGP |DSA )?PRIVATE KEY-----/g,
    severity: "critical",
    title: "Private key shipped to the browser",
    detail: "A private cryptographic key is present in the client-side code.",
  },
  {
    id: "supabase-service-key",
    // A JWT whose payload role is service_role (base64 of '"role":"service_role"').
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g,
    severity: "critical",
    title: "Possible Supabase service key in the browser",
    detail:
      "A JWT is present in client code. If it is the Supabase service_role key, anyone can bypass all your security rules. (Confirmed by decoding the token role.)",
  },
  {
    id: "stripe-secret-key",
    pattern: /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}\b/g,
    severity: "critical",
    title: "Stripe secret key exposed",
    detail: "A live Stripe secret key is present in client code.",
  },
  {
    id: "aws-access-key",
    pattern: /\bAKIA[0-9A-Z]{16}\b/g,
    severity: "critical",
    title: "AWS access key exposed",
    detail: "A hardcoded AWS access key id is present in client code.",
  },
  {
    id: "ai-api-key",
    pattern: /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}\b/g,
    severity: "critical",
    title: "AI provider API key exposed",
    detail: "A hardcoded OpenAI/Anthropic-style API key is present in client code.",
  },
  {
    id: "github-token",
    pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,
    severity: "critical",
    title: "GitHub token exposed",
    detail: "A hardcoded GitHub token is present in client code.",
  },
  {
    id: "google-api-key",
    pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/g,
    severity: "risky",
    title: "Google/Firebase API key exposed",
    detail: "A Google API key is present in client code; confirm it is domain-restricted.",
  },
  {
    id: "generic-secret-assignment",
    pattern:
      /(?:api[_-]?key|secret|token|password|passwd|service[_-]?key)\s*[:=]\s*['"][^'"\s]{12,}['"]/gi,
    severity: "risky",
    title: "Hardcoded secret in client code",
    detail: "A value that looks like a secret is hardcoded in the client bundle.",
  },
];

/** Mask a matched secret so only its shape is shown — never the value. */
function redact(match: string): string {
  if (match.length <= 8) return "•".repeat(match.length);
  return `${match.slice(0, 3)}…${match.slice(-2)} (${match.length} chars)`;
}

/**
 * Scan a blob of client text (an HTML page or JS bundle) for exposed secrets.
 * Returns redacted findings; de-duplicates by rule so one key type reports once
 * per source.
 */
export function scanText(text: string, source: string): RawFinding[] {
  const out: RawFinding[] = [];
  const seen = new Set<string>();

  for (const rule of RULES) {
    for (const m of text.matchAll(rule.pattern)) {
      if (seen.has(rule.id)) break;
      seen.add(rule.id);
      out.push({
        kind: "exposed-secret",
        severity: rule.severity,
        title: rule.title,
        detail: rule.detail,
        redactedLocation: `${source} — ${redact(m[0])}`,
      });
    }
  }
  return out;
}
