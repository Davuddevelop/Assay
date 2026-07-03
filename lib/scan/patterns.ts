import type { RawFinding, ScanSeverity } from "@/lib/scan/types";
import { decodeJwtRole } from "@/lib/scan/supabase-detect";

/**
 * Detect secrets/credentials shipped to the browser in a vibe-coded app's client
 * JS — the most common, most damaging failure. CRITICAL invariant: we report the
 * *type* and a *redacted* location only. The matched secret value is never
 * returned or stored.
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
    id: "stripe-secret-key",
    pattern: /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}\b/g,
    severity: "critical",
    title: "Stripe secret key exposed",
    detail: "A live Stripe secret key is present in client code — it can move real money and read payment data.",
  },
  {
    id: "stripe-test-key",
    pattern: /\b(?:sk|rk)_test_[A-Za-z0-9]{20,}\b/g,
    severity: "risky",
    title: "Stripe test secret key exposed",
    detail: "A Stripe test secret key is in client code. Not live money, but it should never ship to the browser.",
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
    detail: "A hardcoded OpenAI/Anthropic-style API key is present in client code — anyone can run up your bill.",
  },
  {
    id: "github-token",
    pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,
    severity: "critical",
    title: "GitHub token exposed",
    detail: "A hardcoded GitHub token is present in client code.",
  },
  {
    id: "slack-token",
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
    severity: "critical",
    title: "Slack token exposed",
    detail: "A Slack API token is present in client code.",
  },
  {
    id: "sendgrid-key",
    pattern: /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/g,
    severity: "critical",
    title: "SendGrid API key exposed",
    detail: "A SendGrid API key is present in client code — it can send email as you.",
  },
  {
    id: "google-oauth-secret",
    pattern: /\bGOCSPX-[A-Za-z0-9_-]{20,}\b/g,
    severity: "critical",
    title: "Google OAuth client secret exposed",
    detail: "A Google OAuth client secret is present in client code.",
  },
  {
    id: "npm-token",
    pattern: /\bnpm_[A-Za-z0-9]{36}\b/g,
    severity: "critical",
    title: "npm access token exposed",
    detail: "An npm access token is present in client code.",
  },
  {
    id: "mailgun-key",
    pattern: /\bkey-[0-9a-f]{32}\b/g,
    severity: "risky",
    title: "Mailgun API key exposed",
    detail: "A Mailgun API key appears to be present in client code.",
  },
  {
    id: "google-api-key",
    pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/g,
    severity: "minor",
    title: "Google/Firebase API key in client code",
    detail:
      "A Google API key is in client code. Firebase web keys are meant to be public, but confirm it is restricted to your domain and that your database rules are locked down.",
  },
];

// Conservative "assigned secret" catch. We ONLY trigger on variable names that
// strongly imply a *private* secret (not a bare "apiKey"/"token", which are
// usually public publishable keys), and we skip values that are obviously
// public. This is deliberately narrow: a false "your app is unsafe" costs more
// trust than a missed odd secret — the specific high-confidence rules above
// still catch the dangerous keys regardless of variable name.
const SECRET_ASSIGN_RE =
  /(?:client[_-]?secret|api[_-]?secret|secret[_-]?key|private[_-]?key|service[_-]?(?:role[_-]?)?key|\bpassword|\bpasswd)\s*[:=]\s*['"]([^'"\s]{12,})['"]/gi;

/** True when a value is a known PUBLIC key and must never be flagged as a leak. */
function looksPublic(v: string): boolean {
  return (
    /^eyJ/.test(v) || // JWT (Supabase anon key etc.)
    /^pk_/.test(v) || // Stripe publishable
    /^AIza/.test(v) || // Google / Firebase web key
    /^sb_publishable_/.test(v) || // Supabase publishable
    /^(pk|pub|public|publishable|anon)[_-]/i.test(v)
  );
}

// A JWT shipped to the browser is normal (the Supabase anon key is meant to be
// public) — so we do NOT flag JWTs by shape. We decode each one and flag ONLY a
// service_role key, which bypasses all security. This avoids a false alarm on
// every Supabase app while still catching the game-over case.
const JWT_RE = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g;

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

  // Conservative hardcoded-secret catch — skips known-public keys so we never
  // cry wolf on a Supabase anon key or a public Lovable/Firebase key.
  if (!seen.has("secret-assign")) {
    for (const m of text.matchAll(SECRET_ASSIGN_RE)) {
      const value = m[1];
      if (looksPublic(value)) continue;
      seen.add("secret-assign");
      out.push({
        kind: "exposed-secret",
        severity: "risky",
        title: "Hardcoded secret in client code",
        detail: "A value under a secret-like name is hardcoded in the client bundle.",
        redactedLocation: `${source} — ${redact(value)}`,
      });
      break;
    }
  }

  // Precise service_role detection (never flags the normal anon key).
  for (const m of text.matchAll(JWT_RE)) {
    if (decodeJwtRole(m[0]) === "service_role") {
      out.push({
        kind: "exposed-secret",
        severity: "critical",
        title: "Supabase service key exposed in client code",
        detail:
          "The service_role key is in the browser bundle. It bypasses all Row-Level Security — anyone can read, change, or delete any data.",
        redactedLocation: `${source} — service_role key`,
      });
      break;
    }
  }

  return out;
}
