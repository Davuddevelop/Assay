"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { assertScannableUrl } from "@/lib/scan/fetch";
import {
  createScan,
  ensureBadge,
  isOwnershipVerified,
  verifyOwnership,
} from "@/lib/data/scans";
import { inngest, EVENTS } from "@/inngest/client";
import { consumeScanUsage } from "@/lib/usage";
import { log } from "@/lib/log";

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

async function launch(userId: string, appUrl: string): Promise<never> {
  // Enforce the monthly scan allowance before doing any work (prevents abuse /
  // SSRF amplification). Plan is "free" until per-user billing lands.
  if (!(await consumeScanUsage(userId, "free"))) {
    redirect("/scan?error=limit");
  }
  const scanId = await createScan(userId, appUrl);
  try {
    await inngest.send({ name: EVENTS.scanRequested, data: { scanId } });
  } catch {
    // Inngest not configured yet — the scan stays queued; documented live gate.
    log.warn("inngest send failed (scan queued)", { scanId });
  }
  redirect(`/scan/${scanId}`);
}

/** Submit a URL to scan. Routes through ownership verification first. */
export async function startScan(formData: FormData) {
  const user = await requireUser();
  const appUrl = normalizeUrl(String(formData.get("url") ?? ""));

  try {
    await assertScannableUrl(appUrl);
  } catch {
    redirect(`/scan?error=url`);
  }

  if (!(await isOwnershipVerified(user.id, appUrl))) {
    redirect(`/scan?url=${encodeURIComponent(appUrl)}&verify=1`);
  }

  await launch(user.id, appUrl);
}

/** Re-fetch the app, confirm the meta tag, then start the scan. */
export async function confirmOwnership(formData: FormData) {
  const user = await requireUser();
  const appUrl = String(formData.get("url") ?? "");
  if (!appUrl) redirect("/scan");

  const ok = await verifyOwnership(user.id, appUrl);
  if (!ok) {
    redirect(`/scan?url=${encodeURIComponent(appUrl)}&verify=1&failed=1`);
  }
  await launch(user.id, appUrl);
}

/**
 * Mint (or fetch) the public badge for a certified scan, then return to the
 * report with the shareable link revealed. Ownership + verdict are re-checked
 * server-side in `ensureBadge` — this can't badge a scan you don't own.
 */
export async function createBadgeAction(formData: FormData) {
  await requireUser();
  const scanId = String(formData.get("scanId") ?? "");
  if (!scanId) redirect("/dashboard");

  const token = await ensureBadge(scanId);
  if (!token) redirect(`/scan/${scanId}`);
  redirect(`/scan/${scanId}?badge=${encodeURIComponent(token)}`);
}
