import type { Metadata } from "next";
import Link from "next/link";

import { Eyebrow } from "@/components/section-heading";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: "About Assay — who builds it, and what it actually checks",
  description:
    "Assay is an independent security check for apps built with AI tools. Here's who builds it, exactly what it looks for, and — just as important — what it doesn't.",
};

/**
 * The page that says who is behind this and what the product actually is.
 *
 * It exists because the rest of the site was all product copy and no person.
 * Someone deciding whether to paste their client's app URL into a security
 * tool is deciding whether to trust whoever runs it, and there was nowhere on
 * the site that answered that.
 *
 * The section that matters most is "What Assay doesn't do". Every line in it
 * is a real limitation of the current scanner, and it stays accurate as the
 * scanner changes — if a check ships, the line comes off.
 */

const DOES = [
  {
    label: "Exposed keys",
    body: "Reads your app the way a browser does and searches the shipped JavaScript for credentials that shouldn't be there — Stripe secret keys, service-role keys, API tokens.",
  },
  {
    label: "An open database",
    body: "If your app talks to Supabase or Firebase, Assay asks that database for data using nothing but the public key in your bundle. If it answers, anyone can ask the same question.",
  },
  {
    label: "Public file storage",
    body: "Checks whether the buckets your app uploads to will hand their contents to a stranger.",
  },
  {
    label: "Files that shouldn't be served",
    body: "A handful of exact paths — .env, .env.production, .git — that get deployed by accident and read by scanners within hours.",
  },
  {
    label: "Missing browser protections",
    body: "Response headers: Content-Security-Policy, HSTS, clickjacking and MIME-sniffing protection.",
  },
];

const DOESNT = [
  "It is not a penetration test. A pentest is a person, with time and creativity, trying to break your specific app. Assay is a machine looking for a fixed list of known mistakes. The two are not substitutes, and anyone who tells you otherwise is selling something.",
  "It doesn't look behind a login. Everything Assay checks is what a stranger with your URL can reach. Whatever your app does after someone signs in is currently untested.",
  "It doesn't understand your business logic. If your pricing can be manipulated, or one customer can see another's invoice through a legitimate-looking request, Assay will not catch that.",
  "It doesn't audit your source code. It only sees what you shipped to the browser.",
  "A clean result is not a guarantee. It means the specific checks above found nothing. That's genuinely worth knowing — most of the apps that fail, fail on exactly these things — but it is a floor, not a ceiling.",
];

export default function AboutPage() {
  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
      <Eyebrow label="About" />
      <h1 className="mt-6 font-display text-4xl font-bold tracking-[-0.025em] text-ivory">
        Who builds this
      </h1>

      <div className="mt-8 space-y-5 text-base leading-relaxed text-ivory-dim">
        <p>
          Assay is one person. Not a team, not a company with a security
          practice behind it — me, writing the scanner, the copy, and this
          sentence.
        </p>
        <p>
          It started from something that kept happening. People were shipping
          real apps — with real users and real payment details in them — built
          in an afternoon with Lovable or Bolt or Replit. Good apps, mostly.
          But the database was wide open, or the Stripe key was sitting in the
          JavaScript, and nobody had told them, because the only thing that had
          ever looked at that code was the same AI that wrote it.
        </p>
        <p>
          That&rsquo;s the whole argument, and it&rsquo;s why Assay is a separate thing
          rather than a feature inside a builder:{" "}
          <span className="text-ivory">
            the tool that wrote your code can&rsquo;t be the one that vouches
            for it.
          </span>{" "}
          Not because it&rsquo;s dishonest — because it&rsquo;s grading its own
          work, and it will grade generously.
        </p>
      </div>

      <h2 className="mt-16 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
        What Assay actually does
      </h2>
      <p className="mt-4 text-base leading-relaxed text-ivory-dim">
        It fetches your live app from the outside, with no credentials, and
        runs five checks. That&rsquo;s the entire product.
      </p>
      <dl className="mt-8 space-y-5">
        {DOES.map((item) => (
          <div
            key={item.label}
            className="rounded-[var(--radius-card)] border border-line bg-surface/40 p-6"
          >
            <dt className="text-lg font-medium text-ivory">{item.label}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-ivory-dim">
              {item.body}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-sm leading-relaxed text-ivory-dim">
        Every check is read-only. Assay never sends an exploit, never writes or
        changes anything, and never stores what it reads — when it proves a
        database is readable, the values are masked before they ever reach your
        screen and are never written down. It only runs against apps you tell it
        you own.
      </p>

      <h2 className="mt-16 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
        What Assay doesn&rsquo;t do
      </h2>
      <p className="mt-4 text-base leading-relaxed text-ivory-dim">
        This section is here on purpose. A security tool that won&rsquo;t name
        its own gaps is asking you to trust it more than it has earned.
      </p>
      <ul className="mt-8 space-y-5">
        {DOESNT.map((line) => (
          <li key={line} className="flex gap-4">
            <span
              aria-hidden
              className="mt-2.5 h-px w-5 shrink-0 bg-border-strong"
            />
            <span className="text-sm leading-relaxed text-ivory-dim">
              {line}
            </span>
          </li>
        ))}
      </ul>

      <h2 className="mt-16 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
        About the hallmark
      </h2>
      <div className="mt-4 space-y-5 text-base leading-relaxed text-ivory-dim">
        <p>
          The name comes from assaying — the old test for whether a bar of
          metal is the purity it claims to be. An assay office doesn&rsquo;t
          make the silver and doesn&rsquo;t sell it. It just tests it,
          independently, and strikes a small mark if it passes.
        </p>
        <p>
          Assay&rsquo;s mark means one specific thing:{" "}
          <span className="text-ivory">
            on this date, these checks were run against this app from the
            outside, and none of them found anything.
          </span>{" "}
          It is not a certification, it doesn&rsquo;t mean an expert reviewed
          your app, and it expires — an app that was clean last month can ship
          a bad deploy tomorrow. That&rsquo;s the honest size of the claim, and
          we won&rsquo;t stretch it.
        </p>
      </div>

      <h2 className="mt-16 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
        Where it is right now
      </h2>
      <div className="mt-4 space-y-5 text-base leading-relaxed text-ivory-dim">
        <p>
          Early. Assay is new, the user count is small, and the list of checks
          is deliberately short — I&rsquo;d rather five checks be genuinely
          good than thirty be roughly right. Breadth is the easy part and
          it&rsquo;s where most scanners go to become useless.
        </p>
        <p>
          If you run a scan and it misses something, or flags something that
          isn&rsquo;t real, I want to know — that&rsquo;s not a support ticket
          to me, it&rsquo;s the most useful thing you can send. It reaches me
          directly at{" "}
          <a
            href="mailto:hello@assaysecurity.com"
            className="text-ivory underline decoration-line underline-offset-4 transition-colors hover:decoration-ivory"
          >
            hello@assaysecurity.com
          </a>
          .
        </p>
      </div>

      <p className="mt-16 text-sm text-ash">
        Want to see it work?{" "}
        <Link href="/try" className="text-iris-soft hover:text-ivory">
          Scan your app →
        </Link>
      </p>
    </div>
  );
}
