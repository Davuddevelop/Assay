import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";

import { watchLimit, hasEmailAlerts, checksLimit, getPlan } from "@/lib/plans";
import { verifyPaddleSignature } from "@/lib/paddle/signature";
import { sandboxOnProduction } from "@/lib/env";

describe("sandbox billing is unreachable from production", () => {
  // Paddle's test card is public, and the sandbox webhook points at the
  // production URL so the integration can be tested end to end. If production
  // ever holds sandbox credentials, any visitor can pay with 4242 4242 4242
  // 4242 and have a real paid plan written to the real database — the
  // signature check passes, because the secret genuinely is ours.
  it("refuses the one combination that gives away free plans", () => {
    expect(sandboxOnProduction("production", "sandbox")).toBe(true);
  });

  it("leaves previews and local development alone — testing belongs there", () => {
    expect(sandboxOnProduction("preview", "sandbox")).toBe(false);
    expect(sandboxOnProduction("development", "sandbox")).toBe(false);
    expect(sandboxOnProduction(undefined, "sandbox")).toBe(false);
  });

  it("allows production once it holds live credentials", () => {
    expect(sandboxOnProduction("production", undefined)).toBe(false);
    expect(sandboxOnProduction("production", "")).toBe(false);
    expect(sandboxOnProduction("production", "live")).toBe(false);
  });

  // Only the exact string disables live mode, so a typo fails closed —
  // production stays live rather than silently dropping into test billing.
  it("treats anything other than exactly 'sandbox' as live", () => {
    for (const v of ["Sandbox", "SANDBOX", " sandbox", "sandbox "]) {
      expect(sandboxOnProduction("production", v)).toBe(false);
    }
  });
});

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

describe("verifyPaddleSignature", () => {
  const secret = "pdl_ntfset_test";
  const payload = JSON.stringify({
    event_type: "subscription.created",
    data: { id: "sub_1", status: "active" },
  });

  // Paddle signs `${ts}:${body}` and sends `ts=<unix>;h1=<hex>`.
  function sign(body: string, ts: number, key = secret): string {
    const h1 = createHmac("sha256", key).update(`${ts}:${body}`).digest("hex");
    return `ts=${ts};h1=${h1}`;
  }

  it("accepts a valid, fresh signature", () => {
    const now = 1_760_000_000_000;
    expect(
      verifyPaddleSignature(payload, sign(payload, Math.floor(now / 1000)), secret, { now }),
    ).toBe(true);
  });

  // This endpoint is public and grants paid plans, so every one of these
  // rejections is the difference between a webhook and a free Pro account.
  it("rejects a tampered payload", () => {
    const now = 1_760_000_000_000;
    const header = sign(payload, Math.floor(now / 1000));
    expect(verifyPaddleSignature(payload + "x", header, secret, { now })).toBe(false);
  });

  it("rejects the wrong secret", () => {
    const now = 1_760_000_000_000;
    const header = sign(payload, Math.floor(now / 1000), "pdl_ntfset_wrong");
    expect(verifyPaddleSignature(payload, header, secret, { now })).toBe(false);
  });

  it("rejects a stale timestamp (replay)", () => {
    const now = 1_760_000_000_000;
    const header = sign(payload, Math.floor(now / 1000) - 10_000);
    expect(verifyPaddleSignature(payload, header, secret, { now })).toBe(false);
  });

  // A signature from the future is just as much of a red flag as an old one.
  it("rejects a timestamp far ahead of now", () => {
    const now = 1_760_000_000_000;
    const header = sign(payload, Math.floor(now / 1000) + 10_000);
    expect(verifyPaddleSignature(payload, header, secret, { now })).toBe(false);
  });

  it("rejects missing header or secret", () => {
    expect(verifyPaddleSignature(payload, null, secret)).toBe(false);
    expect(verifyPaddleSignature(payload, "ts=1;h1=abc", "")).toBe(false);
  });

  it("rejects malformed headers rather than throwing", () => {
    const now = 1_760_000_000_000;
    for (const bad of ["garbage", "", "ts=;h1=", "h1=abc", "ts=abc;h1=deadbeef", ";;;"]) {
      expect(verifyPaddleSignature(payload, bad, secret, { now })).toBe(false);
    }
  });

  // Stripe's separator was `,` and Paddle's is `;` — parsing one with the
  // other's rules must fail closed, not accidentally pass.
  it("does not accept Stripe-style headers", () => {
    const now = 1_760_000_000_000;
    const ts = Math.floor(now / 1000);
    const h1 = createHmac("sha256", secret).update(`${ts}:${payload}`).digest("hex");
    expect(verifyPaddleSignature(payload, `t=${ts},v1=${h1}`, secret, { now })).toBe(false);
  });
});
