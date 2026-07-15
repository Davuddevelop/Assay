import { compareScans, type ScanLike } from "@/lib/scan/diff";

/** One completed scan in an app's history. */
export interface HistoryScan extends ScanLike {
  id: string;
  at: string; // ISO
}

export type ActivityKind = "baseline" | "steady" | "regression" | "fixed";

/** A timeline entry — what the agent did on one check, and what it found. */
export interface ActivityEvent {
  id: string;
  at: string;
  score: number | null;
  verdict: "certified" | "at_risk" | null;
  scoreDelta: number | null;
  kind: ActivityKind;
  headline: string;
  detail: string;
}

/**
 * Turn an app's scan history into the agent's activity timeline — the story of
 * what changed over time (caught a regression, saw a fix, stayed steady). Pure,
 * so it's unit-testable. Input oldest→newest; output newest-first for display.
 */
export function buildActivity(scans: HistoryScan[]): ActivityEvent[] {
  const events = scans.map((s, i): ActivityEvent => {
    const prev = i > 0 ? scans[i - 1] : null;
    const d = compareScans(prev as ScanLike | null, s);
    const drop = Math.abs(d.scoreDelta ?? 0);
    const rise = d.scoreDelta ?? 0;

    let kind: ActivityKind;
    let headline: string;
    let detail: string;

    if (!prev) {
      kind = "baseline";
      headline = "Started watching";
      detail = "Assay ran the first check and began monitoring this app daily.";
    } else if (d.regression) {
      kind = "regression";
      headline = "A change broke something";
      detail = `Score fell ${drop} — a recent edit reopened a security hole. Flagged before your users hit it.`;
    } else if (d.improved || (prev.verdict === "at_risk" && s.verdict === "certified")) {
      kind = "fixed";
      headline = s.verdict === "certified" ? "Back to safe" : "Getting better";
      detail = `Score rose ${rise} — the issue is fixed.`;
    } else {
      kind = "steady";
      headline = "Still safe";
      detail = "Re-checked the whole app — nothing changed. You're good.";
    }

    return { id: s.id, at: s.at, score: s.score, verdict: s.verdict, scoreDelta: d.scoreDelta, kind, headline, detail };
  });

  return events.reverse();
}
