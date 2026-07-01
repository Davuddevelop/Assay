import { Button } from "@/components/ui/button";
import { HallmarkStamp } from "@/components/hallmark-stamp";

// Direction B — "Cinematic product": centered headline over a strong aurora,
// with a floating glass scan-report card as the hero visual. Premium SaaS depth.
export default function LabB() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 pt-32 pb-24 text-center">
      <div aria-hidden className="aurora pointer-events-none absolute inset-x-0 -top-20 h-[560px] opacity-70" />
      <div className="relative mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-iris-soft">
          For apps built with Lovable · Bolt · Replit · v0
        </p>
        <h1 className="mt-6 font-display text-5xl font-bold leading-[1.02] tracking-[-0.035em] text-ivory sm:text-7xl">
          Is your app{" "}
          <span className="font-accent font-normal text-iris-soft">safe</span> to publish?
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ivory-dim">
          Paste your link. Assay finds the security holes vibe-coded apps leak with —
          and hands you the exact fix.
        </p>

        {/* Floating scan-report card */}
        <div className="panel relative mx-auto mt-16 max-w-lg overflow-hidden p-8 text-left shadow-2xl">
          <div aria-hidden className="aurora pointer-events-none absolute inset-x-0 -top-24 h-48 opacity-40" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-mono text-xs text-ash">discovery-nook-desk.lovable.app</p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-ivory">
                Safe to publish.
              </h2>
              <p className="mt-1 text-sm text-ivory-dim">No critical or risky issues.</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 border-iris font-display text-iris-soft">
                <span className="text-xl font-bold leading-none">98</span>
                <span className="font-mono text-[8px] uppercase tracking-[0.16em]">score</span>
              </div>
              <HallmarkStamp state="assayed" animate={false} />
            </div>
          </div>
          <div className="relative mt-6 space-y-2 border-t border-line pt-5 font-mono text-xs text-ash">
            <p>✓ No exposed keys</p>
            <p>✓ Row-Level Security enforced</p>
            <p>✓ Security headers present</p>
          </div>
        </div>

        <div className="mt-12">
          <Button href="/try" variant="primary" size="md">Scan my app</Button>
        </div>
      </div>
    </main>
  );
}
