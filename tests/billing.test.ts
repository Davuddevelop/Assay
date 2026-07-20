import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";

import { watchLimit, hasEmailAlerts, checksLimit, getPlan } from "@/lib/plans";
import { verifyStripeSignature } from "@/lib/stripe/signature";

describe("plan gating", () => {
  it("free watches one app and gets no email alerts", () => {
    expect(watchLimit("free")).toBe(1);
    expect(hasEmailAlerts("free")).toBe(false);
  });

  it("paid plans watch unlimited apps and get email alerts", () => {
    expect(watchLimit("pro")).toBeNull();
    expect(watchLimit("team")).toBeNull();
    expect(hasEmailAlerts("pro")).toBe(true);
    expect(hasEmailAlerts("team")).toBe(true);
  });

  it("unknown plan ids fall back to free's limits", () => {
    expect(watchLimit("bogus")).toBe(1);
    expect(hasEmailAlerts("bogus")).toBe(false);
    expect(checksLimit("bogus")).toBe(getPlan("free").checksPerMonth);
  });

  it("paid tiers have higher scan allowances than free", () => {
    expect(checksLimit("pro")).toBeGreaterThan(checksLimit("free"));
    expect(checksLimit("team")).toBeGreaterThan(checksLimit("pro"));
  });
});

describe("verifyStripeSignature", () => {
  const secret = "whsec_test";
  const payload = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });

  function sign(body: string, ts: number, key = secret): string {
    const v1 = createHmac("sha256", key).update(`${ts}.${body}`).digest("hex");
    return `t=${ts},v1=${v1}`;
  }

  it("accepts a valid, fresh signature", () => {
    const now = 1_760_000_000_000;
    const header = sign(payload, Math.floor(now / 1000));
    expect(verifyStripeSignature(payload, header, secret, { now })).toBe(true);
  });

  it("rejects a tampered payload", () => {
    const now = 1_760_000_000_000;
    const header = sign(payload, Math.floor(now / 1000));
    expect(verifyStripeSignature(payload + "x", header, secret, { now })).toBe(false);
  });

  it("rejects the wrong secret", () => {
    const now = 1_760_000_000_000;
    const header = sign(payload, Math.floor(now / 1000), "whsec_wrong");
    expect(verifyStripeSignature(payload, header, secret, { now })).toBe(false);
  });

  it("rejects a stale timestamp (replay)", () => {
    const now = 1_760_000_000_000;
    const old = Math.floor(now / 1000) - 10_000;
    const header = sign(payload, old);
    expect(verifyStripeSignature(payload, header, secret, { now })).toBe(false);
  });

  it("rejects missing header or secret", () => {
    expect(verifyStripeSignature(payload, null, secret)).toBe(false);
    expect(verifyStripeSignature(payload, "t=1,v1=abc", "")).toBe(false);
  });

  it("rejects a malformed header", () => {
    expect(verifyStripeSignature(payload, "garbage", secret)).toBe(false);
  });
});
