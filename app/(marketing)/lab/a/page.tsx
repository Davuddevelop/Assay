import { Button } from "@/components/ui/button";

// Direction A — "Editorial hallmark": oversized Fraunces, hairline rule, mono
// index. Gallery/print feel; maximum type presence, lots of black.
export default function LabA() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 pt-40 pb-24 sm:px-12">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-xs uppercase tracking-[0.32em] text-iris-soft">
          Security Hallmark — No. 001
        </p>
        <h1 className="mt-8 font-display text-6xl font-bold leading-[0.92] tracking-[-0.045em] text-ivory sm:text-[8.5rem]">
          Is your app{" "}
          <span className="font-accent font-normal text-iris-soft">safe</span>
          <br />
          to publish?
        </h1>

        <div className="mt-12 h-px w-full bg-line" />

        <div className="mt-12 grid gap-12 sm:grid-cols-[1.5fr_1fr]">
          <p className="max-w-xl text-lg leading-relaxed text-ivory-dim">
            You built it with AI and wired it to real users and payments. Assay
            reads the app the way an attacker would — then hands you the exact fix.
          </p>
          <ul className="space-y-3 border-l border-line pl-6 font-mono text-sm text-ash">
            <li><span className="text-iris-soft">01</span> — Exposed keys</li>
            <li><span className="text-iris-soft">02</span> — Open database</li>
            <li><span className="text-iris-soft">03</span> — Missing protections</li>
            <li><span className="text-iris-soft">04</span> — Plain-language fixes</li>
          </ul>
        </div>

        <div className="mt-14">
          <Button href="/try" variant="primary" size="md">Scan my app →</Button>
        </div>
      </div>
    </main>
  );
}
