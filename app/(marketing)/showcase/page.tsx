import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { HallmarkStamp } from "@/components/hallmark-stamp";

export const metadata: Metadata = {
  title: "Components — Assay",
  description: "The Assay design system: tokens, type, and the hallmark.",
};

const COLORS = [
  { name: "onyx · bg", value: "slate-1", className: "bg-onyx" },
  { name: "surface · card", value: "slate-3", className: "bg-surface" },
  { name: "surface-hover", value: "slate-4", className: "bg-surface-hover" },
  { name: "line · border", value: "slate-6", className: "bg-line" },
  { name: "border-strong", value: "slate-8", className: "bg-border-strong" },
  { name: "ash · meta", value: "slate-10", className: "bg-ash" },
  { name: "ivory-dim", value: "slate-11", className: "bg-ivory-dim" },
  { name: "ivory · text", value: "slate-12", className: "bg-ivory" },
  { name: "gold (metallic)", value: "gradient", className: "bg-[image:var(--gradient-gold)]" },
  { name: "gold", value: "#C9A24B", className: "bg-gold" },
  { name: "oxblood · held", value: "#B5443A", className: "bg-oxblood" },
];

function Section({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line py-14">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
        {label}
      </p>
      <h2 className="mt-3 font-display text-2xl text-ivory">{title}</h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export default function ShowcasePage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ash">
          Design system
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.02em] text-ivory">
          The mark and its parts.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ivory-dim">
          Every token and component, shown in place. The hallmark is where Assay
          spends boldness; everything else stays quiet.
        </p>
      </header>

      <Section label="Color" title="Tokens on the dark ground">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {COLORS.map((c) => (
            <div
              key={c.name}
              className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface"
            >
              <div className={`h-16 w-full ${c.className}`} />
              <div className="px-3 py-2.5">
                <p className="font-mono text-xs text-ivory">{c.name}</p>
                <p className="font-mono text-xs text-ash">{c.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section label="Type" title="Three roles, no more">
        <div className="space-y-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
              Display — Fraunces
            </p>
            <p className="mt-2 font-display text-5xl tracking-[-0.02em] text-ivory">
              <span className="font-bold">Certified,</span>{" "}
              <span className="font-light text-ivory-dim">not assumed.</span>
            </p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
              Body — Hanken Grotesk
            </p>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-ivory-dim">
              Sentence case, quiet, readable. The body voice is understated and
              precise — it says what was checked and what was found.
            </p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
              Detail — JetBrains Mono
            </p>
            <p className="mt-2 font-mono text-sm tracking-[0.14em] text-ivory">
              ASSAYED · payments/charge.ts:48 · 42 tests
            </p>
          </div>
        </div>
      </Section>

      <Section label="HallmarkStamp" title="The signature component">
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex flex-col items-start gap-3">
            <HallmarkStamp state="assayed" />
            <span className="font-mono text-xs text-ash">assayed · stamps in</span>
          </div>
          <div className="flex flex-col items-start gap-3">
            <HallmarkStamp state="held" />
            <span className="font-mono text-xs text-ash">held · stamps in</span>
          </div>
          <div className="flex flex-col items-start gap-3">
            <HallmarkStamp state="assayed" animate={false} size="sm" />
            <span className="font-mono text-xs text-ash">small · static</span>
          </div>
          <div className="flex flex-col items-start gap-3">
            <HallmarkStamp state="assayed" animate={false} size="lg" />
            <span className="font-mono text-xs text-ash">large · static</span>
          </div>
        </div>
      </Section>

      <Section label="Button" title="Active voice, gold restraint">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Connect repo</Button>
            <Button variant="ghost">See how it works</Button>
            <Button variant="danger">Disconnect</Button>
            <Button variant="primary" disabled>
              Connecting…
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="sm">
              Small
            </Button>
            <Button variant="primary" size="md">
              Medium
            </Button>
            <Button variant="primary" size="lg">
              Large
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
}
