import { NextResponse, type NextRequest } from "next/server";

import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { recheckFinding } from "@/lib/scan/recheck";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Re-check one finding: the user pasted the fix into their builder, now confirm
 * it worked. Auth-required; the finding + its scan are read through RLS so a
 * user can only re-check their own app. Runs the single relevant check against
 * the live app (SSRF-guarded) and returns whether it's resolved.
 */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!rateLimit(`recheck:${user.id}`, 20, 60_000).ok) {
    return NextResponse.json({ error: "Slow down a moment." }, { status: 429 });
  }

  let body: { scanId?: string; findingId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const { scanId, findingId } = body;
  if (!scanId || !findingId) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  // RLS scopes both reads to the signed-in owner.
  const db = await createClient();
  const [{ data: scan }, { data: finding }] = await Promise.all([
    db.from("scans").select("app_url, is_demo").eq("id", scanId).maybeSingle(),
    db.from("scan_findings").select("kind, title, scan_id").eq("id", findingId).maybeSingle(),
  ]);
  if (!scan || !finding || finding.scan_id !== scanId || scan.is_demo) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const { resolved } = await recheckFinding(scan.app_url, finding.kind, finding.title);
    return NextResponse.json({ resolved });
  } catch {
    return NextResponse.json(
      { error: "We couldn't reach your app to re-check it." },
      { status: 502 },
    );
  }
}
