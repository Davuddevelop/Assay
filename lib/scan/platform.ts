/**
 * Which builder made this app.
 *
 * The first version matched the builder's name anywhere in the page text, which
 * is wrong in an obvious way once you see it: scanning supabase.com reported a
 * Lovable app, because Supabase's homepage lists Lovable as a customer. Any
 * page that merely mentions a builder — a blog post, a competitor, a directory
 * — was misattributed.
 *
 * That is worse than an unknown, because this field is the grouping key for
 * everything we might ever say publicly about how these tools ship. A number
 * like "most Lovable apps leak a key" is worthless if the population is
 * actually "pages containing the word lovable".
 *
 * So detection now only accepts evidence a page cannot have by talking *about*
 * a builder: the host it is deployed on, or a script it actually loads from
 * the builder's own infrastructure. Everything else is "unknown" — an honest
 * gap being much more useful here than a confident guess.
 *
 * Pure, so the classifier can be tested against real page shapes without a
 * network.
 */

/** Deploy hosts. A suffix match on the hostname is definitive. */
const HOST_SUFFIXES: [suffix: string, platform: string][] = [
  [".lovable.app", "lovable"],
  [".lovableproject.com", "lovable"],
  [".bolt.host", "bolt"],
  [".stackblitz.io", "bolt"],
  [".webcontainer.io", "bolt"],
  [".replit.app", "replit"],
  [".replit.dev", "replit"],
  [".repl.co", "replit"],
  [".vusercontent.net", "v0"],
];

/**
 * Infrastructure a page loads from. Present only if the builder's own tooling
 * is on the page — unlike its name, which anyone can write.
 */
const ASSET_MARKERS: [marker: string, platform: string][] = [
  ["gpteng.co", "lovable"],
  ["gptengineer.js", "lovable"],
  ["lovable-uploads", "lovable"],
  ["cdn.lovable.dev", "lovable"],
  ["bolt.new/", "bolt"],
  ["staticblitz.com", "bolt"],
  ["replit.com/public/", "replit"],
  ["cdn.replit.com", "replit"],
  ["v0.dev/", "v0"],
  ["v0.app/", "v0"],
];

/**
 * Best-effort identification of the builder behind an app. Returns "unknown"
 * rather than guessing from prose.
 */
export function detectPlatform(html: string, appUrl?: string): string {
  // The host is the strongest signal available and cannot be faked by content.
  if (appUrl) {
    try {
      const host = new URL(appUrl).hostname.toLowerCase();
      for (const [suffix, platform] of HOST_SUFFIXES) {
        if (host === suffix.slice(1) || host.endsWith(suffix)) return platform;
      }
    } catch {
      // A malformed url just means we fall through to the markup check.
    }
  }

  const h = html.toLowerCase();
  for (const [marker, platform] of ASSET_MARKERS) {
    if (h.includes(marker)) return platform;
  }

  // A generator meta tag is self-declared, but nobody sets it to advertise
  // someone else's tool.
  const generator = /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i.exec(
    html,
  );
  if (generator) {
    const value = generator[1].toLowerCase();
    if (value.includes("lovable")) return "lovable";
    if (value.includes("bolt")) return "bolt";
    if (value.includes("replit")) return "replit";
    if (value.includes("v0")) return "v0";
  }

  return "unknown";
}
