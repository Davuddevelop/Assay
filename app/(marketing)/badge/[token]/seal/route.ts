import { getBadgeReport } from "@/lib/data/scans";

// The embeddable badge image. A site owner drops this on their page; its
// presence proves they control the site (badge-as-proof) and markets Assay.
// Served as SVG so it's crisp and tiny. Reflects the live verdict by token.
export const dynamic = "force-dynamic";

function seal(certified: boolean): string {
  const accent = certified ? "#8b8bf0" : "#6b6b82";
  const label = certified ? "Safe to publish" : "Not certified";
  const kicker = certified ? "ASSAY · CERTIFIED" : "ASSAY";
  const mono =
    "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  const sans =
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="232" height="56" viewBox="0 0 232 56" role="img" aria-label="Assay — ${label}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#c4b5fd"/><stop offset="100%" stop-color="#5b7cf0"/>
    </linearGradient>
  </defs>
  <rect x="0.5" y="0.5" width="231" height="55" rx="12" fill="#0d0d18" stroke="#2a2a44"/>
  <circle cx="30" cy="28" r="14" fill="none" stroke="${accent}" stroke-width="2"/>
  <path d="M23 28 l5 5 l9 -11" fill="none" stroke="url(#g)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="56" y="23" font-family="${mono}" font-size="9" letter-spacing="1.6" fill="${accent}">${kicker}</text>
  <text x="56" y="41" font-family="${sans}" font-size="15" font-weight="700" fill="#ECECF2">${label}</text>
</svg>`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  let certified = false;
  try {
    const report = await getBadgeReport(token);
    certified = report?.scan.verdict === "certified";
  } catch {
    /* unknown token → renders the non-certified state */
  }
  return new Response(seal(certified), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=600, s-maxage=600",
    },
  });
}
