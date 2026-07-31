import { describe, it, expect } from "vitest";

import { pickLatestByRepo, relativeTime, groupScansByApp } from "@/lib/data/derive";
import type { ScanRow } from "@/lib/db/types";

describe("pickLatestByRepo", () => {
  it("keeps the first (newest) check per repo", () => {
    const checks = [
      { repo_id: "a", id: "a2" },
      { repo_id: "b", id: "b1" },
      { repo_id: "a", id: "a1" }, // older, ignored
    ];
    const latest = pickLatestByRepo(checks);
    expect(latest.a.id).toBe("a2");
    expect(latest.b.id).toBe("b1");
  });

  it("handles an empty list", () => {
    expect(pickLatestByRepo([])).toEqual({});
  });
});

describe("relativeTime", () => {
  const now = Date.parse("2026-06-26T12:00:00Z");
  it("formats recent times", () => {
    expect(relativeTime("2026-06-26T11:59:50Z", now)).toBe("just now");
    expect(relativeTime("2026-06-26T11:30:00Z", now)).toBe("30m ago");
    expect(relativeTime("2026-06-26T09:00:00Z", now)).toBe("3h ago");
    expect(relativeTime("2026-06-24T12:00:00Z", now)).toBe("2d ago");
  });
  it("returns empty for invalid input", () => {
    expect(relativeTime("not-a-date", now)).toBe("");
  });
});

describe("groupScansByApp", () => {
  function scan(over: Partial<ScanRow> & { app_url: string; created_at: string }): ScanRow {
    return {
      id: `${over.app_url}-${over.created_at}`,
      user_id: "u1",
      platform: "lovable",
      status: "completed",
      score: 88,
      verdict: "certified",
      is_demo: false,
      error: null,
      completed_at: over.created_at,
      ...over,
    } as ScanRow;
  }

  // The reason this exists: monitoring re-checks a watched app every three
  // hours, so one app contributes eight rows a day. A flat list buries every
  // other app under identical lines within a week.
  it("collapses a repeatedly-checked app into a single row", () => {
    const scans = Array.from({ length: 50 }, (_, i) =>
      scan({ app_url: "https://a.lovable.app", created_at: `2026-07-${String(30 - (i % 28)).padStart(2, "0")}T00:00:00Z` }),
    );
    const out = groupScansByApp(scans);
    expect(out).toHaveLength(1);
    expect(out[0].checks).toBe(50);
  });

  it("keeps the newest scan as the app's current state", () => {
    const out = groupScansByApp([
      scan({ app_url: "https://a.app", created_at: "2026-07-30T00:00:00Z", score: 91 }),
      scan({ app_url: "https://a.app", created_at: "2026-07-01T00:00:00Z", score: 60 }),
    ]);
    expect(out[0].latest.score).toBe(91);
  });

  // Movement is the only thing a repeated check tells you that one can't.
  it("reports the score change against the previous completed check", () => {
    const out = groupScansByApp([
      scan({ app_url: "https://a.app", created_at: "2026-07-30T00:00:00Z", score: 91 }),
      scan({ app_url: "https://a.app", created_at: "2026-07-01T00:00:00Z", score: 60 }),
    ]);
    expect(out[0].scoreDelta).toBe(31);
  });

  it("has no delta for an app checked only once", () => {
    const out = groupScansByApp([scan({ app_url: "https://a.app", created_at: "2026-07-30T00:00:00Z" })]);
    expect(out[0].scoreDelta).toBeNull();
  });

  // A pending or failed scan has no score to compare, and must not be mistaken
  // for a completed one when working out where an app stands.
  it("ignores incomplete scans when computing the delta", () => {
    const out = groupScansByApp([
      scan({ app_url: "https://a.app", created_at: "2026-07-31T00:00:00Z", status: "running", score: null }),
      scan({ app_url: "https://a.app", created_at: "2026-07-30T00:00:00Z", score: 91 }),
      scan({ app_url: "https://a.app", created_at: "2026-07-01T00:00:00Z", score: 60 }),
    ]);
    expect(out[0].latest.status).toBe("running");
    expect(out[0].scoreDelta).toBe(31);
  });

  it("puts apps needing attention above passing ones", () => {
    const out = groupScansByApp([
      scan({ app_url: "https://ok.app", created_at: "2026-07-31T00:00:00Z" }),
      scan({ app_url: "https://bad.app", created_at: "2026-07-20T00:00:00Z", verdict: "at_risk" }),
    ]);
    expect(out.map((a) => a.appUrl)).toEqual(["https://bad.app", "https://ok.app"]);
  });

  it("orders most-recently-checked first within the same state", () => {
    const out = groupScansByApp([
      scan({ app_url: "https://new.app", created_at: "2026-07-31T00:00:00Z" }),
      scan({ app_url: "https://old.app", created_at: "2026-07-02T00:00:00Z" }),
    ]);
    expect(out.map((a) => a.appUrl)).toEqual(["https://new.app", "https://old.app"]);
  });

  it("returns nothing for no scans", () => {
    expect(groupScansByApp([])).toEqual([]);
  });
});
