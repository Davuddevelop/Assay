import { Button } from "@/components/ui/button";

// SWING 3 — "Light inversion": stark paper background, black type, one iris
// accent. The opposite of the dark-aurora look — instantly, obviously different.
export default function SwingLight() {
  return (
    <main
      className="relative min-h-screen overflow-hidden px-6 py-24 sm:px-12"
      style={{ backgroundColor: "#f2efe8", color: "#131313" }}
    >
      {/* hard grid lines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.6]"
        style={{
          backgroundImage:
            "linear-gradient(#0000000d 1px, transparent 1px), linear-gradient(90deg, #0000000d 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-[0.28em]" style={{ color: "#5b5b5b" }}>
            Assay — security hallmark
          </span>
          <span
            className="rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-white"
            style={{ backgroundColor: "#5b5cf0" }}
          >
            Certified
          </span>
        </div>

        <h1 className="mt-24 font-serif text-[4rem] leading-[0.9] tracking-[-0.02em] sm:text-[9rem]">
          Don&rsquo;t publish
          <br />
          on a{" "}
          <span className="font-accent italic" style={{ color: "#5b5cf0" }}>
            guess
          </span>
          .
        </h1>

        <div className="mt-16 flex flex-col gap-8 border-t pt-10 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: "#0000001a" }}>
          <p className="max-w-md text-lg leading-relaxed" style={{ color: "#3a3a3a" }}>
            Paste your app&rsquo;s link. Assay finds the exposed keys and open databases
            vibe-coded apps ship with — and gives you the exact fix.
          </p>
          <a
            href="/try"
            className="inline-flex shrink-0 items-center justify-center rounded-full px-8 py-4 text-base font-semibold text-white"
            style={{ backgroundColor: "#131313" }}
          >
            Scan my app →
          </a>
        </div>
      </div>
    </main>
  );
}
