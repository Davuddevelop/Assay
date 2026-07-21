import type { Metadata } from "next";
import Link from "next/link";

import { Eyebrow } from "@/components/section-heading";

export const metadata: Metadata = {
  title: "Docs — Assay",
  description: "How Assay checks your app and strikes the hallmark.",
};

const STEPS = [
  {
    title: "1. Paste your app's link",
    body: "Sign in, then drop in the URL of your live app — the one built with Lovable, Bolt, Replit, or v0. No install, no code to touch.",
  },
  {
    title: "2. Watch it scan",
    body: "No waiting on a spinner — Assay fetches your app the way a browser does and runs the checks live in front of you: exposed keys, an open database, missing protections.",
  },
  {
    title: "3. Get your report and fixes",
    body: "Every issue is explained in plain language, with the exact prompt to paste back into your builder to fix it. Clean apps earn the hallmark: ✓ Safe to publish or ⚠ Held.",
  },
];

export default function DocsPage() {
  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
      <Eyebrow label="Docs" />
      <h1 className="mt-6 font-display text-4xl font-bold tracking-[-0.025em] text-ivory">
        Getting started
      </h1>
      <p className="mt-5 text-base leading-relaxed text-ivory-dim">
        Assay is a security checkpoint for apps built with AI. Three steps to
        your first hallmark.
      </p>

      <div className="mt-12 space-y-8">
        {STEPS.map((s) => (
          <div key={s.title} className="rounded-[var(--radius-card)] border border-line bg-surface/40 p-6">
            <h2 className="text-lg font-medium text-ivory">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ivory-dim">{s.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs leading-relaxed text-ash">
        Scan only apps you own or are authorized to test — see our{" "}
        <Link href="/acceptable-use" className="text-iris-soft hover:text-ivory">
          Acceptable Use Policy
        </Link>
        .
      </p>

      <p className="mt-8 text-sm text-ash">
        Ready?{" "}
        <Link href="/try" className="text-iris-soft hover:text-ivory">
          Scan your app →
        </Link>
      </p>
    </div>
  );
}
