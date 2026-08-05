import type { Metadata } from "next";
import Link from "next/link";

import { Eyebrow } from "@/components/section-heading";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  alternates: { canonical: "/client-handoff" },
  title: "What to show your client before you invoice — Assay",
  description:
    "You built their app in a week and it works. Before you send the invoice, hand them an independent security check with your name nowhere on it — dated, in plain English, with every fix attached.",
};

/**
 * The client-handoff page.
 *
 * Deliberately not "/for-agencies". Both direct competitors already say they
 * serve agencies, and a page pitched at a whole customer segment ends up
 * pitched at nobody. This one is about a single moment — the app is finished,
 * the invoice is about to go out, and the client is quietly wondering whether
 * this thing is safe.
 *
 * That moment is where an independent check is worth actual money rather than
 * being a nice-to-have, and it's the only moment where a built-in platform
 * scanner is structurally useless: the client will not accept the builder's
 * own opinion of the builder's own work as proof.
 *
 * Everything claimed here is true today. The report genuinely has a letterhead,
 * a check date and a print stylesheet as of 99979d2 — this page was written
 * after that shipped, not in anticipation of it.
 */

const OBJECTIONS = [
  {
    q: "Why not just use the platform's own scanner?",
    a: "Because your client is not going to accept it, and they're right not to. Lovable checking a Lovable app is the builder grading its own work — the same system that made every decision is the one deciding those decisions were safe. That's fine as a first pass for you. It is not proof for someone else.",
  },
  {
    q: "Why not Snyk, or a real audit?",
    a: "If the budget is there, get the audit — it's a person, with time, actively trying to break the specific app, and nothing automated replaces that. Assay is for the far more common case: a four-figure project where a full audit costs more than the build did, and the honest alternative is currently nothing at all.",
  },
  {
    q: "I already checked it myself.",
    a: "You did, and you're the maker. That's the whole argument on the rest of this site — it applies to you exactly as much as it applies to the AI. You're not going to find the thing you didn't think of, because you didn't think of it.",
  },
];

export default function ClientHandoffPage() {
  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
      <Eyebrow label="Client handoff" />
      <h1 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.08] tracking-[-0.025em] text-ivory">
        Prove it to your client, not just to yourself
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-ivory-dim">
        You built their app in a week. It works, it looks good, and the invoice
        is ready to go. Somewhere in the client&rsquo;s head is a question they
        may not even ask out loud: <em>is this thing safe?</em>
      </p>

      <div className="mt-14 space-y-5 text-base leading-relaxed text-ivory-dim">
        <p>
          Right now the only answer most freelancers can give is &ldquo;yes, I
          checked.&rdquo; Which is not an answer. It&rsquo;s the person who
          built it vouching for the thing they built, and everyone in the
          conversation knows it.
        </p>
        <p className="text-ivory">
          The fix is boring and it&rsquo;s the same one every other industry
          uses: hand over a check that didn&rsquo;t come from you.
        </p>
      </div>

      <h2 className="mt-16 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
        What you actually hand over
      </h2>
      <p className="mt-4 text-base leading-relaxed text-ivory-dim">
        A dated report on the live app, written for someone who can&rsquo;t read
        code. It carries the URL that was checked, the date it was checked, and
        every issue in plain English — and it prints straight to PDF, so it goes
        in the handoff email next to the invoice.
      </p>
      <ul className="mt-8 space-y-4">
        {[
          "The app URL and the date, on the document — an undated report isn't evidence of anything.",
          "Every finding in plain language. Not \"BOLA on /users\" — \"anyone can currently read every user's email address\".",
          "The exact fix for each one, so anything it finds is something you can close before you send it.",
          "A short account of what Assay did and didn't keep. Your client's data is not stored, and the report says so in writing.",
        ].map((line) => (
          <li key={line} className="flex gap-4">
            <span aria-hidden className="mt-2.5 h-px w-5 shrink-0 bg-border-strong" />
            <span className="text-sm leading-relaxed text-ivory-dim">{line}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Button href="/sample" variant="ghost" size="md">
          See the report you&rsquo;d be sending
        </Button>
      </div>

      <h2 className="mt-16 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
        The part your client can check themselves
      </h2>
      <div className="mt-4 space-y-5 text-base leading-relaxed text-ivory-dim">
        <p>
          A report you hand over is still a report <em>you</em> handed over.
          So the mark isn&rsquo;t an image you paste into a document — it&rsquo;s
          a link, and it re-checks itself.
        </p>
        <p className="text-ivory">
          Your client can open it without trusting you, or us. It shows the
          current standing of the live app, not the day you ran the scan.
        </p>
        <p>
          Which means it can go against you, and that&rsquo;s the point. If the
          app stops passing after handoff, the mark revokes itself in public and
          nobody — not you, not Assay — can hold it open. A mark that can only
          ever say yes isn&rsquo;t evidence of anything.
        </p>
        <p className="text-sm text-ash">
          It never publishes what&rsquo;s wrong, though. A public page listing a
          live app&rsquo;s weaknesses would be a gift to an attacker, so the
          detail goes to whoever owns the app and nowhere else.
        </p>
      </div>

      <h2 className="mt-16 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
        The obvious objections
      </h2>
      <dl className="mt-8 space-y-8">
        {OBJECTIONS.map((o) => (
          <div key={o.q}>
            <dt className="text-lg font-medium text-ivory">{o.q}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-ivory-dim">{o.a}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-16 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
        Scanning an app you built for someone else
      </h2>
      <div className="mt-4 space-y-5 text-base leading-relaxed text-ivory-dim">
        <p>
          Assay only runs against apps you own or are authorised to test, and
          you confirm that before a scan starts. Building the app under contract
          is exactly that authorisation — but if you&rsquo;ve already handed
          over the keys and the relationship is finished, ask them first. It
          takes one message and it keeps you on the right side of a line that
          matters.
        </p>
        <p>
          Everything Assay checks is what any visitor to the app can already
          reach. It never logs in, never changes anything, and never keeps your
          client&rsquo;s data.{" "}
          <Link
            href="/about"
            className="text-ivory underline decoration-line underline-offset-4 hover:decoration-ivory"
          >
            What it doesn&rsquo;t check is written down too
          </Link>{" "}
          — worth reading before you put it in front of a client, so you never
          promise more than it does.
        </p>
      </div>

      <div className="mt-16 border-t border-line pt-10">
        <p className="text-base leading-relaxed text-ivory-dim">
          Free for your first app, no account needed for a first verdict. Run it
          on the next project you&rsquo;re about to hand over and see what comes
          back.
        </p>
        <div className="mt-6">
          <Button href="/try" variant="primary" size="lg">
            Check an app
          </Button>
        </div>
      </div>
    </div>
  );
}
