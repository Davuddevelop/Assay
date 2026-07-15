import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

