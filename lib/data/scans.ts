import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ScanRow,
  ScanFindingRow,
  ScanVerdict,
} from "@/lib/db/types";

// ── reads (user-scoped, RLS) ──────────────────────────────────────────────────
/**
 * Scan history, newest first.
 *
 * Bounded, because monitoring re-checks a watched app every three hours: an
 * unbounded select grows without limit and eventually loads thousands of rows
 * to render a page that groups them down to a handful. The cap is generous
 * enough that the per-app counts stay accurate for any realistic account.
 */
const SCAN_HISTORY_LIMIT = 500;

export async function listScans(): Promise<ScanRow[]> {
  const db = await createClient();
  const { data } = await db
    .from("scans")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(SCAN_HISTORY_LIMIT);
  return data ?? [];
}

export async function getScan(id: string): Promise<ScanRow | null> {
  const db = await createClient();
  const { data } = await db.from("scans").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

/** Completed scans of one app, oldest → newest — the monitor's history. */
export async function listCompletedScansForUrl(appUrl: string): Promise<ScanRow[]> {
  const db = await createClient();
  const { data } = await db
    .from("scans")
    .select("*")
    .eq("app_url", appUrl)
    .eq("status", "completed")
    .order("completed_at", { ascending: true })
    .limit(30);
  return data ?? [];
}

export async function getScanFindings(scanId: string): Promise<ScanFindingRow[]> {
  const db = await createClient();
  const { data } = await db
    .from("scan_findings")
    .select("*")
    .eq("scan_id", scanId)
    .order("severity");
  return data ?? [];
}

// ── public badge (shareable proof) ────────────────────────────────────────────

function badgeToken(): string {
  // URL-safe, unguessable. Two UUIDs' worth of entropy, hex, no dashes.
  return (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "");
}

/**
 * Mint (or fetch) the public badge token for a scan the signed-in user owns.
 * Only certified scans get a badge — the badge is a snapshot of *that* passing
 * scan, so its freshness is the scan's age. Ownership is enforced by reading the
 * scan through the RLS client first; the badge row is then written service-role
 * (the badges table is locked to the public). Idempotent.
 */
export async function ensureBadge(scanId: string): Promise<string | null> {
  const rls = await createClient();
  const { data: scan } = await rls
    .from("scans")
    .select("id, verdict, status")
    .eq("id", scanId)
    .maybeSingle();
  if (!scan || scan.status !== "completed" || scan.verdict !== "certified") {
    return null; // not the user's scan, or not a pass → nothing to share
  }

  const db = createAdminClient();
  const { data: existing } = await db
    .from("badges")
    .select("public_token")
    .eq("scan_id", scanId)
    .maybeSingle();
  if (existing) return existing.public_token;

  const token = badgeToken();
  const { error } = await db.from("badges").insert({ scan_id: scanId, public_token: token });
  if (error) {
    // Lost a race — read back the token the other writer inserted.
    const { data } = await db
      .from("badges")
      .select("public_token")
      .eq("scan_id", scanId)
      .maybeSingle();
    return data?.public_token ?? null;
  }
  return token;
}

export interface BadgeReport {
  appUrl: string;
  /** The verdict of the most recent completed scan — not the one it was minted from. */
  verdict: ScanVerdict | null;
  score: number | null;
  /** When the *current* verdict was established. */
  completedAt: string | null;
  /** When the mark was first struck. Provenance, not standing. */
  struckAt: string | null;
  /** Whether the app is actively re-checked. A mark that claims live
   *  verification while nothing re-checks it would be a lie. */
  watched: boolean;
}

/**
 * Public, read-by-token badge report.
 *
 * This used to resolve `badges.scan_id` — the scan the mark was minted from —
 * which froze the mark to that moment forever. An app could regress the day
 * after handoff and the public page would still say "no issues found", which
 * is exactly the static-image badge every competitor ships, and exactly the
 * thing that makes a mark worthless.
 *
 * It now resolves the *latest completed scan for the same app and owner*. The
 * pinned scan is kept only as provenance: when the mark was first struck. The
 * consequence is the point of the feature — if a re-check finds the app has
 * regressed, this page flips to Held on its own, and nobody involved can
 * suppress it.
 *
 * SECURITY: finding titles used to be fetched here and were rendered by
 * neither consumer. They are gone. A public URL enumerating a live app's
 * weaknesses is a map for an attacker, so the shape of this type is the
 * guarantee: there is no field for a finding, and the page cannot leak one by
 * accident. Standing is public; detail stays behind the owner's login.
 */
export async function getBadgeReport(token: string): Promise<BadgeReport | null> {
  const db = createAdminClient();
  const { data: badge } = await db
    .from("badges")
    .select("scan_id")
    .eq("public_token", token)
    .maybeSingle();
  if (!badge) return null;

  // The minted scan identifies whose app this is, and when the mark was struck.
  const { data: struck } = await db
    .from("scans")
    .select("app_url, user_id, completed_at")
    .eq("id", badge.scan_id)
    .maybeSingle();
  if (!struck) return null;

  // Current standing: the newest completed scan of the same app by the same
  // owner. Falls back to the minted scan when there is nothing newer.
  //
  // The owner scope is not optional. Matching on app_url alone would let a
  // stranger who scans the same URL move someone else's public mark, which is
  // both wrong and abusable. An ownerless (anonymous) mark therefore cannot be
  // live-resolved at all, and stays pinned to what it was struck from.
  const owned = struck.user_id !== null;

  const { data: latest } = owned
    ? await db
        .from("scans")
        .select("verdict, score, completed_at")
        .eq("app_url", struck.app_url)
        .eq("user_id", struck.user_id as string)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const { data: monitor } = owned
    ? await db
        .from("monitored_apps")
        .select("active")
        .eq("app_url", struck.app_url)
        .eq("user_id", struck.user_id as string)
        .maybeSingle()
    : { data: null };

  return {
    appUrl: struck.app_url,
    verdict: latest?.verdict ?? null,
    score: latest?.score ?? null,
    completedAt: latest?.completed_at ?? struck.completed_at,
    struckAt: struck.completed_at,
    watched: Boolean(monitor?.active),
  };
}

// ── writes (service role) ─────────────────────────────────────────────────────
export async function createScan(
  userId: string,
  appUrl: string,
  isDemo = false,
): Promise<string> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("scans")
    .insert({ user_id: userId, app_url: appUrl, is_demo: isDemo, status: "queued" })
    .select("id")
    .single();
  if (error || !data) throw new Error(`create scan: ${error?.message}`);
  return data.id;
}

