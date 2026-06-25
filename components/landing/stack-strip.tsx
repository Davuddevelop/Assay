const STACK = [
  "TypeScript",
  "Python",
  "Go",
  "Rust",
  "Node.js",
  "Next.js",
  "React",
  "pytest",
  "Jest",
  "Vitest",
  "GitHub Actions",
  "ESLint",
  "Ruby",
  "Java",
];

/**
 * A quiet, infinitely-scrolling strip of the stacks Assay checks — movement
 * and credibility in one band. Pauses under reduced-motion.
 */
export function StackStrip() {
  return (
    <section className="border-y border-line py-10">
      <p className="mb-6 text-center font-mono text-xs uppercase tracking-[0.2em] text-ash">
        Works with your stack
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent)]">
        <div className="marquee-track flex w-max items-center gap-12 pr-12">
          {[...STACK, ...STACK].map((item, i) => (
            <span
              key={i}
              className="whitespace-nowrap font-mono text-sm text-ivory-dim"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
