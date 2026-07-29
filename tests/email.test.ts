import { describe, it, expect } from "vitest";

import {
  regressionEmail,
  agentAlertEmail,
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

describe("agentAlertEmail", () => {
  const base = {
    subject: "Your database is readable again",
    body: "A change you shipped this morning turned the lock on your database off again.\n\nYou told me last week you'd fixed this one.",
    reportUrl: "https://assaysecurity.com/scan/abc",
  };

  it("carries the agent's own words and a link back", () => {
    const { subject, html, text } = agentAlertEmail(base);
    expect(subject).toBe(base.subject);
    expect(html).toContain("turned the lock on your database off again");
    expect(html).toContain(base.reportUrl);
    expect(text).toContain(base.reportUrl);
  });

  it("keeps paragraph breaks the agent wrote", () => {
    const { html } = agentAlertEmail(base);
    expect(html.match(/<p style=/g)?.length).toBe(2);
  });

  // The body is model-generated prose. It is never trusted as markup — an
  // angle bracket in an app name or a finding title must not become a tag.
  it("escapes the body rather than rendering it as HTML", () => {
    const { html } = agentAlertEmail({
      ...base,
      body: 'Someone can read <script>alert("x")</script> right now.',
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
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
