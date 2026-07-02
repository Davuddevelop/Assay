import { Button } from "@/components/ui/button";
import { HallmarkMedallion } from "@/components/landing/hallmark-medallion";

export const metadata = { title: "Assay v2" };

// v2 hero — cinematic centerpiece direction (per the reference sites): a large,
// beautifully-lit object in a dark field carrying confident type. Ours is the
// struck-metal certification medallion — on-brand for a security hallmark, not
// generic decoration. Big image, quiet type, strong depth.
export default function V2Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-onyx">
      {/* deep field */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="v2-grid absolute inset-0 opacity-40" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-iris/40 to-transparent" />
      </div>

      <section className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-12 px-6 pt-28 pb-20 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:px-12">
        {/* left — statement */}
        <div>
          <span className="inline-flex items-center gap-2.5 rounded-pill border border-line bg-surface/50 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-ivory-dim backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-iris" />
            Security hallmark for vibe-coded apps
          </span>

          <h1 className="mt-8 font-serif text-[3.6rem] leading-[0.98] tracking-[-0.015em] text-ivory sm:text-[6.5rem]">
            Is your app{" "}
            <span
              className="font-accent text-iris-soft"
              style={{ textShadow: "0 0 44px color-mix(in srgb, var(--color-iris) 55%, transparent)" }}
            >
              safe
            </span>{" "}
            to publish?
          </h1>

          <p className="mt-7 max-w-md text-base leading-relaxed text-ivory-dim sm:text-lg">
            Paste your live link. Assay reads your app the way an attacker would, then
            hands you the exact fix — in plain English, no login. Earn the hallmark.
          </p>

          <form
            action="/try"
            method="get"
            className="mt-9 flex w-full max-w-md items-center gap-2 rounded-pill border border-iris/30 bg-surface/60 p-1.5 backdrop-blur"
            style={{ boxShadow: "0 0 60px -22px color-mix(in srgb, var(--color-iris) 60%, transparent)" }}
          >
            <input
              name="url"
              placeholder="yourapp.lovable.app"
              className="flex-1 bg-transparent px-5 py-2.5 font-mono text-sm text-ivory outline-none placeholder:text-ash"
            />
            <Button type="submit" variant="primary" size="md">Scan</Button>
          </form>

          <div className="mt-8 flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.16em] text-ash">
            <span>No login</span>
            <span className="h-3 w-px bg-line" />
            <span>~15s</span>
            <span className="h-3 w-px bg-line" />
            <span>Lovable · Bolt · Replit · v0</span>
          </div>
        </div>

        {/* right — the lit centerpiece */}
        <div className="relative flex items-center justify-center">
          <HallmarkMedallion className="w-[78%] max-w-md lg:w-full" />
        </div>
      </section>
    </main>
  );
}
