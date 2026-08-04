import type { CheckRow, ScanRow } from "@/lib/db/types";

/** One app on the dashboard: its current state, plus how it got there. */
export interface AppSummary {
  appUrl: string;
  /** The most recent scan of this app, whatever its status. */
  latest: ScanRow;
  /** How many times this app has been checked. */
  checks: number;
  /** Score change against the previous completed check, or null if it's the first. */
  scoreDelta: number | null;
}

/**
 * Collapse a flat scan history into one row per app.
 *
 * The dashboard used to list every scan. That reads fine with three manual
 * scans and falls apart the moment monitoring is switched on: a watched app is
 * re-checked every three hours, so it contributes eight rows a day, forever.
 * A week of watching one app buries everything else under fifty identical
 * lines — same URL, same score, same verdict. No amount of styling fixes that,
 * because the rows genuinely are identical; the list was answering "what has
 * happened" when the question is "where do my apps stand".
 *
 * Ordering is worst-first: anything not currently passing comes before
 * anything that is, and within each group the most recently checked leads.
 * The same triage order the agent uses when reasoning across a portfolio.
 *
 * Pure. Expects scans newest-first, as the query returns them.
 */
export function groupScansByApp(scansNewestFirst: readonly ScanRow[]): AppSummary[] {
  const byUrl = new Map<string, ScanRow[]>();
  for (const scan of scansNewestFirst) {
    const list = byUrl.get(scan.app_url);
    if (list) list.push(scan);
    else byUrl.set(scan.app_url, [scan]);
  }

  const summaries: AppSummary[] = [];
  for (const [appUrl, scans] of byUrl) {
    const completed = scans.filter((s) => s.status === "completed" && s.score !== null);
    const [current, previous] = completed;
    summaries.push({
      appUrl,
      latest: scans[0],
      checks: scans.length,
      scoreDelta:
        current && previous && current.score !== null && previous.score !== null
          ? current.score - previous.score
          : null,
    });
  }

  return summaries.sort((a, b) => {
    const aOk = a.latest.verdict === "certified" ? 1 : 0;
    const bOk = b.latest.verdict === "certified" ? 1 : 0;
    if (aOk !== bOk) return aOk - bOk;
    return (
      new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime()
    );
  });
}

/**
 * Given checks ordered newest-first, return the latest check per repo id.
 * Pure — the dashboard uses it to badge each repo with its current verdict.
 */
export function pickLatestByRepo<T extends Pick<CheckRow, "repo_id">>(
  checksNewestFirst: readonly T[],
): Record<string, T> {
  const out: Record<string, T> = {};
  for (const c of checksNewestFirst) {
    if (!(c.repo_id in out)) out[c.repo_id] = c;
  }
  return out;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Absolute check date for a report, e.g. "4 August 2026".
 *
 * Deliberately UTC and hand-formatted rather than `toLocaleDateString`. The
 * report renders on the server for /sample and /scan/[id] but on the client
 * for the live /try scan, and a locale- or timezone-dependent string would
 * differ between the two and trip a hydration mismatch. A report is also a
 * document someone hands to a client — it should read the same to both of them
 * regardless of where either one is sitting.
 *
 * Returns "" for a missing or unparseable timestamp so callers can omit the
 * line rather than print "Invalid Date" on a deliverable.
 */
export function formatReportDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Compact relative time, e.g. "just now", "3h ago", "2d ago". */
export function relativeTime(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const s = Math.max(0, Math.round((now - then) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.round(mo / 12)}y ago`;
}
