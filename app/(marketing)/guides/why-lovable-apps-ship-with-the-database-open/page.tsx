import type { Metadata } from "next";

import { Eyebrow } from "@/components/section-heading";
import { GuideFooter } from "@/components/guide-footer";

export const metadata: Metadata = {
  alternates: {
    canonical: "/guides/why-lovable-apps-ship-with-the-database-open",
  },
  title: "Why Lovable apps ship with the database open",
  description:
    "Row Level Security is off while you build, because it has to be — and nothing ever turns it back on. Here's the mechanism, how to check your own app in 30 seconds, and the exact fix.",
};

/**
 * The first written guide.
 *
 * Still hand-written pages rather than a blog engine — no MDX pipeline, no
 * tags, no CMS (CLAUDE.md §2). The only shared machinery is lib/guides.ts,
 * which the index, the sitemap and the read-next footer all derive from, so a
 * guide cannot ship unlinked or unsubmitted.
 *
 * Every number here is stated with its sample size in the same breath. The
 * dataset is small and saying so is the point — §4 says never overclaim, and a
 * security company that inflates its own numbers has no business telling
 * anyone else to be careful.
 */
export default function GuidePage() {
  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
      <Eyebrow label="Guide" />
      <h1 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-ivory">
        Why Lovable apps ship with the database open
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-ivory-dim">
        It isn&rsquo;t carelessness, and it isn&rsquo;t a bug in Lovable. The
        database is open because it has to be while you&rsquo;re building, and
        nothing in the process ever closes it again.
      </p>

      <div className="mt-14 space-y-5 text-base leading-relaxed text-ivory-dim">
        <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
          The mechanism
        </h2>
        <p>
          When your builder wires up Supabase, it gives your app two things: the
          project URL and the <span className="font-mono text-sm text-ivory">anon</span>{" "}
          key. Both are public by design. They ship inside the JavaScript that
          every visitor&rsquo;s browser downloads, and they&rsquo;re supposed
          to — that&rsquo;s how a browser app talks to a database at all.
        </p>
        <p>
          What&rsquo;s meant to stand between that public key and your users&rsquo;
          data is <span className="text-ivory">Row Level Security</span>: rules
          on each table saying who may read which rows. With RLS on and no
          policy written, a table returns nothing. Which means that on day one
          of building, with RLS on, your app appears completely broken — you
          add a table, you fetch from it, you get an empty array.
        </p>
        <p>
          So the fastest way past that wall is to turn RLS off. Every tutorial
          does it. The AI does it. It works instantly, and you get on with
          building the thing you actually wanted to build.
        </p>
        <p className="border-l-2 border-border-strong pl-5 text-ivory">
          Then you ship. Nothing in the deploy asks whether you ever went back.
          The app works perfectly — for you, for your users, and for anyone
          else who opens it.
        </p>

        <h2 className="mt-14 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
          What that actually means
        </h2>
        <p>
          Not &ldquo;a hacker could eventually get in.&rdquo; There is nothing
          to get into. The key is already in the page, and with RLS off the
          database answers whoever asks. Anyone who opens your app, opens
          DevTools, and copies two strings can read every row of every table —
          emails, names, phone numbers, addresses, Stripe customer IDs, whatever
          you store. No login. No account. No exploit.
        </p>
        <p>
          It takes about fifteen seconds, and it is the single most common
          serious problem we find.
        </p>

        <h2 className="mt-14 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
          Check your own app in 30 seconds
        </h2>
        <ol className="list-decimal space-y-3 pl-5 marker:font-mono marker:text-sm marker:text-ash">
          <li>Open your live app and press F12 to open DevTools.</li>
          <li>
            Go to the Network tab and reload. Look for a request to a URL ending
            in <span className="font-mono text-sm text-ivory">.supabase.co</span>.
          </li>
          <li>
            If you see one, your app talks to Supabase from the browser — which
            is fine and normal.
          </li>
          <li>
            Now go to your Supabase dashboard → Table Editor. Any table showing{" "}
            <span className="font-mono text-sm text-ivory">Unrestricted</span>{" "}
            next to its name is readable by the public, right now.
          </li>
        </ol>
        <p>
          That badge is the whole answer. If it says Unrestricted on a table
          holding anything about a person, that data is public.
        </p>

        <h2 className="mt-14 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
          The fix
        </h2>
        <p>
          Paste this into your builder. It&rsquo;s the same prompt Assay hands
          you when it finds this:
        </p>
        <div className="rounded-[var(--radius-control)] border border-iris/30 bg-iris/5 p-5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ivory">
            Turn on Row Level Security for all my tables in Supabase. For each
            table (users, orders), enable RLS and add a policy so that a user
            can only read and edit their own rows (where the row&rsquo;s user_id
            equals auth.uid()). Do not allow public/anonymous read access to any
            table containing personal data.
          </p>
        </div>
        <p>
          Then check the Table Editor again. Every table holding personal data
          should have lost the Unrestricted badge. If your app breaks after
          this, that is the point — it was reading rows it had no business
          reading, and now it has to prove who it is first.
        </p>

        <h2 className="mt-14 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
          What we&rsquo;ve actually seen
        </h2>
        <p>
          Being straight about the sample: Assay is new. Across{" "}
          <span className="text-ivory">26 completed scans</span> so far,{" "}
          <span className="text-ivory">8.3%</span>{" "}
          came back with at least one
          issue rated risky or worse, and two of those were critical. That is a
          small number of scans, most of them on custom domains where we
          can&rsquo;t tell which builder made the app, and it is nowhere near
          enough to tell you what share of Lovable apps in general have this
          problem.
        </p>
        <p>
          What it is enough for: when this problem shows up, it is almost never
          alone and it is almost always the worst thing on the report. We&rsquo;ll
          publish a real rate when we have the scans to back one.
        </p>
      </div>

      <GuideFooter slug="why-lovable-apps-ship-with-the-database-open" />

    </div>
  );
}
