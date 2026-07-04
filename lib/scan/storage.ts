import "server-only";

import type { RawFinding } from "@/lib/scan/types";
import { assertScannableUrl } from "@/lib/scan/fetch";
import { isExposedBucketListing, type SupabaseRef } from "@/lib/scan/supabase-detect";

/**
 * The Storage-layer twin of the RLS check: a Supabase bucket whose objects can
 * be LISTED with just the anon key. A bucket meant to hold user uploads
 * (avatars, ID scans, invoices) that anyone on the internet can browse is one
 * of the most common vibe-coding leaks — the app "just worked" in testing
 * because the developer never tried it logged out.
 *
 * Detection + a single bounded, READ-ONLY list call per bucket. We record only
 * the bucket name and how many objects came back — never a filename, never
 * file contents, never a write.
 */
const PROBE_TIMEOUT_MS = 6_000;
const MAX_BUCKETS = 6;
const PROBE_BUDGET_MS = 15_000;
// Tried when we can't enumerate buckets — common vibe-coded bucket names.
const COMMON_BUCKETS = ["avatars", "uploads", "public", "images", "documents", "files"];

interface ListResult {
  status: number;
  count: number;
}

/** List a bucket's objects. Never throws — network/timeout errors read as "empty". */
async function listBucket(url: string, anonKey: string, bucket: string): Promise<ListResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`${url}/storage/v1/object/list/${encodeURIComponent(bucket)}`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${anonKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ prefix: "", limit: 100 }),
    });
    if (res.status !== 200) return { status: res.status, count: 0 };
    const body: unknown = await res.json().catch(() => null);
    return { status: 200, count: Array.isArray(body) ? body.length : 0 };
  } catch {
    return { status: 0, count: 0 };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Probe whether any storage bucket is listable unauthenticated. `ref.url` must
 * already be confirmed scannable by the caller; we re-guard it.
 */
export async function probeSupabaseStorage(ref: SupabaseRef): Promise<RawFinding[]> {
  const findings: RawFinding[] = [];

  try {
    await assertScannableUrl(ref.url);
  } catch {
    return findings;
  }

  const exposed: { bucket: string; count: number }[] = [];
  try {
    const deadline = Date.now() + PROBE_BUDGET_MS;
    for (const bucket of COMMON_BUCKETS.slice(0, MAX_BUCKETS)) {
      if (Date.now() > deadline) break; // out of budget — report what we found
      const { status, count } = await listBucket(ref.url, ref.anonKey, bucket);
      if (isExposedBucketListing(status, count)) exposed.push({ bucket, count });
    }
  } catch {
    // A probe failure must never sink the scan — return whatever we confirmed.
    return findings;
  }

  if (exposed.length > 0) {
    const names = exposed.map((e) => e.bucket).join(", ");
    findings.push({
      kind: "supabase-storage",
      severity: "risky",
      title: "Anyone can browse your file storage",
      detail: `${exposed.length} storage bucket(s) let anyone list their files with no login (${names}). If any of these hold user uploads — avatars, documents, invoices — that's exposed. If everything in them is meant to be public (product photos, site assets), you're fine — just double-check nothing private ended up in there.`,
      redactedLocation: `${ref.url} — buckets: ${names}`,
    });
  }

  return findings;
}
