import { Eyebrow } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { ScanCard } from "@/components/landing/scan-card";

export function Problem() {
  return (
    <section className="edge-b">
      {/* `[&>*]:min-w-0` is load-bearing: a grid item defaults to
          `min-width:auto`, so the code sample in ScanCard — long lines that
          can't wrap — pushed this track to 494px inside a 375px viewport and
          the whole home page scrolled sideways. The `<pre>` already had
          `overflow-x-auto`; the item wrapping it is what refused to shrink. */}
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 xl:max-w-7xl xl:py-28 lg:grid-cols-2 lg:gap-16 [&>*]:min-w-0">
        <Reveal>
          <Eyebrow label="The problem" />
          {/* No italic accent word here. It was in six of six home-page
              headlines, which made it a template rather than a device — the
              hero keeps the only one on the page. */}
          <h2 className="mt-5 font-display text-2xl font-bold leading-[1.1] tracking-[-0.02em] text-ivory sm:text-[2rem] xl:text-[2.4rem]">
            Your app looks finished.
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
