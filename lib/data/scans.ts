import "server-only";

import { randomBytes } from "node:crypto";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchApp } from "@/lib/scan/fetch";
import type { ScanRow, ScanFindingRow } from "@/lib/db/types";

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

export async function getScanFindings(scanId: string): Promise<ScanFindingRow[]> {
  const db = await createClient();
  const { data } = await db
    .from("scan_findings")
    .select("*")
    .eq("scan_id", scanId)
    .order("severity");
  return data ?? [];
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

// ── ownership (meta-tag verification) ─────────────────────────────────────────
export function newOwnershipToken(): string {
  return `assay-verify-${randomBytes(9).toString("hex")}`;
}

/** Get (or create) the verification token for this user + app URL. */
export async function ensureOwnershipToken(userId: string, appUrl: string): Promise<string> {
  const db = createAdminClient();
  const { data: existing } = await db
    .from("ownership_proofs")
    .select("token")
    .eq("user_id", userId)
    .eq("app_url", appUrl)
    .maybeSingle();
  if (existing) return existing.token;

  const token = newOwnershipToken();
  await db.from("ownership_proofs").insert({ user_id: userId, app_url: appUrl, token });
  return token;
}

export async function isOwnershipVerified(userId: string, appUrl: string): Promise<boolean> {
  const db = createAdminClient();
  const { data } = await db
    .from("ownership_proofs")
    .select("verified_at")
    .eq("user_id", userId)
    .eq("app_url", appUrl)
    .maybeSingle();
  return Boolean(data?.verified_at);
}

/** Fetch the app and confirm the verification meta tag is present. */
export async function verifyOwnership(userId: string, appUrl: string): Promise<boolean> {
  const token = await ensureOwnershipToken(userId, appUrl);
  let html = "";
  try {
    html = (await fetchApp(appUrl)).html;
  } catch {
    return false;
  }
  const found = html.match(
    /<meta[^>]+name=["']assay-verify["'][^>]+content=["']([^"']+)["']/i,
  )?.[1];
  if (found !== token) return false;

  const db = createAdminClient();
  await db
    .from("ownership_proofs")
    .update({ verified_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("app_url", appUrl);
  return true;
}

// ── public badge report (service role, by token) ──────────────────────────────
export async function getBadgeReport(
  publicToken: string,
): Promise<{ scan: ScanRow; findings: ScanFindingRow[] } | null> {
  const db = createAdminClient();
  const { data: badge } = await db
    .from("badges")
    .select("scan_id")
    .eq("public_token", publicToken)
    .maybeSingle();
  if (!badge) return null;

  const { data: scan } = await db.from("scans").select("*").eq("id", badge.scan_id).maybeSingle();
  if (!scan) return null;
  const { data: findings } = await db
    .from("scan_findings")
    .select("*")
    .eq("scan_id", badge.scan_id)
    .order("severity");
  return { scan, findings: findings ?? [] };
}
