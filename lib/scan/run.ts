import "server-only";

import { fetchApp } from "@/lib/scan/fetch";
import { scanText } from "@/lib/scan/patterns";
import { checkHeaders } from "@/lib/scan/headers";
import { detectSupabase, probeSupabaseRls } from "@/lib/scan/supabase-rls";
import { probeSupabaseStorage } from "@/lib/scan/storage";
import { probeExposedFiles } from "@/lib/scan/exposed-files";
import { hasSourceMapRef } from "@/lib/scan/bundles";
import { scoreFindings } from "@/lib/scan/score";
import type { RawFinding } from "@/lib/scan/types";
import type { ScanVerdict } from "@/lib/db/types";

/** Best-effort detection of the builder a vibe-coded app came from. Pure. */
function detectPlatform(html: string): string {
  const h = html.toLowerCase();
  if (h.includes("gptengineer") || h.includes("lovable")) return "lovable";
  if (h.includes("bolt.new") || h.includes("stackblitz")) return "bolt";
  if (h.includes("replit")) return "replit";
  if (h.includes("v0.dev") || h.includes("v0.app")) return "v0";
  return "unknown";
}

function shortBundleName(url: string): string {
  try {
    return `bundle ${new URL(url).pathname.split("/").pop() ?? url}`;
  } catch {
    return "bundle";
  }
}

/** De-duplicate findings by kind + title (same secret can appear in many files). */
function dedupe(findings: RawFinding[]): RawFinding[] {
  const seen = new Set<string>();
  return findings.filter((f) => {
    const key = `${f.kind}:${f.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export interface ScanResult {
  platform: string;
  findings: RawFinding[];
  score: number;
  verdict: ScanVerdict;
}

/** Progress line emitted as the scan works — powers the live feed. */
export type OnProgress = (line: string) => void;

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/** Run every check against a fetched app and score the result. */
export async function runScan(appUrl: string, onProgress?: OnProgress): Promise<ScanResult> {
  const say = (l: string) => onProgress?.(l);

  say(`Fetching ${hostOf(appUrl)} — read-only, exactly like a browser…`);
  const app = await fetchApp(appUrl);
  say(
    `Read the page and ${app.bundles.length} code bundle${app.bundles.length === 1 ? "" : "s"} into memory. Nothing saved.`,
  );

  const findings: RawFinding[] = [];

  // 1. Exposed secrets in client code (HTML + each bundle).
  say("Scanning the code your app already ships to browsers…");
  findings.push(...scanText(app.html, "page HTML"));
  for (const b of app.bundles) {
    findings.push(...scanText(b.content, shortBundleName(b.url)));
  }
  const secretCount = findings.length;
  say(
    secretCount > 0
      ? `⚠ Found ${secretCount} exposed secret${secretCount === 1 ? "" : "s"} — recording where, never the value itself.`
      : "No exposed secrets in the code.",
  );

  // 2–4. Supabase RLS, Supabase Storage, and exposed-files are three
  //      independent network probes — run them concurrently instead of one
  //      after another, or their individual time budgets simply add up and
  //      the whole scan can blow past the platform's function timeout. Each
  //      is already self-bounded and never throws; `.catch` is a second
  //      safety net so one failing can't take the others down with it.
  const allText = [app.html, ...app.bundles.map((b) => b.content)].join("\n");
  const ref = detectSupabase(allText);
  const origin = new URL(app.finalUrl).origin;

  say(
    ref
      ? "Detected Supabase — one bounded read to check your database is closed, not to read your data…"
      : "Checking for publicly exposed files and endpoints…",
  );

  const [rlsFindings, storageFindings, exposedFileFindings] = await Promise.all([
    ref ? probeSupabaseRls(ref).catch(() => []) : Promise.resolve([]),
    ref ? probeSupabaseStorage(ref).catch(() => []) : Promise.resolve([]),
    probeExposedFiles(origin).catch(() => []),
  ]);
  if (rlsFindings.length > 0) say("⚠ Your database is readable without a login.");
  if (storageFindings.length > 0) say("⚠ Your file storage is open to anyone.");
  if (exposedFileFindings.length > 0) say("⚠ Sensitive files are served publicly.");
  if (ref && rlsFindings.length === 0 && storageFindings.length === 0) say("Database and storage look locked down.");
  findings.push(...rlsFindings, ...storageFindings, ...exposedFileFindings);

  // 5. Missing security headers.
  say("Checking security headers…");
  findings.push(...checkHeaders(app.headers));

  // 6. Source maps — original source code is downloadable (advisory).
  if (app.bundles.some((b) => hasSourceMapRef(b.content))) {
    findings.push({
      kind: "open-endpoint",
      severity: "minor",
      title: "Your source code is downloadable",
      detail:
        "Your app ships source maps, so anyone can reconstruct your original code from the browser. Fine for many apps, but strip them if your logic is sensitive.",
      redactedLocation: "client bundles (sourceMappingURL)",
    });
  }

  const deduped = dedupe(findings);
  const { score, verdict } = scoreFindings(deduped);
  say("Scoring the results…");

  return { platform: detectPlatform(app.html), findings: deduped, score, verdict };
}
