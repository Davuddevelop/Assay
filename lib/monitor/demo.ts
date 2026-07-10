import type { HistoryScan } from "@/lib/monitor/activity";

const DAY = 86_400_000;

/**
 * A seeded 2-week monitoring history that tells the whole retention story:
 * shipped at-risk → fixed → an edit reopened a hole (caught!) → fixed again.
 * Static, no database — powers the public /watch example so it always looks
 * full and demoable.
 */
export function getDemoMonitor(): { appUrl: string; nextCheckHours: number; scans: HistoryScan[] } {
  const now = Date.now();
  const at = (daysAgo: number) => new Date(now - daysAgo * DAY).toISOString();

  // oldest → newest
  const scans: HistoryScan[] = [
    { id: "h1", at: at(13), score: 34, verdict: "at_risk" },
    { id: "h2", at: at(12), score: 96, verdict: "certified" },
    { id: "h3", at: at(9), score: 96, verdict: "certified" },
    { id: "h4", at: at(6), score: 96, verdict: "certified" },
    { id: "h5", at: at(3), score: 60, verdict: "at_risk" },
    { id: "h6", at: at(2), score: 100, verdict: "certified" },
    { id: "h7", at: at(0), score: 100, verdict: "certified" },
  ];

  return { appUrl: "acme-store.lovable.app", nextCheckHours: 6, scans };
}
