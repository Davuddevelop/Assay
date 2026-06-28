import { NextResponse, type NextRequest } from "next/server";

import { getUser } from "@/lib/auth";
import { syncInstallation } from "@/lib/github/sync";
import { inngest, EVENTS } from "@/inngest/client";
import { log } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Where GitHub sends the user right after they install / reconfigure the App
 * (the App's "Setup URL"). We sync the installation **synchronously** here —
 * claiming it for the signed-in user and pulling in their repos — then drop the
 * user back on the dashboard with everything already connected. No webhook wait.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const installationId = Number(searchParams.get("installation_id"));

  if (!Number.isFinite(installationId) || installationId <= 0) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  const user = await getUser();

  try {
    const result = await syncInstallation(installationId, user?.id);

    // Best-effort: enqueue embedding indexing (no-ops without Inngest/Voyage).
    if (result.repos.length > 0) {
      try {
        await inngest.send(
          result.repos.map((r) => ({
            name: EVENTS.repoIndex,
            data: {
              githubInstallId: installationId,
              repoId: r.id,
              fullName: r.full_name,
              ref: r.default_branch,
            },
          })),
        );
      } catch {
        // Inngest not configured yet — indexing will run on the next sync.
      }
    }

    return NextResponse.redirect(`${origin}/dashboard?connected=${result.repos.length}`);
  } catch {
    log.error("post-install sync failed", { installationId });
    return NextResponse.redirect(`${origin}/dashboard?connect_error=1`);
  }
}
