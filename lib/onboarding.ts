/**
 * The two questions asked at first sign-in.
 *
 * Two, and no more. The rule this file exists to enforce (CLAUDE.md §11) is
 * that a question earns its place only if the answer changes something real —
 * otherwise it is a survey wearing a personalization costume, and every extra
 * field is a person who doesn't finish signing up. Company size, role, budget
 * and "how did you hear about us" all fail that test and are deliberately
 * absent.
 *
 * What each one actually changes:
 *
 *   platform — prefills the scan box with the right example host, and fixes a
 *   real hole in our own data. 92% of scans record platform='unknown', because
 *   lib/scan/platform.ts will only classify on evidence a page cannot fake
 *   (the deploy host, or the builder's own script). That honesty is right for
 *   the detector and it leaves the telemetry table unable to answer the one
 *   question it exists for. Asking the owner is the only trustworthy source.
 *
 *   audience — decides what the dashboard offers next. Someone doing client
 *   work needs the shareable report and /client-handoff; someone checking
 *   their own side project needs monitoring. Showing both to everyone is how
 *   a product ends up with a homepage for a dashboard.
 *
 * Pure and server-only-free so the options can be rendered by a client
 * component and validated by a server action from the same source — a form
 * whose values and validator can drift is a form that silently drops answers.
 */

export const PLATFORMS = [
  { value: "lovable", label: "Lovable", host: "yourapp.lovable.app" },
  { value: "bolt", label: "Bolt", host: "yourapp.bolt.host" },
  { value: "replit", label: "Replit", host: "yourapp.replit.app" },
  { value: "v0", label: "v0", host: "yourapp.vercel.app" },
  { value: "other", label: "Something else", host: "yourapp.com" },
] as const;

export const AUDIENCES = [
  { value: "self", label: "My own projects" },
  { value: "client", label: "Client work" },
  { value: "company", label: "My company" },
] as const;

export type Platform = (typeof PLATFORMS)[number]["value"];
export type Audience = (typeof AUDIENCES)[number]["value"];

export interface Profile {
  platform: Platform | null;
  audience: Audience | null;
  /** They pressed Skip. Distinct from "hasn't answered yet". */
  skipped: boolean;
}

export function isPlatform(v: unknown): v is Platform {
  return typeof v === "string" && PLATFORMS.some((p) => p.value === v);
}

export function isAudience(v: unknown): v is Audience {
  return typeof v === "string" && AUDIENCES.some((a) => a.value === v);
}

/**
 * The placeholder for the scan box.
 *
 * The default is the Lovable host rather than a generic "yourapp.com" because
 * Lovable is where most of these apps come from, and a placeholder that shows
 * the shape of a real answer is worth more than one that shows the shape of
 * the question.
 */
export function scanPlaceholder(platform: Platform | null | undefined): string {
  return PLATFORMS.find((p) => p.value === platform)?.host ?? "yourapp.lovable.app";
}

/**
 * Ask only while something is still unanswered, and never after a skip.
 *
 * Both fields, not either: a half-answered profile is the case where someone
 * picked a builder, got distracted, and would otherwise never be asked the
 * second question — and the second question is the one that changes what the
 * dashboard shows.
 *
 * A skip is final. Re-asking someone who already declined is how a two-second
 * question becomes the reason they stop opening the dashboard.
 */
export function needsOnboarding(profile: Profile | null): boolean {
  if (!profile) return true;
  if (profile.skipped) return false;
  return profile.platform === null || profile.audience === null;
}
