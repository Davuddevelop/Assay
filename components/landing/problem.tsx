export function Problem() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto w-full max-w-3xl px-4 py-24 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
          The problem
        </p>
        <h2 className="mt-4 font-display text-3xl leading-tight text-ivory sm:text-4xl">
          AI writes code that looks right.
        </h2>
        <div className="mt-6 space-y-4 text-base leading-relaxed text-ivory-dim">
          <p>
            The generated function reads cleanly. It compiles. The diff looks
            reasonable. So it ships — and then it logs a card number, skips the
            edge case your tests cover, or quietly breaks the thing two files
            over.
          </p>
          <p>
            Looking right is not the same as being right. What you need is an
            independent check that doesn&rsquo;t trust the code just because it
            reads well — one that runs your tests, scans for what&rsquo;s unsafe,
            and holds the change against the rules you set.
          </p>
        </div>
      </div>
    </section>
  );
}
