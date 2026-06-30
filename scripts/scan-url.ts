/**
 * Run Assay's real detection against a live app URL, from any machine with
 * internet (the hosted product is server-only; this is a standalone proof CLI):
 *
 *   npx tsx scripts/scan-url.ts https://your-app.lovable.app
 *
 * It mirrors lib/scan/run.ts but does its own fetching, so it doesn't pull in
 * the server-only network modules. The DETECTION brains are the exact same pure
 * modules the product uses (bundles, supabase-detect, patterns, headers, score).
 * Only scan apps you own.
 */
import { discoverBundleUrls, discoverChunkRefs } from "@/lib/scan/bundles";
import {
  detectSupabase,
  decodeJwtRole,
  tablesFromOpenApi,
  isExposedResponse,
  type SupabaseRef,
} from "@/lib/scan/supabase-detect";
import { scanText } from "@/lib/scan/patterns";
import { checkHeaders } from "@/lib/scan/headers";
import { scoreFindings } from "@/lib/scan/score";
import type { RawFinding } from "@/lib/scan/types";

/** Best-effort builder detection (mirrors lib/scan/run.ts, kept inline so this
 * CLI doesn't import the server-only network modules). */
function detectPlatform(html: string): string {
  const h = html.toLowerCase();
  if (h.includes("gptengineer") || h.includes("lovable")) return "lovable";
  if (h.includes("bolt.new") || h.includes("stackblitz")) return "bolt";
  if (h.includes("replit")) return "replit";
  if (h.includes("v0.dev") || h.includes("v0.app")) return "v0";
  return "unknown";
}

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  red: "\x1b[31m", yellow: "\x1b[33m", green: "\x1b[32m",
};
const sevColor: Record<string, string> = { critical: C.red, risky: C.yellow, minor: C.dim };
const MAX_BUNDLES = 12;
const MAX_TABLES = 8;

async function getText(url: string): Promise<{ text: string; headers: Record<string, string>; status: number }> {
  const res = await fetch(url, { redirect: "follow", headers: { "user-agent": "AssayScanner/1.0" } });
  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => (headers[k] = v));
  return { text: await res.text(), headers, status: res.status };
}

async function getJson(url: string, key: string): Promise<{ status: number; body: unknown }> {
  const res = await fetch(url, { headers: { apikey: key, authorization: `Bearer ${key}` } });
  let body: unknown = null;
  try { body = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, body };
}

/** Fetch HTML + crawl the JS chunks the app ships (script/modulepreload + nested). */
async function fetchApp(url: string) {
  const main = await getText(url);
  const bundles: { url: string; content: string }[] = [];
  const seen = new Set<string>();
  const queue = discoverBundleUrls(main.text)
    .map((s) => { try { return new URL(s, url).toString(); } catch { return null; } })
    .filter((u): u is string => !!u);

  while (queue.length && bundles.length < MAX_BUNDLES) {
    const abs = queue.shift()!;
    if (seen.has(abs)) continue;
    seen.add(abs);
    try {
      const b = await getText(abs);
      bundles.push({ url: abs, content: b.text });
      for (const ref of discoverChunkRefs(b.text)) {
        try {
          const r = new URL(ref, abs);
          if (r.origin === new URL(url).origin) queue.push(r.toString());
        } catch { /* skip */ }
      }
    } catch { /* unreachable bundle */ }
  }
  return { html: main.text, headers: main.headers, bundles };
}

/** Read-only RLS probe: which tables return rows to an unauthenticated request. */
async function probe(ref: SupabaseRef): Promise<RawFinding[]> {
  if (decodeJwtRole(ref.anonKey) === "service_role") {
    return [{
      kind: "supabase-rls", severity: "critical",
      title: "Supabase service key exposed in the browser",
      detail: "The service_role key is in client code. It bypasses ALL security rules.",
      redactedLocation: `${ref.url} (service_role key)`,
    }];
  }
  const root = await getJson(`${ref.url}/rest/v1/`, ref.anonKey);
  const tables = tablesFromOpenApi(root.body).slice(0, MAX_TABLES);
  const exposed: string[] = [];
  for (const t of tables) {
    const res = await getJson(`${ref.url}/rest/v1/${encodeURIComponent(t)}?select=*&limit=1`, ref.anonKey);
    if (isExposedResponse(res.status, res.body)) exposed.push(t);
  }
  if (!exposed.length) return [];
  return [{
    kind: "supabase-rls", severity: "critical",
    title: "Your database is readable by anyone",
    detail: `Row-Level Security is off or misconfigured: ${exposed.length} table(s) returned data to an unauthenticated request (${exposed.join(", ")}).`,
    redactedLocation: `${ref.url} — tables: ${exposed.join(", ")}`,
  }];
}

async function main() {
  const url = process.argv[2];
  if (!url) { console.error("Usage: npx tsx scripts/scan-url.ts <app-url>"); process.exit(1); }

  console.log(`${C.bold}Assay — scanning ${url}${C.reset}\n`);
  const t0 = Date.now();
  const app = await fetchApp(url);

  const findings: RawFinding[] = [];
  findings.push(...scanText(app.html, "page HTML"));
  for (const b of app.bundles) findings.push(...scanText(b.content, `bundle ${b.url.split("/").pop()}`));
  const ref = detectSupabase([app.html, ...app.bundles.map((b) => b.content)].join("\n"));
  if (ref) findings.push(...(await probe(ref)));
  findings.push(...checkHeaders(app.headers));

  const { score, verdict } = scoreFindings(findings);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  console.log(`Platform: ${C.bold}${detectPlatform(app.html)}${C.reset}   Bundles fetched: ${C.bold}${app.bundles.length}${C.reset}   Supabase: ${C.bold}${ref ? "found" : "not found"}${C.reset}`);
  const vc = verdict === "certified" ? C.green : C.red;
  console.log(`Verdict: ${vc}${C.bold}${verdict.toUpperCase()}${C.reset}   Score: ${C.bold}${score}/100${C.reset}   ${C.dim}(${secs}s)${C.reset}\n`);

  if (!findings.length) { console.log(`${C.green}No issues found.${C.reset}`); return; }
  console.log(`${C.bold}${findings.length} finding(s):${C.reset}\n`);
  for (const f of findings) {
    const c = sevColor[f.severity] ?? C.reset;
    console.log(`${c}● ${f.severity.toUpperCase()}${C.reset}  ${C.bold}${f.title}${C.reset}`);
    console.log(`   ${f.detail}`);
    if (f.redactedLocation) console.log(`   ${C.dim}${f.redactedLocation}${C.reset}`);
    console.log();
  }
}

main().catch((err) => {
  console.error(`${C.red}Scan failed:${C.reset}`, err instanceof Error ? err.message : err);
  process.exit(1);
});
