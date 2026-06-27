import type { Metadata } from "next";
import Link from "next/link";

import { Eyebrow } from "@/components/section-heading";

export const metadata: Metadata = {
  title: "Docs — Assay",
  description: "How Assay checks your code and strikes the hallmark.",
};

const STEPS = [
  {
    title: "1. Install the GitHub App",
    body: "Add Assay to the repositories you want checked. It reads the repos you select and the checks they define — nothing else.",
  },
  {
    title: "2. Write your rules",
    body: "In plain language, tell Assay what must never happen — “never log card data”, “all API routes require auth”. It checks every change against them.",
  },
  {
    title: "3. Open a pull request",
    body: "On each push Assay runs your tests, a security scan, and your rules, then posts a Check Run and a single comment: ✓ Assayed or ⚠ Held, with the file and line.",
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
        Assay is an independent checkpoint for the code you ship with AI. Three
        steps to your first hallmark.
      </p>

      <div className="mt-12 space-y-8">
        {STEPS.map((s) => (
          <div key={s.title} className="rounded-[var(--radius-card)] border border-line bg-surface/40 p-6">
            <h2 className="text-lg font-medium text-ivory">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ivory-dim">{s.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-12 text-sm text-ash">
        Ready?{" "}
        <Link href="/login" className="text-iris-soft hover:text-ivory">
          Connect a repository →
        </Link>
      </p>
    </div>
  );
}
