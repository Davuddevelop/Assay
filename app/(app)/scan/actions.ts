"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { assertScannableUrl } from "@/lib/scan/fetch";
import { createScan } from "@/lib/data/scans";
import { setWatch } from "@/lib/data/monitors";
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

/**
 * Submit a URL to scan — runs immediately. No ownership step: a scan only reads
 * what's already public on the app, so gating it behind "edit your <head> and
 * republish" was pure friction. The value is private self-assurance, not a
 * public credential.
 */
export async function startScan(formData: FormData) {
  const user = await requireUser();
  const appUrl = normalizeUrl(String(formData.get("url") ?? ""));

  try {
    await assertScannableUrl(appUrl);
  } catch {
    redirect(`/scan?error=url`);
  }

  await launch(user.id, appUrl);
}

/**
 * Toggle continuous re-checking for an app. Watched apps are re-scanned daily
 * (metered against the plan) and the dashboard flags any regression — the
 * "keep it safe after you keep editing it" half of the product.
 */
export async function toggleWatch(formData: FormData) {
  const user = await requireUser();
  const appUrl = String(formData.get("app_url") ?? "").trim();
  const active = formData.get("active") === "true";
  const scanId = String(formData.get("scan_id") ?? "");
  if (!appUrl) return;

  await setWatch(user.id, appUrl, active);
  if (scanId) revalidatePath(`/scan/${scanId}`);
  revalidatePath("/dashboard");
}

