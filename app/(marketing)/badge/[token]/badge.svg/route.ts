import { getBadgeReport } from "@/lib/data/scans";
import { verificationFreshness } from "@/lib/scan/freshness";
import { renderBadgeSvg, badgeStateFor } from "@/lib/scan/badge-svg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The embeddable badge image: `<img src="/badge/<token>/badge.svg">`. Public,
 * read-by-token (the badges table is otherwise owner-only, served here via the
 * service role). Its color reflects live freshness, so an aging certification
 * greys out on the owner's own site — a standing nudge to re-check. Cached
 * briefly so it stays reasonably current without hammering the DB.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const report = await getBadgeReport(token);

  const state = report
    ? badgeStateFor(
        report.verdict === "certified",
        verificationFreshness(report.completedAt).state === "expired",
      )
    : { status: "Unknown", tone: "stale" as const };

  const svg = renderBadgeSvg(state);

  return new Response(svg, {
    status: report ? 200 : 404,
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
