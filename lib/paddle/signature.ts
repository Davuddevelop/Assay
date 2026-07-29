import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify a Paddle webhook signature — the `Paddle-Signature` header.
 *
 * Paddle signs `${ts}:${rawBody}` with HMAC-SHA256 keyed by the notification
 * destination's secret, and sends `ts=<unix>;h1=<hex>`. We recompute, compare
 * in constant time, and reject stale timestamps so a captured request can't be
 * replayed later.
 *
 * This is the only thing standing between a stranger's POST and a free Pro
 * account, so it is deliberately strict: no secret, no header, a malformed
 * header, or an out-of-window timestamp all fail closed.
 *
 * Pure (crypto only), so it is unit-testable without Paddle. `now` and
 * `toleranceSec` are injectable for tests.
 */
export function verifyPaddleSignature(
  payload: string,
  sigHeader: string | null,
  secret: string,
  opts: { toleranceSec?: number; now?: number } = {},
): boolean {
  if (!sigHeader || !secret) return false;
  const toleranceSec = opts.toleranceSec ?? 300;
  const nowSec = Math.floor((opts.now ?? Date.now()) / 1000);

  let ts: string | null = null;
  const h1: string[] = [];
  for (const part of sigHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key === "ts") ts = value;
    else if (key === "h1" && value) h1.push(value);
  }
  if (!ts || h1.length === 0) return false;

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Math.abs(nowSec - tsNum) > toleranceSec) return false;

  const expected = createHmac("sha256", secret)
    .update(`${ts}:${payload}`, "utf8")
    .digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");

  return h1.some((sig) => {
    // A non-hex signature yields a short buffer rather than throwing; the
    // length check below rejects it before the compare.
    const sigBuf = Buffer.from(sig, "hex");
    return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
  });
}
