import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { compareScans } from "@/lib/scan/diff";
import { sendEmail } from "@/lib/email/resend";
import { regressionEmail, weeklyDigestEmail, type DigestApp } from "@/lib/email/templates";
import { getUserPlan } from "@/lib/data/subscriptions";
import { hasEmailAlerts } from "@/lib/plans";
import { siteUrl } from "@/lib/env";
import { log } from "@/lib/log";

/**
 * After a scan completes, email the owner if a watched app just regressed.
 *
 * Safe to call for EVERY scan — it quietly no-ops for demos, unwatched apps,
 * first scans (no baseline to compare), and non-regressions. Deduped by the
 * email_log unique index so a job replay can't double-send. Never throws: a
 * failed alert must not fail the scan pipeline.
 */
export async function notifyOnScanResult(scanId: string): Promise<{ alerted: boolean }> {
  const db = createAdminClient();
  try {
    const { data: scan } = await db
      .from("scans")
      .select("id, user_id, app_url, score, verdict, is_demo, status")
      .eq("id", scanId)
      .single();
    if (!scan || scan.is_demo || !scan.user_id || scan.status !== "completed") {
      return { alerted: false };
    }

    // Only watched apps get alerts.
    const { data: monitor } = await db
      .from("monitored_apps")
      .select("active")
      .eq("user_id", scan.user_id)
      .eq("app_url", scan.app_url)
      .maybeSingle();
    if (!monitor?.active) return { alerted: false };

    // Email alerts are a paid feature — Free watchers still see regressions on
    // their dashboard, but the email nudge is Pro/Team only.
    if (!hasEmailAlerts(await getUserPlan(scan.user_id))) return { alerted: false };

    // Compare against the previous completed scan of the same app.
    const { data: scans } = await db
      .from("scans")
      .select("score, verdict")
      .eq("app_url", scan.app_url)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(2);
    const [current = null, previous = null] = scans ?? [];
    const delta = compareScans(previous, current);
    if (!delta.regression) return { alerted: false };

    // Dedupe backstop: skip if we've already logged a regression for this scan.
    const { data: already } = await db
      .from("email_log")
      .select("id")
      .eq("scan_id", scan.id)
      .eq("kind", "regression")
      .maybeSingle();
    if (already) return { alerted: false };

    const { data: userRes } = await db.auth.admin.getUserById(scan.user_id);
    const to = userRes?.user?.email;
    if (!to) return { alerted: false };

    const { data: findings } = await db
      .from("scan_findings")
      .select("title, severity")
      .eq("scan_id", scan.id)
      .order("severity")
      .limit(3);

    const msg = regressionEmail({
      appUrl: scan.app_url,
      score: current?.score ?? null,
      prevScore: previous?.score ?? null,
      scoreDelta: delta.scoreDelta,
      topFindings: findings ?? [],
      reportUrl: `${siteUrl()}/scan/${scan.id}`,
    });
    const sent = await sendEmail({ to, ...msg });
    if (sent) {
      await db.from("email_log").insert({
        user_id: scan.user_id,
        scan_id: scan.id,
        kind: "regression",
        app_url: scan.app_url,
      });
    }
    log.info("regression alert", { scanId, sent });
    return { alerted: sent };
  } catch {
    log.error("notify failed", { scanId });
    return { alerted: false };
  }
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Weekly digest — one email per watching user summarizing their apps' status
 * and how many changes we re-checked this week. Makes quiet, uneventful
 * watching visible so the subscription never feels like "paying for nothing".
 * Never throws; returns how many emails were sent.
 */
export async function sendWeeklyDigests(): Promise<{ sent: number }> {
  const db = createAdminClient();
  const since = new Date(Date.now() - WEEK_MS).toISOString();
  let sent = 0;
  try {
    const { data: monitors } = await db
      .from("monitored_apps")
      .select("user_id, app_url")
      .eq("active", true);
    if (!monitors || monitors.length === 0) return { sent: 0 };

    // Group watched apps by owner.
    const byUser = new Map<string, string[]>();
    for (const m of monitors) {
      const list = byUser.get(m.user_id) ?? [];
      list.push(m.app_url);
      byUser.set(m.user_id, list);
    }

    for (const [userId, urls] of byUser) {
      const apps: DigestApp[] = await Promise.all(
        urls.map(async (appUrl) => {
          const { data: rows } = await db
            .from("scans")
            .select("verdict, completed_at")
            .eq("app_url", appUrl)
            .eq("status", "completed")
            .order("completed_at", { ascending: false })
            .limit(30);
          const scanRows = rows ?? [];
          const latest = scanRows[0];
          const changed = scanRows.filter(
            (s) => s.completed_at !== null && s.completed_at >= since,
          ).length;
          return {
            appUrl,
            status: latest?.verdict ?? "unknown",
            changed,
          };
        }),
      );

      // Weekly digest is a paid feature.
      if (!hasEmailAlerts(await getUserPlan(userId))) continue;

      const { data: userRes } = await db.auth.admin.getUserById(userId);
      const to = userRes?.user?.email;
      if (!to) continue;

      const msg = weeklyDigestEmail({
        apps,
        dashboardUrl: `${siteUrl()}/dashboard`,
      });
      const ok = await sendEmail({ to, ...msg });
      if (ok) {
        sent += 1;
        await db.from("email_log").insert({
          user_id: userId,
          scan_id: null,
          kind: "digest",
          app_url: null,
        });
      }
    }
    log.info("weekly digest sweep", { users: byUser.size, sent });
    return { sent };
  } catch {
    log.error("weekly digest failed", {});
    return { sent };
  }
}
