import { HallmarkStamp } from "@/components/hallmark-stamp";
import { Eyebrow } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

function Cell({
  className,
  label,
  title,
  body,
  children,
}: {
  className?: string;
  label: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "panel lift flex flex-col p-6 hover:border-gold/30 sm:p-7",
        className,
      )}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
        {label}
      </p>
      <h3 className="mt-4 text-lg font-medium text-ivory">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ivory-dim">{body}</p>
      {children && <div className="mt-6 flex-1">{children}</div>}
    </div>
  );
}

const RULES = [
  { text: "never log card data", held: false },
  { text: "all API routes require auth", held: false },
  { text: "no secrets in source", held: true },
];

export function FeatureBento() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto w-full max-w-6xl px-4 py-28 sm:px-6">
        <Reveal>
          <Eyebrow label="What it checks" />
          <h2 className="mt-6 max-w-2xl font-display text-3xl font-bold leading-[1.04] tracking-[-0.02em] text-ivory sm:text-[2.7rem]">
            Three reads on every change, then one mark.
          </h2>
        </Reveal>

        <Reveal delay={90}>
          <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-6">
            {/* Rules — the differentiator, given the room */}
            <Cell
              className="md:col-span-4"
              label="Your rules"
              title="The rules you wrote, in plain language"
              body="Assay holds each change against your .assay rules — the conventions you'd otherwise have to catch by eye in every review."
            >
              <div className="overflow-hidden rounded-[var(--radius-control)] border border-line bg-onyx">
                <div className="border-b border-line px-4 py-2 font-mono text-xs text-ash">
                  .assay/rules
                </div>
                <ul className="divide-y divide-line/70">
                  {RULES.map((r) => (
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
                        {r.held ? "held" : "ok"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Cell>

            {/* Tests */}
            <Cell
              className="md:col-span-2"
              label="Your tests"
              title="Your suite, run for real"
              body="The change has to pass the tests your repo already defines."
            >
              <div className="flex items-baseline gap-2">
                <span className="font-display text-5xl text-ivory">42</span>
                <span className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
                  / 42 passed
                </span>
              </div>
            </Cell>

            {/* Security */}
            <Cell
              className="md:col-span-2"
              label="Security scan"
              title="Nothing unsafe ships"
              body="Secrets, injection, and the patterns that quietly leak."
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-pill)] border border-border text-sm text-ivory-dim">
                  ✓
                </span>
                <span className="font-mono text-xs text-ivory-dim">
                  no issues found
                </span>
              </div>
            </Cell>

            {/* The hallmark */}
            <Cell
              className="md:col-span-4"
              label="The hallmark"
              title="One mark you can trust"
              body="Sound work is Assayed. Anything that breaks a test or a rule is Held — never a vague green light."
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
