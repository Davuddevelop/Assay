import type { Metadata } from "next";

import { ScanReport } from "@/components/scan/scan-report";
import { Button } from "@/components/ui/button";
import { getDemoReport } from "@/lib/scan/demo";

export const metadata: Metadata = {
  title: "Sample report — Assay",
  description: "See exactly what an Assay security report looks like.",
};

export const dynamic = "force-dynamic";

export default async function SamplePage() {
  const { scan, findings } = await getDemoReport();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-center font-mono text-xs uppercase tracking-[0.18em] text-ash">
        Sample report
      </p>
      <p className="mx-auto mt-3 max-w-md text-center text-sm text-ivory-dim">
        This is a real Assay report for a deliberately-vulnerable demo app — every
        issue in plain language, with the exact fix to paste back into your builder.
      </p>
      <div className="mt-8">
        <ScanReport scan={scan} findings={findings} />
      </div>
      <div className="mt-10 flex justify-center">
        <Button href="/try" variant="primary" size="lg">
          Scan your own app
        </Button>
      </div>
    </div>
  );
}
