/**
 * The legal document set, in one place.
 *
 * Four things read from this and they must never drift apart: the footer, the
 * sitemap, the acceptance notice shown at sign-in, and the version recorded
 * against a user's account when they accept. Before this existed the footer
 * listed the documents by hand, which is how a policy gets published and then
 * quietly stays unlinked.
 *
 * No `server-only` here on purpose — the same pure/impure split used by
 * lib/auth-email.ts and lib/scan/redact.ts. These are constants and one
 * comparison, so they can be unit-tested directly and imported by client
 * components without dragging a database client into the bundle. The writes
 * live in lib/data/legal.ts.
 */

/**
 * The version a user accepts, and the one recorded against their account.
 *
 * A date rather than a number, because the question anyone actually asks is
 * "which wording did they agree to", and a date answers it against the
 * "Last updated" line printed at the top of every document.
 *
 * Bump this ONLY for a change that alters someone's rights or obligations —
 * new document, new restriction, a changed liability limit. Every signed-in
 * user is asked to accept again, which is a cost, so a typo fix or a clearer
 * sentence is not a reason to bump it.
 */
export const LEGAL_VERSION = "2026-08-06";

export interface LegalDocument {
  /** Route, without a leading origin. */
  slug: string;
  /** Short label — footer and inline links. */
  label: string;
  /** Full title, as printed at the top of the document. */
  title: string;
  /** True when accepting the service means accepting this document. */
  binding: boolean;
}

/**
 * Ordered as a person would read them: what the deal is, what they may do with
 * it, what we do with their data, and then the two procedures.
 */
export const LEGAL_DOCUMENTS: readonly LegalDocument[] = [
  {
    slug: "/terms",
    label: "Terms",
    title: "Terms of Service",
    binding: true,
  },
  {
    slug: "/license",
    label: "License terms",
    title: "License Terms (EULA)",
    binding: true,
  },
  {
    slug: "/acceptable-use",
    label: "Acceptable use",
    title: "Acceptable Use Policy",
    binding: true,
  },
  {
    slug: "/privacy",
    label: "Privacy",
    title: "Privacy Policy",
    // Not "accepted" — a privacy policy is a disclosure of what we do, and
    // dressing it as a contract term someone agrees to is precisely the move
    // regulators object to. It is linked everywhere the binding ones are.
    binding: false,
  },
  {
    slug: "/dmca",
    label: "Copyright / DMCA",
    title: "Copyright & DMCA Policy",
    binding: false,
  },
  {
    slug: "/refunds",
    label: "Refunds",
    title: "Refund Policy",
    binding: false,
  },
] as const;

/** The documents a user is agreeing to when they sign in or run a scan. */
export const BINDING_DOCUMENTS = LEGAL_DOCUMENTS.filter((d) => d.binding);

/**
 * Whether this user must be asked to accept again.
 *
 * Any mismatch counts, not just an older date: a value we don't recognise
 * (a hand-edited row, a rolled-back deploy) should re-ask rather than be
 * treated as current, because the failure we care about is silently believing
 * someone accepted wording they never saw.
 */
export function needsAcceptance(acceptedVersion: string | null | undefined): boolean {
  return acceptedVersion !== LEGAL_VERSION;
}
