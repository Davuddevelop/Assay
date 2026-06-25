"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";

import { Button } from "@/components/ui/button";
import { ProductMock } from "@/components/landing/product-mock";
import { HallmarkSeal } from "@/components/hallmark-seal";

const container: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export function Hero() {
  const reduce = useReducedMotion();
  const initial = reduce ? false : "hidden";

  return (
    <section className="relative overflow-hidden border-b border-line">
      {/* engineering grid + asymmetric light source */}
      <div aria-hidden className="bg-grid absolute inset-0 opacity-60" />
      <div
        aria-hidden
        className="glow absolute right-0 top-8 hidden h-96 w-[34rem] opacity-70 lg:block"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-28 lg:py-36">
        <div className="grid items-center gap-16 lg:grid-cols-12 lg:gap-10">
          {/* Left — the words */}
          <motion.div
            className="lg:col-span-5"
            variants={container}
            initial={initial}
            animate="shown"
          >
            <motion.p
              variants={item}
              className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-ash"
            >
              <span className="h-1 w-1 rounded-full bg-gold" />
              Independent check
            </motion.p>

            <motion.h1
              variants={item}
              className="mt-6 font-display text-5xl leading-[0.95] tracking-[-0.03em] text-ivory sm:text-6xl xl:text-7xl"
            >
              <span className="font-bold">Certified,</span>
              <br />
              <span className="font-light text-ivory-dim">not assumed.</span>
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-7 max-w-md text-base leading-relaxed text-ivory-dim"
            >
              An independent checkpoint for the code you ship with AI — for solo
              developers and vibe-coders. Assay runs your tests, a security scan,
              and a review against your own rules, then strikes the hallmark.
            </motion.p>

            <motion.div variants={item} className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button href="/login" variant="primary" size="lg">
                Connect a repo
              </Button>
              <Button href="/#how-it-works" variant="ghost" size="lg">
                See how it works
              </Button>
            </motion.div>
          </motion.div>

          {/* Right — the product, off-grid, the seal struck last */}
          <div className="relative lg:col-span-7 lg:-mr-6 lg:translate-y-2 xl:-mr-12">
            <div
              aria-hidden
              className="glow absolute -inset-x-8 -top-8 bottom-4 -z-10 opacity-70 lg:hidden"
            />
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProductMock className="lg:ml-auto lg:max-w-xl" />
            </motion.div>

            {/* faint gold halo behind the hallmark only */}
            <div
              aria-hidden
              className="glow absolute -right-8 -top-14 h-44 w-44 opacity-40 lg:left-[-4.5rem] lg:right-auto lg:-top-20"
            />
            {/* the signature: the hallmark strikes in, last */}
            <motion.div
              className="absolute -right-3 -top-8 z-10 lg:left-[-3rem] lg:right-auto lg:-top-12"
              initial={reduce ? false : { opacity: 0, scale: 1.14 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.85, type: "spring", stiffness: 320, damping: 18 }}
            >
              <HallmarkSeal animate={false} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
