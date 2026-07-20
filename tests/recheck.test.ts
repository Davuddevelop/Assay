import { describe, it, expect, vi } from "vitest";

// server-only throws when imported outside Next's server bundling; no-op it.
vi.mock("server-only", () => ({}));

import { findingStillPresent } from "@/lib/scan/recheck";

describe("findingStillPresent", () => {
  it("matches an exposed secret by exact title (the specific key)", () => {
    const found = [{ kind: "exposed-secret", title: "Stripe secret key exposed" }];
    expect(findingStillPresent(found, "exposed-secret", "Stripe secret key exposed")).toBe(true);
    // A different secret still present doesn't count as this one unresolved.
    expect(findingStillPresent(found, "exposed-secret", "OpenAI key exposed")).toBe(false);
  });

  it("treats a secret as resolved when it's gone", () => {
    expect(findingStillPresent([], "exposed-secret", "Stripe secret key exposed")).toBe(false);
  });

  it("matches non-secret findings by kind alone", () => {
    const found = [{ kind: "supabase-rls", title: "Anyone can read your users" }];
    // Title changed between scans, but the RLS check still fails → still present.
    expect(findingStillPresent(found, "supabase-rls", "Your database is open")).toBe(true);
  });

  it("reports resolved when the check no longer fires", () => {
    expect(findingStillPresent([], "supabase-rls", "x")).toBe(false);
    expect(findingStillPresent([], "missing-header", "x")).toBe(false);
    expect(findingStillPresent([{ kind: "supabase-storage", title: "y" }], "missing-header", "x")).toBe(false);
  });
});
