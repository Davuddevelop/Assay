import "server-only";

import { paddleConfig } from "@/lib/env";
import { log } from "@/lib/log";

/**
 * Paddle's webhook source addresses, as defence in depth on top of the
 * signature check.
 *
 * The signature is the real control: without the notification secret nobody can
 * forge a delivery, and that is verified on every request. This adds the second
 * question — did it also come from Paddle's network — which only matters in the
 * one scenario the signature can't cover, a leaked secret.
 *
 * The list is fetched rather than hard-coded because Paddle publish it as the
 * source of truth and it changes. It is cached in module memory, which on
 * serverless means roughly one fetch per cold start.
 *
 * Failure policy, deliberately: if the list has never been fetched
 * successfully, requests are allowed through on the signature alone. An
 * allowlist that can't load must not be the reason a paying customer silently
 * fails to get their plan — that failure is invisible to them and to us, and
 * strictly worse than the narrow risk it would be guarding against. Once a list
 * has loaded, it is enforced, and a stale cached list keeps being enforced
 * rather than falling open.
 */

const IPS_URL = "https://api.paddle.com/ips";
const SANDBOX_IPS_URL = "https://sandbox-api.paddle.com/ips";
/** Long enough to be a non-event per request, short enough to pick up a change. */
const TTL_MS = 60 * 60 * 1000;

let cache: { ips: Set<string>; fetchedAt: number } | null = null;
let inflight: Promise<void> | null = null;

async function refresh(): Promise<void> {
  const cfg = paddleConfig();
  const url = cfg?.apiBase === "https://sandbox-api.paddle.com" ? SANDBOX_IPS_URL : IPS_URL;
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { data?: { ipv4_cidrs?: unknown } };
    const cidrs = json.data?.ipv4_cidrs;
    if (!Array.isArray(cidrs) || cidrs.length === 0) throw new Error("no cidrs");

    // Paddle publish these as /32s — one address each — so the block is the
    // address. Anything with a real prefix length is skipped rather than
    // half-parsed into a range check that was never needed.
    const ips = new Set<string>();
    for (const entry of cidrs) {
      if (typeof entry !== "string") continue;
      const [addr, prefix] = entry.split("/");
      if (!addr) continue;
      if (prefix === undefined || prefix === "32") ips.add(addr);
    }
    if (ips.size === 0) throw new Error("no usable addresses");

    cache = { ips, fetchedAt: Date.now() };
  } catch (err) {
    log.warn("paddle ip list refresh failed", {
      reason: err instanceof Error ? err.message : "unknown",
      havePrevious: cache !== null,
    });
  }
}

/**
 * Is this address allowed to deliver a webhook?
 *
 * Returns true when the list is unavailable — see the failure policy above.
 * The caller must still verify the signature; this is never the only check.
 */
export async function isPaddleWebhookIp(ip: string | null): Promise<boolean> {
  if (!cache || Date.now() - cache.fetchedAt > TTL_MS) {
    // Collapse concurrent refreshes so a burst of deliveries triggers one fetch.
    inflight ??= refresh().finally(() => {
      inflight = null;
    });
    await inflight;
  }

  if (!cache) return true; // Never loaded — signature alone.
  if (!ip) return false; // We have a list, so an unknown origin is not on it.
  return cache.ips.has(ip);
}
