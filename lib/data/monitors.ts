import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { compareScans, type ScanDelta } from "@/lib/scan/diff";
import type { MonitoredAppRow, ScanRow } from "@/lib/db/types";

// ── reads (user-scoped, RLS) ──────────────────────────────────────────────────

/** Is this app on the signed-in user's watch list? */
export async function isWatched(appUrl: string): Promise<boolean> {
  const db = await createClient();
  const { data } = await db
    .from("monitored_apps")
    .select("active")
    .eq("app_url", appUrl)
    .maybeSingle();
  return Boolean(data?.active);
}

/** One monitored app by id — RLS scopes it to the signed-in owner. */
export async function getMonitor(id: string): Promise<MonitoredAppRow | null> {
  const db = await createClient();
  const { data } = await db.from("monitored_apps").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export interface WatchedAppStatus {
  monitor: MonitoredAppRow;
  /** Most recent completed scan of the app, if any. */
  latest: ScanRow | null;
  /** How the latest scan compares to the one before it. */
  delta: ScanDelta;
}

/**
 * The signed-in user's watched apps, each with its latest completed scan and
 * the delta vs. the scan before — what the dashboard renders as "still safe" /
 * "a change broke something".
 */
export async function listWatchedApps(): Promise<WatchedAppStatus[]> {
  const db = await createClient();
  const { data: monitors } = await db
    .from("monitored_apps")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (!monitors || monitors.length === 0) return [];

  const statuses = await Promise.all(
    monitors.map(async (monitor) => {
      const { data: scans } = await db
        .from("scans")
        .select("*")
        .eq("app_url", monitor.app_url)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(2);
      const [latest = null, previous = null] = scans ?? [];
      return { monitor, latest, delta: compareScans(previous, latest) };
    }),
  );
  return statuses;
}

// ── writes (service role) ─────────────────────────────────────────────────────

/** Turn watching on/off for a user + app URL (upsert, idempotent). */
export async function setWatch(
  userId: string,
  appUrl: string,
  active: boolean,
): Promise<void> {
  const db = createAdminClient();
  const { error } = await db
    .from("monitored_apps")
    .upsert({ user_id: userId, app_url: appUrl, active }, { onConflict: "user_id,app_url" });
  if (error) throw new Error(`set watch: ${error.message}`);
}

/** All active monitors across users — used by the change-detection job. */
export async function listActiveMonitors(): Promise<MonitoredAppRow[]> {
  const db = createAdminClient();
  const { data } = await db.from("monitored_apps").select("*").eq("active", true);
  return data ?? [];
}

/** Record the latest fingerprint + check time for a monitored app. */
export async function updateMonitorFingerprint(id: string, fingerprint: string): Promise<void> {
  const db = createAdminClient();
  await db
    .from("monitored_apps")
    .update({ last_fingerprint: fingerprint, last_checked_at: new Date().toISOString() })
    .eq("id", id);
}
