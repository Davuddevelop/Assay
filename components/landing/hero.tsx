"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type Variants,
} from "motion/react";

import { Button } from "@/components/ui/button";
import { GitHubMark } from "@/components/icons";
import { ProductMock } from "@/components/landing/product-mock";

const container: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const headline: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const word: Variants = {
  hidden: { opacity: 0, y: "0.5em" },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

export function Hero() {
  const reduce = useReducedMotion();
  const initial = reduce ? false : "hidden";

  // cursor parallax for the product
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 100, damping: 20, mass: 0.4 });
  const sy = useSpring(py, { stiffness: 100, damping: 20, mass: 0.4 });
  const prodX = useTransform(sx, (v) => v * 14);
  const prodY = useTransform(sy, (v) => v * 10);

  function handleMove(e: React.MouseEvent) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }
  function handleLeave() {
    px.set(0);
    py.set(0);
  }

  return (
    <section
      className="relative overflow-hidden"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div className="relative mx-auto w-full max-w-5xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
        <motion.div variants={container} initial={initial} animate="shown">
          <motion.p
            variants={item}
            className="mx-auto inline-flex items-center gap-2 rounded-pill border border-border bg-surface/50 py-1 pl-1.5 pr-3.5 text-xs text-ivory-dim"
          >
            <span className="rounded-pill bg-iris/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-iris-soft">
              New
            </span>
            Independent checks for AI-written code
          </motion.p>

          <motion.h1
            variants={headline}
            className="mx-auto mt-7 max-w-3xl font-display text-[2.9rem] font-semibold leading-[1.03] tracking-[-0.035em] text-ivory sm:text-7xl"
          >
            <motion.span variants={word} className="inline-block">
              Certified,
            </motion.span>{" "}
            <motion.span variants={word} className="inline-block">
              not
            </motion.span>{" "}
            <motion.span
              variants={word}
              className="font-accent inline-block text-[1.06em] font-normal tracking-normal text-iris-soft"
            >
              assumed.
            </motion.span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-ivory-dim sm:text-lg"
          >
            An independent checkpoint for the code you ship with AI — your tests,
            a security scan, and your own rules, then the hallmark.
          </motion.p>

          <motion.div variants={item} className="mt-9">
            {/* glassy connect-a-repo field */}
            <div className="glass mx-auto flex max-w-md items-center gap-2 rounded-pill border border-border py-1.5 pl-5 pr-1.5">
              <GitHubMark className="h-4 w-4 shrink-0 text-ash" />
              <input
                aria-label="Repository URL"
                placeholder="github.com/you/your-repo"
                className="min-w-0 flex-1 bg-transparent text-sm text-ivory outline-none placeholder:text-ash"
              />
              <Button href="/login" variant="primary" size="sm">
                Connect
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {["Your tests", "Security scan", "Your rules", "AI review"].map(
                (chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface/40 px-3 py-1 text-xs text-ivory-dim"
                  >
                    <span className="h-1 w-1 rounded-full bg-iris-soft" />
                    {chip}
                  </span>
                ),
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* the product, framed, centered, on its aurora — with cursor parallax */}
        <motion.div style={{ x: prodX, y: prodY }} className="relative">
          <motion.div
            className="relative mt-20"
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="pointer-events-none absolute left-1/2 top-[-260px] h-[640px] w-[1080px] max-w-[150vw] -translate-x-1/2">
              <div aria-hidden className="aurora absolute inset-0" />
            </div>
            <div className="float-soft relative">
              <ProductMock className="mx-auto max-w-3xl text-left" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
