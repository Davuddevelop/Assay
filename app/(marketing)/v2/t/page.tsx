import { Button } from "@/components/ui/button";

// SWING 1 — "Command deck": full terminal, monospace, scanlines. No serif, no
// aurora. Hacker/security energy, maximal difference.
export default function SwingTerminal() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-onyx px-6 py-24 font-mono sm:px-10">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(139,139,240,0.05) 0 1px, transparent 1px 3px)" }}
      />
      <div className="relative mx-auto max-w-4xl">
        <p className="text-[11px] uppercase tracking-[0.32em] text-iris-soft">// assay secure terminal — v2</p>

        <h1 className="mt-8 text-3xl font-bold leading-[1.15] text-ivory sm:text-5xl">
          <span className="text-ash">assay ~ %</span> scan{" "}
          <span className="text-iris-soft">yourapp.lovable.app</span>
          <span className="ml-1 inline-block animate-pulse text-iris">▊</span>
        </h1>

        <div className="mt-12 space-y-2.5 text-sm leading-relaxed sm:text-base">
          <p className="text-ash">→ pulling app + 6 bundles…</p>
          <p className="text-iris-soft">✓ TLS valid · security headers · no exposed keys</p>
          <p className="text-gold-text">⚠ supabase anon key detected → probing RLS…</p>
          <p className="text-oxblood-soft">✗ CRITICAL — 3 tables readable unauthenticated</p>
          <p className="pl-6 text-oxblood-soft/80">customers · orders · profiles</p>
        </div>

        <div className="mt-12 border-l-2 border-oxblood/70 bg-oxblood/[0.06] p-6">
          <p className="text-xl font-bold text-oxblood-soft sm:text-2xl">◆ HELD — NOT SAFE TO PUBLISH</p>
          <p className="mt-2 text-sm text-ivory-dim">
            1 critical · score 36/100 · plain-English fix ready to paste back into your builder.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-4">
          <Button href="/try" variant="primary" size="lg">Run your scan →</Button>
          <span className="text-xs text-ash">no login · ~15 seconds</span>
        </div>
      </div>
    </main>
  );
}
