import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify a Lemon Squeezy webhook signature — the `X-Signature` header.
 *
 * Lemon Squeezy signs the raw request body with HMAC-SHA256, keyed by the
 * webhook's own signing secret, and sends the hex digest directly — no
 * timestamp, no extra structure, unlike Paddle's `ts=…;h1=…` format. There is
 * no replay window to check here as a result; that's covered downstream by
 * the upsert being idempotent per user, same as it was for Paddle.
 *
 * This is the only thing standing between a stranger's POST and a free Pro
 * account, so it is deliberately strict: no secret, no header, or a
 * differently-sized digest all fail closed.
 *
 * Pure (crypto only), so it is unit-testable without Lemon Squeezy.
 */
export function verifyLemonSqueezySignature(
  payload: string,
  sigHeader: string | null,
  secret: string,
): boolean {
  if (!sigHeader || !secret) return false;

  const expected = createHmac("sha256", secret).update(payload, "utf8").digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  // A non-hex header yields a short/irregular buffer rather than throwing;
  // the length check below rejects it before the compare.
  const sigBuf = Buffer.from(sigHeader, "hex");

  return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
}
