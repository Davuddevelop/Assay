import "server-only";

import type { RawFinding } from "@/lib/scan/types";
import { assertScannableUrl } from "@/lib/scan/fetch";
import { looksLikeEnvFile, looksLikeGitConfig } from "@/lib/scan/content-heuristics";

/**
 * Probe for sensitive files accidentally served at the site root — the classic
 * vibe-coded leak (a committed .env, an exposed .git). Read-only GETs, bounded.
 * The content guards (content-heuristics) stop SPA catch-all 200s from ever
 * producing a false positive.
 */
const TIMEOUT_MS = 5_000;
const BUDGET_MS = 8_000;
const MAX_BYTES = 200_000;

interface Target {
  path: string;
  severity: "critical" | "risky";
  title: string;
  detail: string;
  test: (t: string) => boolean;
}

const TARGETS: Target[] = [
  {
    path: "/.env",
    severity: "critical",
    title: "Your .env file is public",
    detail:
      "The .env file is downloadable from your site — it usually holds every secret key your app has. Anyone can read them.",
    test: looksLikeEnvFile,
  },
  {
    path: "/.env.production",
    severity: "critical",
    title: "Your production .env file is public",
    detail: "A production environment file is downloadable from your site, exposing its secrets.",
    test: looksLikeEnvFile,
  },
  {
    path: "/.git/config",
    severity: "risky",
    title: "Your .git folder is exposed",
    detail:
      "The .git directory is served publicly. Attackers can reconstruct your full source code and history from it.",
    test: looksLikeGitConfig,
  },
];

async function get(url: string): Promise<{ status: number; text: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: "manual" });
    const raw = await res.text();
    return { status: res.status, text: raw.slice(0, MAX_BYTES) };
  } catch {
    return { status: 0, text: "" };
  } finally {
    clearTimeout(timer);
  }
}

/** Probe the app origin for exposed sensitive files. Never throws. */
export async function probeExposedFiles(origin: string): Promise<RawFinding[]> {
  const findings: RawFinding[] = [];
  const deadline = Date.now() + BUDGET_MS;

  for (const t of TARGETS) {
    if (Date.now() > deadline) break;
    let abs: string;
    try {
      abs = new URL(t.path, origin).toString();
    } catch {
      continue;
    }
    try {
      await assertScannableUrl(abs);
    } catch {
      continue;
    }
    const res = await get(abs);
    if (res.status === 200 && t.test(res.text)) {
      findings.push({
        kind: "open-endpoint",
        severity: t.severity,
        title: t.title,
        detail: t.detail,
        redactedLocation: abs,
      });
    }
  }
  return findings;
}
