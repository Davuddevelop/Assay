import type { Metadata } from "next";
import Link from "next/link";

import { Eyebrow } from "@/components/section-heading";
import { GuideFooter } from "@/components/guide-footer";
import { guideBySlug } from "@/lib/guides";

const SLUG = "is-my-ai-built-app-safe-to-publish";
const guide = guideBySlug(SLUG)!;

export const metadata: Metadata = {
  alternates: { canonical: `/guides/${SLUG}` },
  title: guide.title,
  description: guide.summary,
};

const CHECKS = [
  {
    n: "01",
    title: "Is Row Level Security on, with policies?",
    why: "This is the one that actually leaks real people's data, and it's the most common finding by a distance.",
    how: "Supabase dashboard → Table Editor. Any table showing 'Unrestricted' is readable by the public right now. Note that RLS being *enabled* isn't the finish line — a table with RLS on and a policy of USING (true) is open too.",
  },
  {
    n: "02",
    title: "Is there a secret key in your JavaScript?",
    why: "A leaked service_role or Stripe secret key hands over everything the key can do, and it's already been downloaded by everyone who opened your site.",
    how: "F12 → Sources, or view-source and search the bundles for sk_live, service_role, sb_secret, and 'password'. Anything labelled secret, private or admin should not be there.",
  },
  {
    n: "03",
    title: "Can a stranger download your uploads?",
    why: "Storage buckets default to public in most builder templates, and profile photos and ID documents end up in them.",
    how: "Open a file URL from your app in a private browsing window. If it loads without signing in, so can anyone with the link — and bucket listings are often browsable, which means they don't even need the link.",
  },
  {
    n: "04",
    title: "Is .env being served?",
    why: "It gets deployed by accident, and automated scanners find it within hours of a site going live.",
    how: "Visit yourapp.com/.env in a private window. Also try /.git/config. Both should 404. If either returns content, treat every value in it as compromised and rotate.",
  },
  {
    n: "05",
    title: "Does anything work that shouldn't?",
    why: "No scanner catches this, including ours. It's the one that needs you.",
    how: "Sign in as one test user, note an ID from the URL, then sign in as a second and try to open the first one's records. If you can see them, that's a real problem and no tool would have told you.",
  },
  {
    n: "06",
    title: "Do you send basic security headers?",
    why: "Defence in depth, not an emergency. Worth doing before you grow, not before you launch.",
    how: "Any header-checking tool, or the Network tab: look for Content-Security-Policy, Strict-Transport-Security, X-Frame-Options and X-Content-Type-Options on the main document.",
  },
  {
    n: "07",
    title: "Do you know what you'd do if it went wrong?",
    why: "Not a technical check. If personal data leaked tomorrow, the cost is mostly determined by how fast you notice and who you tell.",
    how: "Know where your provider's logs are, know how to rotate every key you use, and — if you're shipping for a client — know who you'd call.",
  },
];

export default function Page() {
  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
      <Eyebrow label="Guide" />
      <h1 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-ivory">
        {guide.title}
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-ivory-dim">
        Seven checks, in the order that matters. The first four are where nearly
        every real problem lives; the fifth is the one no tool can do for you.
        None of it requires reading code.
      </p>

      <div className="mt-14 space-y-5 text-base leading-relaxed text-ivory-dim">
        <p>
          A thing worth saying before the list: &ldquo;built with AI&rdquo;
          isn&rsquo;t the problem. The problem is that the fastest path through
          any builder leaves a few doors open, nothing in the process closes
          them, and the app works perfectly either way — so there&rsquo;s no
          moment where you find out.
        </p>
        <p className="border-l-2 border-border-strong pl-5 text-ivory">
          Your app working is not evidence that it&rsquo;s safe. It works
          identically whether the database is locked or wide open.
        </p>
      </div>

      <ol className="mt-14 space-y-10">
        {CHECKS.map((c) => (
          <li key={c.n} className="border-t border-line pt-6">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs tracking-[0.2em] text-ash">
                {c.n}
              </span>
              <h2 className="font-display text-xl font-bold tracking-[-0.015em] text-ivory">
                {c.title}
              </h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ivory-dim">
              <span className="text-ivory">Why: </span>
              {c.why}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ivory-dim">
              <span className="text-ivory">How: </span>
              {c.how}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-16 space-y-5 text-base leading-relaxed text-ivory-dim">
        <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
          What this checklist doesn&rsquo;t cover
        </h2>
        <p>
          It&rsquo;s a floor, not a ceiling. It won&rsquo;t find flaws in your
          business logic, anything behind a login that only breaks under a
          specific sequence of actions, or a vulnerability in a dependency you
          didn&rsquo;t know you had. A real penetration test is a person
          spending days trying to break your specific app, and nothing automated
          replaces that.
        </p>
        <p>
          What it will do is catch the things that leak data through the front
          door, which is where nearly all of the actual damage in AI-built apps
          has come from so far.{" "}
          <Link
            href="/about"
            className="text-ivory underline decoration-line underline-offset-4 hover:decoration-ivory"
          >
            We keep a list of our own limits too.
          </Link>
        </p>
      </div>

      <GuideFooter slug={SLUG} />
    </div>
  );
}
