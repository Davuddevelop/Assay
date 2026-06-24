const STEPS = [
  {
    n: "01",
    title: "Connect your repo",
    body: "Sign in with GitHub and point Assay at a repository. No config to write — it reads your tests and your rules.",
  },
  {
    n: "02",
    title: "It checks every change",
    body: "On each push, Assay runs your test suite, a security scan, and a review against the rules you wrote in plain language.",
  },
  {
    n: "03",
    title: "It strikes the hallmark",
    body: "Sound work is marked Assayed. Anything that breaks a test or a rule is Held — with the file, the line, and a plain explanation.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 border-b border-line">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
          How it works
        </p>
        <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight text-ivory sm:text-4xl">
          Three steps, then it stays out of your way.
        </h2>

        <ol className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.n} className="bg-obsidian-2 p-8">
              <span className="font-mono text-sm tracking-[0.2em] text-ash">
                {step.n}
              </span>
              <h3 className="mt-5 text-lg font-medium text-ivory">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ivory-dim">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
