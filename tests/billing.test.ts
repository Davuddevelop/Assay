import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";

import {
  watchLimit,
  hasRegressionAlerts,
  hasWeeklyDigest,
  checksLimit,
  getPlan,
} from "@/lib/plans";
import { verifyLemonSqueezySignature } from "@/lib/lemonsqueezy/signature";
import { lemonSqueezyTestModeOnProduction, lemonSqueezyTestEventOnProduction } from "@/lib/env";

describe("test-mode billing is unreachable from production", () => {
  // This app's own LEMONSQUEEZY_TEST_MODE switch must never let production
  // open a test checkout — there is no legitimate reason for the live site to
  // create one.
  it("refuses to open a test checkout from production", () => {
    expect(lemonSqueezyTestModeOnProduction("production", "true")).toBe(true);
  });

  it("leaves previews and local development alone — testing belongs there", () => {
    expect(lemonSqueezyTestModeOnProduction("preview", "true")).toBe(false);
    expect(lemonSqueezyTestModeOnProduction("development", "true")).toBe(false);
    expect(lemonSqueezyTestModeOnProduction(undefined, "true")).toBe(false);
  });

  it("allows production once the switch is off", () => {
    expect(lemonSqueezyTestModeOnProduction("production", undefined)).toBe(false);
    expect(lemonSqueezyTestModeOnProduction("production", "")).toBe(false);
    expect(lemonSqueezyTestModeOnProduction("production", "false")).toBe(false);
  });

  // The other direction: a genuinely-signed webhook whose event itself claims
  // test mode (the store's own dashboard toggle, not this app's env var) must
  // not be allowed to grant a real plan in production either.
  it("refuses a test-mode webhook event in production", () => {
    expect(lemonSqueezyTestEventOnProduction("production", true)).toBe(true);
  });

  it("allows a live-mode webhook event in production", () => {
    expect(lemonSqueezyTestEventOnProduction("production", false)).toBe(false);
  });

  it("allows a test-mode webhook event outside production", () => {
    expect(lemonSqueezyTestEventOnProduction("preview", true)).toBe(false);
    expect(lemonSqueezyTestEventOnProduction(undefined, true)).toBe(false);
  });
});

describe("plan gating", () => {
  // Free gets the regression email on purpose. It is the only event that can
  // bring a non-coder back, it costs one message and only when something
  // actually broke, and being emailed the day your app breaks is the best
  // moment this product will ever have to earn a subscription. Paywalling it
  // meant a free watcher was told only on a dashboard they never revisited.
  it("every plan emails the owner when a watched app regresses", () => {
    expect(hasRegressionAlerts("free")).toBe(true);
    expect(hasRegressionAlerts("pro")).toBe(true);
    expect(hasRegressionAlerts("team")).toBe(true);
  });

  it("the weekly digest stays paid — it is the habit, not the emergency", () => {
    expect(hasWeeklyDigest("free")).toBe(false);
    expect(hasWeeklyDigest("pro")).toBe(true);
    expect(hasWeeklyDigest("team")).toBe(true);
  });

  it("free watches one app; paid plans watch unlimited", () => {
    expect(watchLimit("free")).toBe(1);
    expect(watchLimit("pro")).toBeNull();
    expect(watchLimit("team")).toBeNull();
  });

  it("unknown plan ids fall back to free's limits", () => {
    expect(watchLimit("bogus")).toBe(1);
    expect(hasWeeklyDigest("bogus")).toBe(false);
    expect(checksLimit("bogus")).toBe(getPlan("free").checksPerMonth);
  });

  it("paid tiers have higher scan allowances than free", () => {
    expect(checksLimit("pro")).toBeGreaterThan(checksLimit("free"));
    expect(checksLimit("team")).toBeGreaterThan(checksLimit("pro"));
  });
});

describe("verifyLemonSqueezySignature", () => {
  const secret = "ls_whsec_test";
  const payload = JSON.stringify({
    meta: { event_name: "subscription_created", test_mode: false },
    data: { id: "sub_1", attributes: { status: "active" } },
  });

  function sign(body: string, key = secret): string {
    return createHmac("sha256", key).update(body, "utf8").digest("hex");
  }

  it("accepts a valid signature", () => {
    expect(verifyLemonSqueezySignature(payload, sign(payload), secret)).toBe(true);
  });

  // This endpoint is public and grants paid plans, so every one of these
  // rejections is the difference between a webhook and a free Pro account.
  it("rejects a tampered payload", () => {
    const header = sign(payload);
    expect(verifyLemonSqueezySignature(payload + "x", header, secret)).toBe(false);
  });

  it("rejects the wrong secret", () => {
    const header = sign(payload, "ls_whsec_wrong");
    expect(verifyLemonSqueezySignature(payload, header, secret)).toBe(false);
  });

  it("rejects missing header or secret", () => {
    expect(verifyLemonSqueezySignature(payload, null, secret)).toBe(false);
    expect(verifyLemonSqueezySignature(payload, "abc123", "")).toBe(false);
  });

  it("rejects malformed headers rather than throwing", () => {
    for (const bad of ["garbage", "", "not-hex-zzz", ";;;"]) {
      expect(verifyLemonSqueezySignature(payload, bad, secret)).toBe(false);
    }
  });

  // Paddle's header packs a timestamp and a labelled hex digest (`ts=…;h1=…`);
  // Lemon Squeezy's is the bare hex digest. Parsing one with the other's
  // shape must fail closed, not accidentally pass.
  it("does not accept a Paddle-style header", () => {
    const h1 = createHmac("sha256", secret).update(`0:${payload}`).digest("hex");
    expect(verifyLemonSqueezySignature(payload, `ts=0;h1=${h1}`, secret)).toBe(false);
  });
});
