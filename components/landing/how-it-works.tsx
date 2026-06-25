import { Eyebrow } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";

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
    <section id="how-it-works" className="scroll-mt-16 border-b border-line bg-forest">
      <div className="mx-auto w-full max-w-6xl px-4 py-28 sm:px-6">
        <Reveal>
          <Eyebrow index="03" label="How it works" />
          <h2 className="mt-6 max-w-2xl font-display text-3xl leading-[1.1] text-ivory sm:text-[2.6rem]">
            Three steps, then it stays out of your way.
          </h2>
        </Reveal>

        <ol className="mt-16 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal as="li" key={step.n} delay={i * 90}>
              <div className="panel lift group h-full p-8 hover:border-gold/30">
                <span className="font-mono text-sm tracking-[0.2em] text-ash transition-colors duration-300 group-hover:text-gold">
                  {step.n}
                </span>
                <h3 className="mt-6 text-lg font-medium text-ivory">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ivory-dim">
                  {step.body}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
