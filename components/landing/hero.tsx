"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "motion/react";

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

export function Hero() {
  const reduce = useReducedMotion();
  const initial = reduce ? false : "hidden";

  return (
    <section className="relative overflow-hidden">
      {/* aurora — the cool glow blooming up from below, behind the product */}
      <div
        aria-hidden
        className="aurora pointer-events-none absolute inset-x-0 bottom-0 top-[26%]"
      />

      <div className="relative mx-auto w-full max-w-5xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
        <motion.div variants={container} initial={initial} animate="shown">
          <motion.p
            variants={item}
            className="mx-auto inline-flex items-center gap-2 rounded-pill border border-border bg-surface/50 px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-ivory-dim"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-iris" />
            Independent check for AI code
          </motion.p>

          <motion.h1
            variants={item}
            className="mx-auto mt-7 max-w-3xl font-display text-5xl font-semibold leading-[1.0] tracking-[-0.03em] text-ivory sm:text-7xl"
          >
            Certified, not assumed.
          </motion.h1>

          <motion.p
            variants={item}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ivory-dim sm:text-lg"
          >
            An independent checkpoint for the code you ship with AI. Assay runs
            your tests, a security scan, and a review against your own rules —
            then strikes the hallmark.
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
            <div className="mt-4">
              <Link
                href="/#how-it-works"
                className="text-sm text-ivory-dim transition-colors hover:text-ivory"
              >
                See how it works →
              </Link>
            </div>
          </motion.div>
        </motion.div>

        {/* the product, framed, centered */}
        <motion.div
          className="mt-16"
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <ProductMock className="mx-auto max-w-3xl text-left" />
        </motion.div>
      </div>
    </section>
  );
}
