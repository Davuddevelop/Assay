const STACK = [
  "Lovable",
  "Bolt",
  "Replit",
  "v0",
  "Supabase",
  "Vercel",
  "Next.js",
  "React",
  "Firebase",
  "Stripe",
  "Netlify",
  "Cursor",
];

/**
 * A quiet, infinitely-scrolling strip of the builders Assay scans — movement
 * and credibility in one band. Pauses under reduced-motion.
 */
export function StackStrip() {
  return (
    <section className="border-y border-line py-10">
      <p className="mb-6 text-center font-mono text-xs uppercase tracking-[0.2em] text-ash">
        Scans apps built with
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent)]">
        {/* Two identical copies; each cell carries equal trailing space (pr-12)
            so the -50% loop seams perfectly with no gap. */}
        <div className="marquee-track flex w-max items-center">
          {[...STACK, ...STACK].map((item, i) => (
            <span
              key={i}
              className="whitespace-nowrap pr-12 font-mono text-sm text-ivory-dim"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
