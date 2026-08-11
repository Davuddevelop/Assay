import type { RawFinding } from "@/lib/scan/types";

/**
 * Security headers: whether they're there, and whether they do anything.
 *
 * Presence alone was the whole check, and presence alone is easy to pass.
 * A Content-Security-Policy that never says where scripts may come from is
 * still a Content-Security-Policy — it sets a header, satisfies a checklist,
 * and blocks nothing that CSP exists to block. Grading only presence meant
 * this scanner said "no issues" about a policy a stricter scanner flags, and
 * "no issues" is the one answer this product cannot afford to get wrong.
 *
 * Found on our own site: assaysecurity.com ships a CSP with no `script-src`
 * (next.config.ts documents why — a nonce'd policy broke hydration under
 * Next 16 + Turbopack and was reverted). The old check scored that 100/100
 * while the source called it an unresolved gap.
 *
 * Everything here stays `minor`, deliberately. A weak CSP is defense in
 * depth — it matters when something *else* has already gone wrong, and
 * calling it "at risk" would overclaim in the opposite direction (CLAUDE.md
 * §4). The point is that a perfect score should be hard, not that a header
 * is an emergency.
 *
 * Pure — no I/O — so every rule is unit-testable directly.
 */

interface HeaderCheck {
  header: string;
  title: string;
  detail: string;
}

const CHECKS: HeaderCheck[] = [
  {
    header: "content-security-policy",
    title: "No Content-Security-Policy",
    detail:
      "The app has no Content-Security-Policy header, which helps block injected/malicious scripts (XSS).",
  },
  {
    header: "strict-transport-security",
    title: "No HSTS (forced HTTPS)",
    detail:
      "Without Strict-Transport-Security, browsers may load the site over insecure HTTP.",
  },
  {
    header: "x-frame-options",
    title: "Page can be embedded in an iframe",
    detail:
      "Missing X-Frame-Options (or frame-ancestors) allows clickjacking via embedding.",
  },
  {
    header: "x-content-type-options",
    title: "No MIME-sniffing protection",
    detail: "Missing X-Content-Type-Options: nosniff allows content-type confusion attacks.",
  },
];

function weak(title: string, detail: string): RawFinding {
  return {
    kind: "weak-header",
    severity: "minor",
    title,
    detail,
    redactedLocation: "HTTP response headers",
  };
}

/**
 * A CSP header split into `directive → source list`, lowercased.
 *
 * First occurrence wins, matching the spec: a repeated directive inside one
 * policy is ignored after the first, so a later, laxer copy must not be able
 * to overwrite a stricter earlier one in our reading of it.
 */
function parseCsp(value: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const part of value.split(";")) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    const name = tokens[0].toLowerCase();
    if (!out.has(name)) out.set(name, tokens.slice(1).map((t) => t.toLowerCase()));
  }
  return out;
}

/**
 * Does this policy actually constrain scripts, and if so, how loosely?
 *
 * `script-src-elem` beats `script-src` beats `default-src`, which is the
 * precedence browsers apply — checking only `script-src` would misread a
 * policy that sets one of the other two.
 */
function checkCspQuality(value: string): RawFinding[] {
  const csp = parseCsp(value);
  const sources =
    csp.get("script-src-elem") ?? csp.get("script-src") ?? csp.get("default-src") ?? null;

  if (sources === null) {
    return [
      weak(
        "Security policy doesn't restrict scripts",
        "Your app sends a Content-Security-Policy, but it never says where scripts are allowed to come from. That is the part that stops injected code from running, so the policy currently protects you far less than having one suggests.",
      ),
    ];
  }

  // `'strict-dynamic'` makes browsers ignore both `'unsafe-inline'` and host
  // wildcards in the same list, so flagging either alongside it would be a
  // false positive on a policy that is actually modern and strict.
  const has = (needle: string) =>
    sources.some((s) => s.replace(/['"]/g, "") === needle);
  if (has("strict-dynamic")) return [];

  const out: RawFinding[] = [];
  if (has("unsafe-inline")) {
    out.push(
      weak(
        "Security policy allows inline scripts",
        "Your Content-Security-Policy permits inline scripts ('unsafe-inline'). That is the exact thing the policy is meant to prevent — someone who finds a way to inject code onto your page can still get it to run.",
      ),
    );
  }
  if (has("*")) {
    out.push(
      weak(
        "Security policy allows scripts from any site",
        "Your Content-Security-Policy uses a wildcard (*) for scripts, so code hosted on any website is allowed to run inside your app. That leaves the policy with almost no effect.",
      ),
    );
  }
  return out;
}

/** Under six months, a returning visitor's first request can still be downgraded. */
const HSTS_MIN_SECONDS = 15_552_000; // 180 days

function checkHstsQuality(value: string): RawFinding[] {
  const match = /max-age\s*=\s*"?(\d+)"?/i.exec(value);
  // No parsable max-age at all means browsers get no duration to honour.
  const seconds = match ? Number(match[1]) : 0;
  if (seconds >= HSTS_MIN_SECONDS) return [];

  const days = Math.floor(seconds / 86_400);
  return [
    weak(
      "Forced HTTPS expires too soon",
      `Your app tells browsers to insist on HTTPS, but only for ${days} day${days === 1 ? "" : "s"}. Once that runs out, someone coming back after a break can have their first visit quietly downgraded to insecure HTTP. Six months or more is the usual floor.`,
    ),
  ];
}

/** Missing and weak security headers (defense-in-depth → minor severity). */
export function checkHeaders(headers: Record<string, string>): RawFinding[] {
  const present = new Set(Object.keys(headers).map((h) => h.toLowerCase()));
  // CSP via frame-ancestors also satisfies clickjacking protection.
  const csp = headers["content-security-policy"]?.toLowerCase() ?? "";
  const hsts = headers["strict-transport-security"] ?? "";

  const missing = CHECKS.filter((c) => {
    if (present.has(c.header)) return false;
    if (c.header === "x-frame-options" && csp.includes("frame-ancestors")) return false;
    return true;
  }).map<RawFinding>((c) => ({
    kind: "missing-header",
    severity: "minor",
    title: c.title,
    detail: c.detail,
    redactedLocation: "HTTP response headers",
  }));

  // Quality is only a question for headers that are actually there; a missing
  // one is already reported above and must not be counted twice.
  return [
    ...missing,
    ...(csp ? checkCspQuality(csp) : []),
    ...(hsts ? checkHstsQuality(hsts) : []),
  ];
}
