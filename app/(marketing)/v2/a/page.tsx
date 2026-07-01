import { Button } from "@/components/ui/button";

// v2 title option A — headline in Instrument Serif (same family as the italic
// "safe" accent), regular weight. Delicate, high-contrast, editorial; the
// headline and the accent finally belong to each other.
export default function V2A() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 pt-28 pb-24 text-center sm:pt-36">
      <div aria-hidden className="aurora pointer-events-none absolute inset-x-0 -top-24 h-[520px] opacity-55" />
      <div className="relative mx-auto max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface/60 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ivory-dim">
          <span className="rounded-pill bg-iris/20 px-1.5 py-0.5 text-[10px] text-iris-soft">New</span>
          For apps built with Lovable, Bolt, Replit &amp; v0
        </span>

        <h1 className="mt-9 font-serif text-[3.4rem] leading-[1.02] tracking-[-0.01em] text-ivory sm:text-8xl">
          Is your app{" "}
          <span className="font-accent text-iris-soft">safe</span> to publish?
        </h1>

        <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-ivory-dim sm:text-lg">
          You built it with AI and wired it to real users and payments. Assay finds the
          security holes vibe-coded apps leak with — and hands you the exact fix.
        </p>

        <form action="/try" method="get" className="mx-auto mt-10 flex max-w-xl items-center gap-2 rounded-pill border border-line bg-surface/60 p-1.5">
          <input
            name="url"
            placeholder="yourapp.lovable.app"
            className="flex-1 bg-transparent px-4 py-2.5 font-mono text-sm text-ivory outline-none placeholder:text-ash"
          />
          <Button type="submit" variant="primary" size="md">Scan my app</Button>
        </form>

        <p className="mt-6 font-mono text-xs uppercase tracking-[0.16em] text-ash">Instrument Serif — regular</p>
      </div>
    </main>
  );
}
