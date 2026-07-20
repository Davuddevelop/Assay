import { describe, it, expect } from "vitest";

import {
  regressionEmail,
  weeklyDigestEmail,
} from "@/lib/email/templates";

describe("regressionEmail", () => {
  const base = {
    appUrl: "https://myapp.lovable.app",
    score: 62,
    prevScore: 90,
    scoreDelta: -28,
    topFindings: [
      { title: "Your database is open to the public", severity: "critical" },
      { title: "Your API key is in the browser", severity: "risky" },
    ],
    reportUrl: "https://assay.dev/scan/abc",
  };

  it("names the app host in the subject and body", () => {
    const { subject, html, text } = regressionEmail(base);
    expect(subject).toContain("myapp.lovable.app");
    expect(html).toContain("myapp.lovable.app");
    expect(text).toContain("myapp.lovable.app");
  });

  it("reports the score drop and links to the report", () => {
    const { html, text } = regressionEmail(base);
    expect(html).toContain("28"); // delta magnitude
    expect(html).toContain("90"); // prev → new shown
    expect(html).toContain("https://assay.dev/scan/abc");
    expect(text).toContain("https://assay.dev/scan/abc");
  });

  it("lists the top findings", () => {
    const { html } = regressionEmail(base);
    expect(html).toContain("Your database is open to the public");
    expect(html).toContain("critical");
  });

  it("escapes HTML in finding titles (no injection)", () => {
    const { html } = regressionEmail({
      ...base,
      topFindings: [{ title: "<script>x</script>", severity: "critical" }],
    });
    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("handles a verdict flip with no score delta", () => {
    const { html } = regressionEmail({
      ...base,
      score: null,
      prevScore: null,
      scoreDelta: null,
    });
    expect(html).toContain("flagged at risk");
  });
});

describe("weeklyDigestEmail", () => {
  it("says all safe when nothing is at risk", () => {
    const { subject, html } = weeklyDigestEmail({
      apps: [
        { appUrl: "https://a.lovable.app", status: "certified", changed: 0 },
        { appUrl: "https://b.lovable.app", status: "certified", changed: 2 },
      ],
      dashboardUrl: "https://assay.dev/dashboard",
    });
    expect(subject).toContain("still safe");
    expect(html).toContain("All 2 apps still safe");
    expect(html).toContain("a.lovable.app");
    expect(html).toContain("2 changes this week");
  });

  it("flags apps needing attention", () => {
    const { subject, html } = weeklyDigestEmail({
      apps: [
        { appUrl: "https://a.lovable.app", status: "at_risk", changed: 1 },
        { appUrl: "https://b.lovable.app", status: "certified", changed: 0 },
      ],
      dashboardUrl: "https://assay.dev/dashboard",
    });
    expect(subject).toContain("need");
    expect(html).toContain("1 of your apps need attention");
    expect(html).toContain("At risk");
  });
});
