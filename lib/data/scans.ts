import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ScanRow,
  ScanFindingRow,
  ScanVerdict,
  ScanFindingSeverity,
} from "@/lib/db/types";

// ── reads (user-scoped, RLS) ──────────────────────────────────────────────────
export async function listScans(): Promise<ScanRow[]> {
  const db = await createClient();
  const { data } = await db.from("scans").select("*").order("created_at", { ascending: false });
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
  verdict: ScanVerdict | null;
  score: number | null;
  completedAt: string | null;
  findings: { severity: ScanFindingSeverity; title: string }[];
}

/**
 * Public, read-by-token badge report — served via the service role since the
 * badges/scans tables are otherwise owner-only. Exposes only what's safe to
 * show the world: the verdict, score, when it was checked, and finding
 * titles/severities. Never the fix prompts, redacted locations, or app owner.
 */
export async function getBadgeReport(token: string): Promise<BadgeReport | null> {
  const db = createAdminClient();
  const { data: badge } = await db
    .from("badges")
    .select("scan_id")
    .eq("public_token", token)
    .maybeSingle();
  if (!badge) return null;

  const { data: scan } = await db
    .from("scans")
    .select("app_url, verdict, score, completed_at")
    .eq("id", badge.scan_id)
    .maybeSingle();
  if (!scan) return null;

  const { data: findings } = await db
    .from("scan_findings")
    .select("severity, title")
    .eq("scan_id", badge.scan_id)
    .order("severity");

  return {
    appUrl: scan.app_url,
    verdict: scan.verdict,
    score: scan.score,
    completedAt: scan.completed_at,
    findings: (findings ?? []).map((f) => ({ severity: f.severity, title: f.title })),
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

