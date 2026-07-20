import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify a Stripe webhook signature — the `Stripe-Signature` header. Stripe
 * signs `${timestamp}.${rawBody}` with HMAC-SHA256 keyed by the endpoint's
 * signing secret, and sends `t=<ts>,v1=<sig>[,v1=<sig>...]`. We recompute and
 * timing-safe compare, and reject stale timestamps (replay protection).
 *
 * Pure (crypto only) so it's unit-testable without a live Stripe. `now` and
 * `toleranceSec` are injectable for tests.
 */
export function verifyStripeSignature(
  payload: string,
  sigHeader: string | null,
  secret: string,
  opts: { toleranceSec?: number; now?: number } = {},
): boolean {
  if (!sigHeader || !secret) return false;
  const toleranceSec = opts.toleranceSec ?? 300;
  const nowSec = Math.floor((opts.now ?? Date.now()) / 1000);

  let t: string | null = null;
  const v1: string[] = [];
  for (const part of sigHeader.split(",")) {
    const [k, v] = part.split("=");
    if (k === "t") t = v;
    else if (k === "v1" && v) v1.push(v);
  }
  if (!t || v1.length === 0) return false;

  const ts = Number(t);
  if (!Number.isFinite(ts) || Math.abs(nowSec - ts) > toleranceSec) return false;

  const expected = createHmac("sha256", secret)
    .update(`${t}.${payload}`, "utf8")
    .digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");

  return v1.some((sig) => {
    const sigBuf = Buffer.from(sig, "hex");
    return (
      sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf)
    );
  });
}
