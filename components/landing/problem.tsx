import { Eyebrow } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { ScanCard } from "@/components/landing/scan-card";

export function Problem() {
  return (
    <section className="edge-b">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-28 sm:px-6 xl:max-w-7xl xl:py-36 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <Eyebrow label="The problem" />
          <h2 className="mt-6 font-display text-3xl font-bold leading-[1.04] tracking-[-0.02em] text-ivory sm:text-[2.7rem] xl:text-[3.3rem]">
            Your app{" "}
            <span className="font-accent text-[1.08em] font-normal tracking-normal text-iris-soft">
              looks
            </span>{" "}
            finished.
          </h2>
          <div className="mt-7 space-y-4 text-base leading-relaxed text-ivory-dim sm:text-lg xl:text-xl">
            <p>
              It runs. It signs people in. It takes payments. So you publish it —
              and ship the security holes that come baked into vibe-coded apps:
              your database left open to the public, a secret key sitting in the
              browser, endpoints anyone can call.
            </p>
            <p>
              Looking finished isn&rsquo;t being safe. You need an independent check
              that finds what&rsquo;s exposed before your users — or an attacker — do.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <ScanCard />
        </Reveal>
      </div>
    </section>
  );
}
