import type { Metadata } from "next";

import { ScanReport } from "@/components/scan/scan-report";
import { Button } from "@/components/ui/button";
import { getDemoReport } from "@/lib/scan/demo";

export const metadata: Metadata = {
  alternates: { canonical: "/sample" },
  title: "Sample Security Scan Report — Assay",
  description:
    "See a real Assay security report for a deliberately vulnerable demo app — every issue explained in plain English, with the exact fix, no signup required.",
};

export const dynamic = "force-dynamic";

export default async function SamplePage() {
  const { scan, findings } = await getDemoReport();

  return (
    <div className="mx-auto w-full max-w-4xl xl:max-w-5xl px-4 py-12 sm:px-6">
      <p className="no-print text-center font-mono text-xs uppercase tracking-[0.18em] text-ash">
        Sample report
      </p>
      <p className="no-print mx-auto mt-3 max-w-md text-center text-sm text-ivory-dim">
        An example report for a deliberately-vulnerable demo app — every issue in
        plain language, with the exact fix to paste back into your builder.
      </p>
      <div className="mt-8">
        <ScanReport scan={scan} findings={findings} />
      </div>

      {/* The one thing a sample report structurally can't show.
          Re-check runs the finding's own check against a live app, so it
          cannot work here — this report describes a demo fixture that was
          never deployed (scan-report.tsx gates it on `!scan.is_demo`). Which
          meant the loop that most distinguishes this product was invisible at
          the exact moment someone is deciding whether to try it: a stranger
          reading the sample saw findings and fixes, and no reason to believe
          anything closes them.

          Described rather than faked. A dead button that looks live is worse
          than a sentence that's true. */}
      <div className="no-print mx-auto mt-10 max-w-xl border-t border-line pt-8 text-center">
        <h2 className="font-display text-lg font-semibold tracking-[-0.015em] text-ivory">
          In a real report, every finding has a re-check.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ivory-dim">
          Paste the fix into your builder, then press it. Assay runs that one
          check against your live app again and tells you whether the issue is
          actually gone &mdash; usually a single request, fast enough to use as
          a loop while you work. It can&rsquo;t run here, because this report
          describes a demo app that was never deployed.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ivory-dim">
          You can&rsquo;t confirm your own fix any more than you can clear your
          own app. &ldquo;I applied the change&rdquo; and &ldquo;the hole is
          closed&rdquo; are different claims.
        </p>
      </div>

      <div className="no-print mt-10 flex justify-center">
        <Button href="/try" variant="primary" size="lg">
          Scan your own app
        </Button>
      </div>
    </div>
  );
}
