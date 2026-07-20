/**
 * Transactional email templates — pure functions returning { subject, html,
 * text } so they're trivially unit-testable and never touch the network. Styled
 * inline (email clients strip <style>/CSS vars) in Assay's dark palette.
 *
 * The whole point of these emails: make vigilance visible. A regression alert
 * turns a silent database row ("your app got worse") into the moment the
 * subscription proves its worth; the weekly digest turns quiet, uneventful
 * watching into something the user can see.
 */

const ONYX = "#0B0C09";
const SURFACE = "#14150F";
const IVORY = "#F1ECDF";
const DIM = "#A9A395";
const IRIS = "#8b7cf6";
const RED = "#e5644e";
const LINE = "#2a2b26";

function shell(previewText: string, inner: string): string {
  return `<!doctype html><html><body style="margin:0;background:${ONYX};padding:24px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${previewText}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:92%;">
<tr><td style="padding:0 4px 20px;">
<span style="color:${IVORY};font-size:16px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;">Assay</span>
</td></tr>
<tr><td style="background:${SURFACE};border:1px solid ${LINE};border-radius:16px;padding:28px;">
${inner}
</td></tr>
<tr><td style="padding:18px 4px 0;color:${DIM};font-size:12px;line-height:1.6;">
You're receiving this because you're watching this app with Assay. The independent check for AI-built apps.
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:${IRIS};color:#0b0b10;font-weight:600;font-size:14px;text-decoration:none;padding:11px 20px;border-radius:10px;">${label}</a>`;
}

// ── Regression alert ─────────────────────────────────────────────────────────

export interface RegressionEmailInput {
  appUrl: string;
  score: number | null;
  prevScore: number | null;
  scoreDelta: number | null;
  topFindings: { title: string; severity: string }[];
  reportUrl: string;
}

export function regressionEmail(input: RegressionEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const { appUrl, score, prevScore, scoreDelta, topFindings, reportUrl } = input;
  const host = safeHost(appUrl);
  const subject = `⚠ A change to ${host} may have opened a security hole`;

  const drop =
    scoreDelta !== null && scoreDelta < 0
      ? `Its safety score dropped ${Math.abs(scoreDelta)} points${
          prevScore !== null && score !== null ? ` (${prevScore} → ${score})` : ""
        }.`
      : `It's now flagged at risk.`;

  const findingsHtml =
    topFindings.length > 0
      ? `<ul style="margin:18px 0 0;padding:0;list-style:none;">${topFindings
          .map(
            (f) =>
              `<li style="margin:0 0 8px;color:${IVORY};font-size:14px;line-height:1.5;"><span style="color:${RED};">●</span>&nbsp;${escapeHtml(
                f.title,
              )} <span style="color:${DIM};font-size:12px;">(${escapeHtml(f.severity)})</span></li>`,
          )
          .join("")}</ul>`
      : "";

  const inner = `
<div style="color:${RED};font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;">Regression detected</div>
<h1 style="margin:10px 0 0;color:${IVORY};font-size:22px;line-height:1.25;font-weight:700;">Something changed on ${escapeHtml(host)}</h1>
<p style="margin:14px 0 0;color:${DIM};font-size:15px;line-height:1.6;">We re-checked <span style="color:${IVORY};">${escapeHtml(appUrl)}</span> right after it changed. ${drop} Here's what needs your attention:</p>
${findingsHtml}
<div style="margin:24px 0 0;">${button("See the fixes", reportUrl)}</div>
<p style="margin:16px 0 0;color:${DIM};font-size:12px;line-height:1.6;">Each finding comes with an exact prompt you can paste back into your builder to fix it.</p>`;

  const text = `Regression detected on ${host}

We re-checked ${appUrl} right after it changed. ${drop}
${topFindings.map((f) => `- ${f.title} (${f.severity})`).join("\n")}

See the fixes: ${reportUrl}

Each finding comes with an exact prompt to paste back into your builder.`;

  return { subject, html: shell(subject, inner), text };
}

// ── Weekly digest ────────────────────────────────────────────────────────────

export interface DigestApp {
  appUrl: string;
  status: "certified" | "at_risk" | "unknown";
  changed: number;
}

export interface DigestEmailInput {
  apps: DigestApp[];
  dashboardUrl: string;
}

export function weeklyDigestEmail(input: DigestEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const { apps, dashboardUrl } = input;
  const atRisk = apps.filter((a) => a.status === "at_risk").length;
  const changed = apps.reduce((n, a) => n + a.changed, 0);
  const n = apps.length;

  const subject =
    atRisk > 0
      ? `Your weekly Assay report — ${atRisk} app${atRisk === 1 ? "" : "s"} need${atRisk === 1 ? "s" : ""} attention`
      : `Your weekly Assay report — all ${n} app${n === 1 ? "" : "s"} still safe`;

  const rows = apps
    .map((a) => {
      const dot =
        a.status === "at_risk" ? RED : a.status === "certified" ? IRIS : DIM;
      const label =
        a.status === "at_risk"
          ? "At risk"
          : a.status === "certified"
            ? "Certified"
            : "Pending";
      const changedNote =
        a.changed > 0
          ? `${a.changed} change${a.changed === 1 ? "" : "s"} this week`
          : "No changes this week";
      return `<tr>
<td style="padding:12px 0;border-top:1px solid ${LINE};color:${IVORY};font-size:14px;">${escapeHtml(safeHost(a.appUrl))}<div style="color:${DIM};font-size:12px;margin-top:2px;">${changedNote}</div></td>
<td style="padding:12px 0;border-top:1px solid ${LINE};text-align:right;color:${dot};font-size:13px;font-weight:600;white-space:nowrap;">● ${label}</td>
</tr>`;
    })
    .join("");

  const headline =
    atRisk > 0
      ? `${atRisk} of your apps need attention`
      : `All ${n} app${n === 1 ? "" : "s"} still safe`;

  const inner = `
<div style="color:${IRIS};font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;">This week</div>
<h1 style="margin:10px 0 0;color:${IVORY};font-size:22px;line-height:1.25;font-weight:700;">${headline}</h1>
<p style="margin:14px 0 0;color:${DIM};font-size:15px;line-height:1.6;">We watched ${n} app${n === 1 ? "" : "s"} for you this week and re-checked ${changed === 0 ? "nothing slipped" : `every one of the ${changed} change${changed === 1 ? "" : "s"} you shipped`}.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;">${rows}</table>
<div style="margin:24px 0 0;">${button("Open your dashboard", dashboardUrl)}</div>`;

  const text = `${headline}

We watched ${n} app(s) this week.
${apps.map((a) => `- ${safeHost(a.appUrl)}: ${a.status}, ${a.changed} change(s) this week`).join("\n")}

Open your dashboard: ${dashboardUrl}`;

  return { subject, html: shell(subject, inner), text };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
