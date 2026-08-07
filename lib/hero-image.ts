/**
 * Where the hero photographs live.
 *
 * A separate module, not a constant exported from hero-v2.tsx, and that is a
 * Next.js constraint rather than a preference: importing a plain value out of
 * a `"use client"` module into a Server Component doesn't give you the value,
 * it gives you a client reference proxy. Doing that here produced
 * `The "path" argument must be of type string. Received function` at build
 * time, from a `join()` that looked entirely reasonable.
 *
 * Paths, not static imports. A static import fails the build outright when the
 * file is missing; a path 404s and leaves the page standing — which is not
 * theoretical, a PR once merged the hero component before its image reached
 * public/ and production served a dead src for several minutes. It degraded to
 * a dark hero with legible type instead of taking the site down.
 */
export const HERO_IMAGE = "/hero-assay.jpg";
export const HERO_IMAGE_SMALL = "/hero-assay-1200.jpg";

/**
 * The phone frame, and why it is a separate photograph rather than a crop.
 *
 * A 390-wide portrait window over a 21:9 landscape frame can show a bright
 * subject *or* carry ~500px of text over darkness. It cannot do both — that
 * was measured, not guessed: the ingot behind the sub-paragraph gave 2.02:1
 * where 4.5:1 is required. So the landscape crop was pushed onto empty slate
 * on phones, which is legible, and which means the one object this brand is
 * built around is invisible to every mobile visitor.
 *
 * A portrait original composed for the aspect ratio solves it properly: the
 * metal sits in the bottom third, below where the text ends, and both get what
 * they need.
 */
export const HERO_IMAGE_PORTRAIT = "/hero-assay-portrait.jpg";
