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

/** Run every check against a fetched app and score the result. */
export async function runScan(appUrl: string): Promise<ScanResult> {
  const app = await fetchApp(appUrl);

  const findings: RawFinding[] = [];

  // 1. Exposed secrets in client code (HTML + each bundle).
  findings.push(...scanText(app.html, "page HTML"));
  for (const b of app.bundles) {
    findings.push(...scanText(b.content, shortBundleName(b.url)));
  }

  // 2. Supabase RLS + Storage exposure (detection + read-only probes). Never
  //    let a probe failure sink the whole scan — the other findings still stand.
  const allText = [app.html, ...app.bundles.map((b) => b.content)].join("\n");
  const ref = detectSupabase(allText);
  if (ref) {
    try {
      findings.push(...(await probeSupabaseRls(ref)));
    } catch {
      /* probe unavailable — report what the other checks found */
    }
    try {
      findings.push(...(await probeSupabaseStorage(ref)));
    } catch {
      /* probe unavailable — report what the other checks found */
    }
  }

  // 3. Missing security headers.
  findings.push(...checkHeaders(app.headers));

  // 4. Sensitive files served at the origin (.env, .git). Never sinks the scan.
  try {
    const origin = new URL(app.finalUrl).origin;
    findings.push(...(await probeExposedFiles(origin)));
  } catch {
    /* file probe unavailable */
  }

  // 5. Source maps — original source code is downloadable (advisory).
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

  return { platform: detectPlatform(app.html), findings: deduped, score, verdict };
}
