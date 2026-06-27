import type { CheckRow } from "@/lib/db/types";

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
