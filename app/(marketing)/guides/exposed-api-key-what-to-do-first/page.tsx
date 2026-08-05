import type { Metadata } from "next";

import { Eyebrow } from "@/components/section-heading";
import { GuideFooter } from "@/components/guide-footer";
import { guideBySlug } from "@/lib/guides";

const SLUG = "exposed-api-key-what-to-do-first";
const guide = guideBySlug(SLUG)!;

export const metadata: Metadata = {
  alternates: { canonical: `/guides/${SLUG}` },
  title: guide.title,
  description: guide.summary,
};

const ORDER = [
  {
    n: "01",
    title: "Rotate the key",
    body: "In the provider's dashboard — Stripe, OpenAI, Supabase, wherever it came from — issue a new key and revoke the old one. Not later, not after you've tidied the code. The old key works until you revoke it, and everything else you do is theatre until this is done.",
  },
  {
    n: "02",
    title: "Put the new one somewhere the browser can't reach",
    body: "An environment variable read by a server route or an edge function. If your builder offers 'secrets' or 'environment variables', that's the place. If the value ends up anywhere in your frontend code, you've just repeated the mistake with a fresher key.",
  },
  {
    n: "03",
    title: "Move the call, not just the key",
    body: "The reason the key was in the browser is that the browser was making the call. Moving the key without moving the call breaks your app, so you'll be tempted to move it back. The request has to happen on a server that holds the key and returns only the result.",
  },
  {
    n: "04",
    title: "Check what it was used for",
    body: "Provider dashboards keep request logs. Look at the window between when the key shipped and when you rotated it, for usage you can't account for — unfamiliar volumes, unfamiliar times, requests you didn't write.",
  },
  {
    n: "05",
    title: "Re-check the live app",
    body: "Not the code — the deployed site. Old builds, cached bundles and preview deployments can outlive the fix. The only thing that proves it's gone is fetching the site the way a stranger does and finding nothing.",
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
        The instinct is to delete the line and redeploy. That fixes the file and
        does nothing about the key, which is the part that&rsquo;s actually
        exposed. Order matters more than speed here.
      </p>

      <div className="mt-14 space-y-5 text-base leading-relaxed text-ivory-dim">
        <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
          Why deleting it isn&rsquo;t enough
        </h2>
        <p>
          A key in your frontend code has been downloaded by every visitor,
          every bot and every crawler that has loaded your site. It may sit in
          someone&rsquo;s browser cache, in a CDN edge node, in the Internet
          Archive, and — if your repo is public — in git history, where deleting
          the current version changes nothing.
        </p>
        <p className="border-l-2 border-border-strong pl-5 text-ivory">
          The only action that closes it is revoking the key at the provider.
          Everything else is housekeeping.
        </p>
      </div>

      <h2 className="mt-14 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
        The order
      </h2>
      <ol className="mt-8 space-y-8">
        {ORDER.map((s) => (
          <li key={s.n} className="border-t border-line pt-6">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs tracking-[0.2em] text-ash">
                {s.n}
              </span>
              <h3 className="font-display text-xl font-bold tracking-[-0.015em] text-ivory">
                {s.title}
              </h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ivory-dim">
              {s.body}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-14 space-y-5 text-base leading-relaxed text-ivory-dim">
        <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
          Which keys actually matter
        </h2>
        <p>
          Not every key in your bundle is a problem, and panicking about the
          harmless ones makes it harder to see the real one.
        </p>
        <ul className="space-y-4">
          {[
            ["Meant to be public", "Stripe publishable keys (pk_live_…), Supabase anon keys, Firebase web config, Google Maps keys restricted to your domain. These are designed to ship. Check the restrictions, don't panic."],
            ["Never public", "Anything labelled secret, service_role, private or admin — sk_live_…, sb_secret_…, service_role JWTs, database connection strings with a password in them. One of these in a bundle is an emergency."],
          ].map(([label, body]) => (
            <li key={label} className="flex gap-4">
              <span aria-hidden className="mt-2.5 h-px w-5 shrink-0 bg-border-strong" />
              <span className="text-sm leading-relaxed">
                <span className="text-ivory">{label} — </span>
                {body}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-ash">
          A key that&rsquo;s meant to be public can still be misconfigured. A
          Google API key with no domain restriction is someone else&rsquo;s free
          quota; a Firebase config with open database rules is the same problem
          as an open Supabase table.
        </p>

        <h2 className="mt-14 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
          How it got there
        </h2>
        <p>
          Almost always the same way: you asked for a feature that needed a
          third-party service, and the fastest thing that worked was calling
          that service straight from the page. It ran, the preview looked right,
          and nothing anywhere said &ldquo;this value is now public.&rdquo;
        </p>
      </div>

      <GuideFooter slug={SLUG} />
    </div>
  );
}
