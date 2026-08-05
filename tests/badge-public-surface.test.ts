import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * The public badge page is the one surface where a stranger learns something
 * about someone else's app. Its whole value depends on being able to say "this
 * mark is no longer valid" — and the moment it says that, it must not also say
 * *why*, because a public URL enumerating a live app's weaknesses is a map for
 * an attacker.
 *
 * The real guarantee is structural: `BadgeReport` has no field for a finding,
 * so the page cannot render one even by mistake. These tests pin that shape in
 * place, because the failure mode is someone adding the field back "just to
 * show severity counts" and nobody noticing until it's indexed.
 *
 * Source-level assertions rather than rendering: the page is an async React
 * Server Component reaching for the service role, and standing this up in a
 * unit test would test the mock. What must never drift is the contract, and
 * the contract is visible in the source.
 */
const root = process.cwd();
const scansSrc = readFileSync(resolve(root, "lib/data/scans.ts"), "utf8");
const pageSrc = readFileSync(
  resolve(root, "app/(marketing)/badge/[token]/page.tsx"),
  "utf8",
);

function badgeReportInterface(): string {
  const start = scansSrc.indexOf("export interface BadgeReport {");
  expect(start).toBeGreaterThan(-1);
  return scansSrc.slice(start, scansSrc.indexOf("}", start));
}

function getBadgeReportBody(): string {
  const start = scansSrc.indexOf("export async function getBadgeReport");
  expect(start).toBeGreaterThan(-1);
  return scansSrc.slice(start, scansSrc.indexOf("\n}", start));
}

describe("badge public surface — nothing that helps an attacker", () => {
  it("BadgeReport carries no finding detail at all", () => {
    const iface = badgeReportInterface();
    for (const forbidden of [
      "findings",
      "title",
      "severity",
      "critical",
      "risky",
      "minor",
      "redacted",
      "fix_prompt",
      "manual_steps",
    ]) {
      expect(iface.toLowerCase()).not.toContain(forbidden);
    }
  });

  it("never queries the findings table", () => {
    const body = getBadgeReportBody();
    expect(body).not.toContain("scan_findings");
  });

  it("does not expose the owner", () => {
    const iface = badgeReportInterface();
    expect(iface).not.toContain("user_id");
    expect(iface).not.toContain("email");
  });

  it("the page renders no finding fields", () => {
    expect(pageSrc).not.toContain("report.findings");
    expect(pageSrc).not.toContain(".severity");
  });

  // The failure copy is the whole point: it has to be sayable in public.
  it("says the mark is invalid without saying what is wrong", () => {
    expect(pageSrc).toContain("This mark is no longer valid.");
    expect(pageSrc).toContain("The details go to the owner, not here.");
  });
});

describe("badge live resolution", () => {
  it("resolves the latest completed scan, not the minted one", () => {
    const body = getBadgeReportBody();
    // Ordering newest-first over completed scans is what makes the mark live.
    expect(body).toContain('.eq("status", "completed")');
    expect(body).toContain('.order("completed_at", { ascending: false })');
  });

  it("scopes live resolution to the badge owner", () => {
    // Without the owner scope a stranger scanning the same URL could move
    // someone else's public mark.
    const body = getBadgeReportBody();
    expect(body).toContain('.eq("user_id"');
    expect(body).toContain("const owned = struck.user_id !== null");
  });

  it("reports whether the app is actually being re-checked", () => {
    expect(badgeReportInterface()).toContain("watched");
    expect(getBadgeReportBody()).toContain("monitored_apps");
    // A mark may only claim continuous verification when something re-checks it.
    expect(pageSrc).toContain("report.watched");
    expect(pageSrc).toContain("point-in-time check");
  });
});
