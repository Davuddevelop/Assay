/**
 * The shareable badge, rendered as a self-contained SVG so any site can embed
 * it with a plain <img>. It encodes freshness in its color: current = iris
 * "Certified", expired = grey "Expired", not-a-pass = oxblood "At risk". A badge
 * that visibly greys out as it ages is what quietly pressures the owner to
 * re-check — the growth-plus-retention loop in one image. Pure + unit-tested.
 */
type BadgeTone = "ok" | "stale" | "bad";

export interface BadgeState {
  status: string;
  tone: BadgeTone;
}

export function badgeStateFor(certified: boolean, expired: boolean): BadgeState {
  if (!certified) return { status: "At risk", tone: "bad" };
  if (expired) return { status: "Expired", tone: "stale" };
  return { status: "Certified", tone: "ok" };
}

const TONE_FILL: Record<BadgeTone, string> = {
  ok: "#8b7cf6", // iris
  stale: "#6E695C", // ash
  bad: "#8E3A2F", // oxblood
};

// Fixed geometry — a ~7px-per-char monospace-ish estimate keeps the two
// segments snug without measuring text.
const H = 28;
const LABEL = "Assay";
const LABEL_W = 52;
const CHAR_W = 7.2;
const PAD = 22; // room for the check glyph + breathing space

/** Render the badge SVG for a given verdict/freshness. `status` is app-provided. */
export function renderBadgeSvg(state: BadgeState): string {
  const statusW = Math.round(state.status.length * CHAR_W + PAD);
  const total = LABEL_W + statusW;
  const fill = TONE_FILL[state.tone];
  const font =
    "font-family='Verdana,Geneva,DejaVu Sans,sans-serif' font-size='12'";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${H}" viewBox="0 0 ${total} ${H}" role="img" aria-label="Assay: ${state.status}">
  <rect width="${total}" height="${H}" rx="6" fill="#14150F"/>
  <rect x="${LABEL_W}" width="${statusW}" height="${H}" rx="6" fill="${fill}"/>
  <rect x="${LABEL_W}" width="8" height="${H}" fill="${fill}"/>
  <text x="${LABEL_W / 2}" y="18" fill="#F1ECDF" text-anchor="middle" ${font} font-weight="600">${LABEL}</text>
  <text x="${LABEL_W + statusW / 2}" y="18" fill="#0B0C09" text-anchor="middle" ${font} font-weight="700">${state.tone === "ok" ? "✓ " : ""}${state.status}</text>
</svg>`;
}
