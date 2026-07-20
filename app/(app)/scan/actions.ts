"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { assertScannableUrl } from "@/lib/scan/fetch";
import { createScan, ensureBadge } from "@/lib/data/scans";
import { setWatch } from "@/lib/data/monitors";
import { executeAndSaveScan } from "@/lib/scan/execute";
import { consumeScanUsage } from "@/lib/usage";
import { rateLimit } from "@/lib/rate-limit";

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

async function launch(userId: string, appUrl: string): Promise<never> {
  // A monthly cap alone still lets a signed-in user fire dozens of live
  // outbound fetches in seconds (up to their whole allowance at once) — cap
  // the burst rate too, same guard as the anonymous /try endpoint.
  if (!rateLimit(`scan:${userId}`).ok) {
    redirect("/scan?error=burst");
  }
  // Enforce the monthly scan allowance before doing any work (prevents abuse /
  // SSRF amplification). Plan is "free" until per-user billing lands.
  if (!(await consumeScanUsage(userId, "free"))) {
    redirect("/scan?error=limit");
  }
  const scanId = await createScan(userId, appUrl);
  // Run inline, same as the anonymous /try flow — no durable-job dependency
  // (Inngest) on the critical path. The daily watch-list re-check still uses
  // Inngest, since a scheduler is the one thing this can't replace.
  await executeAndSaveScan(scanId, appUrl);
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
 * "keep it safe after you keep editing it" half of the product. Bound directly
 * to the button (no hidden form fields to parse back out).
 */
export async function toggleWatch(appUrl: string, active: boolean, scanId: string) {
  const user = await requireUser();
  await setWatch(user.id, appUrl, active);
  revalidatePath(`/scan/${scanId}`);
  revalidatePath("/dashboard");
}

/**
 * Mint (or fetch) the public badge for a certified scan and return its shareable
 * URL — the "share proof" action. requireUser gates it; ensureBadge verifies the
 * scan is owned + certified before writing. Returns null when the scan can't be
 * badged (not owned, not a pass).
 */
export async function shareBadge(scanId: string): Promise<string | null> {
  await requireUser();
  const token = await ensureBadge(scanId);
  return token ? `/badge/${token}` : null;
}

