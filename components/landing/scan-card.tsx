"use client";

import { motion, useReducedMotion } from "motion/react";

import { HallmarkStamp } from "@/components/hallmark-stamp";

/**
 * A clean-looking function that gets assayed on scroll-in: a scan line sweeps
 * the code, the leaking line lights up red, and a "Held" mark strikes — showing
 * "looks right, but breaks" concretely.
 */
export function ScanCard() {
  const reduce = useReducedMotion();

  return (
    <div className="panel relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="font-mono text-xs text-ash">payments/charge.ts</span>
        <motion.span
          initial={reduce ? false : { opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.35, type: "spring", stiffness: 300, damping: 18 }}
        >
          <HallmarkStamp state="held" animate={false} size="sm" />
        </motion.span>
      </div>

      <div className="relative overflow-hidden">
        <pre className="overflow-x-auto px-5 py-5 font-mono text-[13px] leading-7 text-ivory-dim">
          <div>
            <span className="text-iris-soft">export</span>{" "}
            <span className="text-iris-soft">async function</span> charge(req){" "}
            {"{"}
          </div>
          <div>{"  const order = await createOrder(req.body);"}</div>
          <motion.div
            className="-mx-2 rounded px-2"
            initial={reduce ? false : { backgroundColor: "rgba(0,0,0,0)" }}
            whileInView={{ backgroundColor: "rgba(181,68,58,0.18)" }}
            viewport={{ once: true }}
            transition={{ delay: 1.1, duration: 0.4 }}
          >
            {'  logger.info("charge", { body: req.body });'}{" "}
            <span className="text-oxblood-soft">{"// leaks card.number"}</span>
          </motion.div>
          <div>{"  return order;"}</div>
          <div>{"}"}</div>
        </pre>

        {!reduce && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-[linear-gradient(to_bottom,transparent,color-mix(in_srgb,var(--color-iris)_32%,transparent),transparent)]"
            initial={{ y: -56, opacity: 0 }}
            whileInView={{ y: [-56, 200], opacity: [0, 1, 1, 0] }}
            viewport={{ once: true }}
            transition={{ duration: 1.15, times: [0, 0.12, 0.85, 1], ease: "linear" }}
          />
        )}
      </div>
    </div>
  );
}
