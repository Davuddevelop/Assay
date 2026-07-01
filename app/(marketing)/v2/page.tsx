import { Button } from "@/components/ui/button";
import { HallmarkStamp } from "@/components/hallmark-stamp";

export const metadata = { title: "Assay v2" };

// v2 hero — "futuristic hallmark": a bold, high-contrast environment (deep field,
// strong aurora, a fine technical grid, a live scan console with a sweeping beam)
// carrying a delicate Instrument Serif headline. Boldness from scale + light,
// not font weight.
const CHECKS = [
  { label: "TLS + security headers", state: "ok" },
  { label: "Exposed keys in client code", state: "ok" },
  { label: "Supabase database (RLS)", state: "bad" },
];

export default function V2Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 pt-28 pb-28 sm:pt-32">
      {/* Environment */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="v2-grid absolute inset-0 opacity-[0.55]" />
        <div className="aurora absolute inset-x-0 -top-28 mx-auto h-[620px] max-w-5xl opacity-70" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-iris/40 to-transparent" />
      </div>

      <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
        <span className="inline-flex items-center gap-2.5 rounded-pill border border-line bg-surface/50 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-ivory-dim backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-iris" />
          [ Security hallmark for vibe-coded apps ]
        </span>

        <h1 className="mt-10 font-serif text-[3.8rem] leading-[0.98] tracking-[-0.015em] text-ivory sm:text-[8.5rem]">
          Is your app{" "}
          <span
            className="font-accent text-iris-soft"
            style={{ textShadow: "0 0 40px color-mix(in srgb, var(--color-iris) 55%, transparent)" }}
          >
            safe
          </span>{" "}
          to publish?
        </h1>

        <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-ivory-dim sm:text-lg">
          Paste your live link. Assay reads your app the way an attacker would, then
          hands you the exact fix — in plain English, no login.
        </p>

        {/* Glowing scan input */}
        <form
          action="/try"
          method="get"
          className="mt-10 flex w-full max-w-xl items-center gap-2 rounded-pill border border-iris/30 bg-surface/60 p-1.5 backdrop-blur"
          style={{ boxShadow: "0 0 60px -20px color-mix(in srgb, var(--color-iris) 60%, transparent)" }}
        >
          <input
            name="url"
            placeholder="yourapp.lovable.app"
            className="flex-1 bg-transparent px-5 py-2.5 font-mono text-sm text-ivory outline-none placeholder:text-ash"
          />
          <Button type="submit" variant="primary" size="md">Scan my app</Button>
        </form>

        {/* Live scan console — the futuristic centerpiece */}
        <div className="relative mt-20 w-full max-w-2xl overflow-hidden rounded-frame border border-iris/25 bg-surface/40 backdrop-blur"
          style={{ boxShadow: "0 40px 120px -50px color-mix(in srgb, var(--color-iris) 70%, transparent)" }}>
          {/* sweeping scan beam */}
          <div aria-hidden className="v2-beam pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-iris/25 to-transparent" />

          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-oxblood/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-gold/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-iris/60" />
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ash">assay · scanning</span>
          </div>

          <div className="relative grid gap-4 p-7 text-left sm:grid-cols-[1fr_auto] sm:items-center">
            <ul className="space-y-3 font-mono text-sm">
              {CHECKS.map((c) => (
                <li key={c.label} className="flex items-center gap-3">
                  <span className={c.state === "ok" ? "text-iris-soft" : "text-oxblood-soft"}>
                    {c.state === "ok" ? "✓" : "✗"}
                  </span>
                  <span className="text-ivory-dim">{c.label}</span>
                  {c.state === "bad" && (
                    <span className="rounded-pill border border-oxblood/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-oxblood-soft">
                      exposed
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-4 sm:flex-col sm:items-end">
              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 border-oxblood font-display text-oxblood-soft">
                <span className="text-xl font-bold leading-none">36</span>
                <span className="font-mono text-[8px] uppercase tracking-[0.16em]">score</span>
              </div>
              <HallmarkStamp state="held" animate={false} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
