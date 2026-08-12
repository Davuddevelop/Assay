import type { Metadata } from "next";

import { StatCard } from "@/components/share/stat-card";

/**
 * The share-card render target: /share/stat-card
 *
 * Deliberately top-level rather than inside (marketing) or (app) — those route
 * groups own the nav and footer, and this page has to be nothing but the card
 * so a 1200×1200 screenshot has no chrome to crop out.
 *
 * Two ways to drive it, both without touching the component:
 *
 *   1. Edit CURRENT below. That is the normal path for a new post.
 *   2. Override any field in the query string, for a one-off:
 *      /share/stat-card?value=47&of=90&headline=...&f=Most%20common|RLS%20off
 *      Repeat `f` once per finding, as "Label|Text".
 *
 * noindex: this is a production route on a public domain, and a bare stat
 * graphic has no business turning up in search results next to the real pages.
 */
export const metadata: Metadata = {
  title: "Share card — Assay",
  robots: { index: false, follow: false },
};

/** The current post. Edit this for the next one. */
const CURRENT = {
  label: "First batch · week one",
  value: "120",
  of: "200",
  headline: "apps scanned had at least one real issue.",
  context:
    "Every one of them was built with an AI tool and shipped as finished. None of the owners knew.",
  findings: [
    { label: "Most common", text: "Row-Level Security never turned on" },
    { label: "Second most common", text: "API key exposed in the browser bundle" },
  ],
  footer: "Free scan, no signup — assaysecurity.com",
};

/** `?f=Label|Text`, repeated. Anything without a "|" is skipped rather than
 *  rendered as a finding with an empty label. */
function parseFindings(raw: string | string[] | undefined) {
  if (!raw) return null;
  const list = (Array.isArray(raw) ? raw : [raw])
    .map((entry) => {
      const [label, ...rest] = entry.split("|");
      return { label: label.trim(), text: rest.join("|").trim() };
    })
    .filter((f) => f.label && f.text);
  return list.length > 0 ? list : null;
}

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function StatCardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = await searchParams;

  return (
    <>
      {/* Next's dev-mode indicator floats in the bottom-left corner and lands
          in the screenshot. It only exists in development, but this route's
          entire purpose is being captured, so it goes. */}
      <style>{`nextjs-portal { display: none !important; }`}</style>
      <StatCard
        label={one(q.label) ?? CURRENT.label}
        value={one(q.value) ?? CURRENT.value}
        of={one(q.of) ?? CURRENT.of}
        headline={one(q.headline) ?? CURRENT.headline}
        context={one(q.context) ?? CURRENT.context}
        findings={parseFindings(q.f) ?? CURRENT.findings}
        footer={one(q.footer) ?? CURRENT.footer}
      />
    </>
  );
}
