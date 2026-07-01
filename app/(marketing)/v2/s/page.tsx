import { Button } from "@/components/ui/button";

// SWING 2 — "Brutalist split": hard left-aligned giant type, asymmetric, exposed
// grid. Off-center magazine energy — the opposite of centered-and-symmetric.
const ROWS = [
  { k: "Exposed keys", v: "clean", ok: true },
  { k: "Open database", v: "3 tables", ok: false },
  { k: "Security headers", v: "missing", ok: false },
];

export default function SwingSplit() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-onyx">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-12 px-6 py-24 lg:grid-cols-[1.25fr_1fr] lg:px-12">
        {/* left — statement */}
        <div className="border-l-2 border-iris/50 pl-6 sm:pl-10">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-iris-soft">Security hallmark · est. 2026</p>
          <h1 className="mt-7 font-serif text-[4rem] leading-[0.92] tracking-[-0.01em] text-ivory sm:text-[7.5rem]">
            Ship it{" "}
            <span className="font-accent text-iris-soft">safe</span>.
            <br />
            Or don&rsquo;t ship.
          </h1>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-ivory-dim">
            Assay reads your vibe-coded app the way an attacker would — then hands you the
            exact fix, in plain English.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button href="/try" variant="primary" size="lg">Scan my app</Button>
            <Button href="/sample" variant="ghost" size="lg">See a sample</Button>
          </div>
        </div>

        {/* right — exposed data panel */}
        <div className="relative">
          <div className="flex items-end justify-between border-b border-line pb-4">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-ash">Verdict</span>
            <span className="font-display text-7xl font-bold leading-none text-oxblood-soft sm:text-8xl">36</span>
          </div>
          <div className="divide-y divide-line">
            {ROWS.map((r) => (
              <div key={r.k} className="flex items-center justify-between py-4 font-mono text-sm">
                <span className="text-ivory-dim">{r.k}</span>
                <span className={r.ok ? "text-iris-soft" : "text-oxblood-soft"}>
                  {r.ok ? "✓ " : "✗ "}{r.v}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 inline-flex items-center gap-2 border border-oxblood/50 px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-oxblood-soft">
            ⚠ Held — not safe to publish
          </div>
        </div>
      </div>
    </main>
  );
}
