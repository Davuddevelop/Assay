import { HallmarkStamp } from "@/components/hallmark-stamp";
import { Eyebrow } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { SpotlightCard } from "@/components/spotlight-card";
import { CountUp } from "@/components/count-up";
import { cn } from "@/lib/utils";

function Cell({
  className,
  icon,
  label,
  title,
  body,
  children,
}: {
  className?: string;
  icon: React.ReactNode;
  label: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <SpotlightCard
      className={cn(
        "panel lift-glow flex flex-col p-6 sm:p-7",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-border bg-surface text-iris-soft">
          {icon}
        </span>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
          {label}
        </p>
      </div>
      <h3 className="mt-5 text-lg font-medium text-ivory">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ivory-dim">{body}</p>
      {children && <div className="mt-6 flex-1">{children}</div>}
    </SpotlightCard>
  );
}

const I = {
  rules: (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M5 4h14M5 9h14M5 14h9M5 19h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  tests: (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M5 12.5 10 17 19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  security: (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path d="M12 3 5 6v5c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  hallmark: (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8.2 12.3 10.8 14.8 15.8 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const TABLES = [
  { text: "profiles — open to the public", held: true },
  { text: "orders — open to the public", held: true },
  { text: "messages — protected", held: false },
];

export function FeatureBento() {
  return (
    <section className="edge-b relative overflow-hidden">
      <div
        aria-hidden
        className="aura-soft pointer-events-none absolute left-1/2 top-24 h-[420px] w-[820px] max-w-[120vw] -translate-x-1/2"
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-28 sm:px-6">
        <Reveal>
          <Eyebrow label="What it checks" />
          <h2 className="mt-6 max-w-2xl font-display text-3xl font-bold leading-[1.04] tracking-[-0.02em] text-ivory sm:text-[2.7rem]">
            The holes vibe-coded apps ship with, then one honest{" "}
            <span className="font-accent text-[1.08em] font-normal tracking-normal text-iris-soft">
              mark
            </span>
            .
          </h2>
        </Reveal>

        <Reveal delay={90}>
          <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-6">
            {/* Open database — the #1 failure, given the room */}
            <Cell
              className="md:col-span-4"
              icon={I.security}
              label="Open database"
              title="Your database, locked down"
              body="The most common vibe-coding failure: Supabase row-level security left off, so anyone can read — or change — every user's data. Assay probes it the safe, read-only way and tells you what's exposed."
            >
              <div className="overflow-hidden rounded-[var(--radius-control)] border border-line bg-onyx">
                <div className="border-b border-line px-4 py-2 font-mono text-xs text-ash">
                  your tables
                </div>
                <ul className="divide-y divide-line/70">
                  {TABLES.map((r) => (
                    <li
                      key={r.text}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 font-mono text-xs"
                    >
                      <span className="text-ivory-dim">{r.text}</span>
                      <span
                        className={cn(
                          "text-[10px] uppercase tracking-[0.16em]",
                          r.held ? "text-oxblood-soft" : "text-ivory-dim",
                        )}
                      >
                        {r.held ? "exposed" : "ok"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Cell>

            {/* Exposed secrets */}
            <Cell
              className="md:col-span-2"
              icon={I.tests}
              label="Exposed secrets"
              title="Keys that shouldn't ship"
              body="Secret keys, Stripe keys, and tokens hiding in your app's code — found and flagged, never stored."
            >
              <div className="rounded-[var(--radius-control)] border border-oxblood/40 bg-oxblood/5 px-3 py-2.5 font-mono text-xs text-oxblood-soft">
                sk_live_••••••••••••  exposed
              </div>
            </Cell>

            {/* Safety score */}
            <Cell
              className="md:col-span-2"
              icon={I.rules}
              label="Safety score"
              title="One number to act on"
              body="Every finding rolls up into a single score, worst issues first."
            >
              <div className="flex items-baseline gap-2">
                <CountUp to={92} className="font-display text-5xl text-ivory" />
                <span className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
                  / 100
                </span>
              </div>
            </Cell>

            {/* The hallmark */}
            <Cell
              className="md:col-span-4"
              icon={I.hallmark}
              label="The verdict"
              title="A clear yes or no"
              body="No critical or risky issues? You get a clean bill of health — safe to publish. Anything unsafe is Held, with the exact fix to paste back."
            >
              <div className="flex flex-wrap items-center gap-3">
                <HallmarkStamp state="assayed" animate={false} />
                <HallmarkStamp state="held" animate={false} />
              </div>
            </Cell>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
