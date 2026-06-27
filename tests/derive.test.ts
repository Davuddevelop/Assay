import { describe, it, expect } from "vitest";

import { pickLatestByRepo, relativeTime } from "@/lib/data/derive";

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
