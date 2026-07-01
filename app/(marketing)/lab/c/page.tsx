import { Button } from "@/components/ui/button";

// Direction C — "Live terminal": a scanning console as the hero. Monospace,
// tech-credible, on-brand for a security tool that reads your app.
const LINES: { t: string; c: string }[] = [
  { t: "$ assay scan discovery-nook-desk.lovable.app", c: "text-ivory" },
  { t: "→ fetching app + 6 bundles…", c: "text-ash" },
  { t: "✓ TLS valid · security headers checked", c: "text-iris-soft" },
  { t: "✓ no exposed keys in client code", c: "text-iris-soft" },
  { t: "⚠ Supabase anon key found — probing RLS…", c: "text-gold-text" },
  { t: "✗ 3 tables readable unauthenticated (customers, orders, profiles)", c: "text-oxblood-soft" },
  { t: "", c: "" },
  { t: "VERDICT: NOT SAFE TO PUBLISH — 1 critical", c: "text-oxblood-soft" },
];

export default function LabC() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-24">
      <div className="mx-auto w-full max-w-3xl text-center">
        <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-[-0.035em] text-ivory sm:text-6xl">
          We read your app like an{" "}
          <span className="font-accent font-normal text-iris-soft">attacker</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-lg text-ivory-dim">
          Paste a link. Watch every check run. Get the exact fix.
        </p>

        {/* Terminal */}
        <div className="panel mx-auto mt-12 max-w-2xl overflow-hidden p-0 text-left">
          <div className="flex items-center gap-2 border-b border-line px-5 py-3">
            <span className="h-3 w-3 rounded-full bg-oxblood/70" />
            <span className="h-3 w-3 rounded-full bg-gold/50" />
            <span className="h-3 w-3 rounded-full bg-iris/50" />
            <span className="ml-3 font-mono text-xs text-ash">assay — scan</span>
          </div>
          <div className="space-y-2 px-6 py-6 font-mono text-sm leading-relaxed">
            {LINES.map((l, i) => (
              <p key={i} className={l.c || "text-ash"}>{l.t || " "}</p>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <Button href="/try" variant="primary" size="md">Run a scan</Button>
        </div>
      </div>
    </main>
  );
}
