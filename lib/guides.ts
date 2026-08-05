/**
 * The guide index.
 *
 * One hand-maintained list, not an MDX pipeline or a CMS (CLAUDE.md §2 — don't
 * build for scale we don't have). Adding a guide is: write the page, add a row
 * here. The index page and the sitemap both read from this, so a guide can't
 * exist without being linked or submitted.
 *
 * Pure data, no `server-only`, so it can be imported anywhere and unit-tested.
 */
export interface Guide {
  slug: string;
  title: string;
  /** One sentence, shown on the index. Says what you'll be able to do after. */
  summary: string;
  /** Rough reading time — set it honestly, it's a promise to the reader. */
  minutes: number;
}

export const GUIDES: Guide[] = [
  {
    slug: "why-lovable-apps-ship-with-the-database-open",
    title: "Why Lovable apps ship with the database open",
    summary:
      "Row Level Security is off while you build because it has to be, and nothing ever turns it back on. The mechanism, a 30-second self-check, and the exact fix.",
    minutes: 5,
  },
  {
    slug: "which-supabase-keys-are-safe-in-the-browser",
    title: "Which Supabase keys are safe in the browser",
    summary:
      "The anon key is meant to be public. The service_role key ends your security model. How to tell them apart in ten seconds, and what to do if the wrong one shipped.",
    minutes: 6,
  },
  {
    slug: "exposed-api-key-what-to-do-first",
    title: "An API key leaked into your app. What to do in the next ten minutes",
    summary:
      "Deleting the key from your code does nothing on its own — the old build is still out there and the key still works. The order of operations that actually closes it.",
    minutes: 6,
  },
  {
    slug: "is-my-ai-built-app-safe-to-publish",
    title: "Is my AI-built app safe to publish? A checklist you can run yourself",
    summary:
      "Seven things to check before you put a live URL in front of real users, in the order that matters. No tools required, though we'll check them for you if you'd rather.",
    minutes: 8,
  },
];

export function guideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/** Every other guide — for the "read next" block at the foot of a guide. */
export function otherGuides(slug: string): Guide[] {
  return GUIDES.filter((g) => g.slug !== slug);
}
