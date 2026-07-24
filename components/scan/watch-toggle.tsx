"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { toggleWatch } from "@/app/(app)/scan/actions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import type { ScanRow } from "@/lib/db/types";

const STEPS = [
  "Turning on continuous monitoring…",
  "Fingerprinting the current build…",
  "Baseline locked — I know exactly what's live now.",
];

/**
 * The retention hook — and it has to *feel* like switching an agent on. When you
 * hit "Watch this app", Assay visibly activates: it steps through establishing a
 * baseline, then settles into a live "Watching" state with a pulse. From then on
 * it re-checks the moment you ship a change and flags anything that breaks.
 */
export function WatchToggle({ scan, watched }: { scan: ScanRow; watched: boolean }) {
  const { notify } = useToast();
  const [, startAction] = useTransition();
  const [activating, setActivating] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [settled, setSettled] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  const isWatching = watched || settled;

  function reduced() {
    return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function runActivation() {
    if (reduced()) {
      setSettled(true);
      return;
    }
    setActivating(true);
    setVisibleSteps(0);
    STEPS.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setVisibleSteps(i + 1), 450 + i * 800));
    });
    timers.current.push(
      window.setTimeout(() => {
        setActivating(false);
        setSettled(true);
      }, 450 + STEPS.length * 800 + 350),
    );
  }

  function startWatching() {
    setBlocked(false);
    startAction(async () => {
      const res = await toggleWatch(scan.app_url, true, scan.id);
      if (res.reason === "limit") {
        setBlocked(true);
        notify({
          tone: "warn",
          title: "You've hit your watch limit",
          message:
            "The free plan watches one app. Upgrade to Pro to keep continuous monitoring on every app you ship.",
          action: { label: "Upgrade to Pro", href: "/billing" },
          duration: 9000,
        });
        return;
      }
      runActivation();
    });
  }

  function stopWatching() {
    startAction(() => {
      void toggleWatch(scan.app_url, false, scan.id);
    });
    setSettled(false);
    setActivating(false);
  }

  // ── activating: the agent visibly turning on ────────────────────────────────
  if (activating) {
    return (
      <div className="panel p-6 sm:p-7">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-iris-soft">
          Starting the agent
        </p>
        <div className="mt-4 space-y-2 font-mono text-[13px]">
          {STEPS.slice(0, visibleSteps).map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-ivory-dim">
              <span className="text-iris-soft">→</span>
              {s}
            </div>
          ))}
          {visibleSteps < STEPS.length && (
            <div className="flex items-center gap-2 text-ash">
              <Spinner className="h-3 w-3" />
              working…
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── watching: live, on the job ──────────────────────────────────────────────
  if (isWatching) {
    return (
      <div className="panel flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-7">
        <div className="min-w-0">
          <p className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.16em] text-iris-soft">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-iris-soft opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-iris" />
            </span>
            Watching
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ivory-dim">
            Assay is on. I re-check this app the moment you ship a change, and flag
            it here if something breaks — before your users find it.
          </p>
        </div>
        <Button variant="ghost" size="md" onClick={stopWatching} className="shrink-0">
          Stop watching
        </Button>
      </div>
    );
  }

  // ── blocked: hit the free watch cap → upsell ────────────────────────────────
  if (blocked) {
    return (
      <div className="panel flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-7">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-iris-soft">
            Watch more apps
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ivory-dim">
            Free watches one app. Upgrade to Pro to watch every app you ship —
            with email alerts the moment a change breaks something.
          </p>
        </div>
        <Button href="/billing" variant="primary" size="md" className="shrink-0">
          Upgrade to Pro
        </Button>
      </div>
    );
  }

  // ── idle: the pitch ─────────────────────────────────────────────────────────
  return (
    <div className="panel flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-7">
      <div className="min-w-0">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-iris-soft">Keep it safe</p>
        <p className="mt-2 text-sm leading-relaxed text-ivory-dim">
          You&rsquo;ll keep editing this app. Put Assay on watch — the moment you
          ship a change that breaks something, it&rsquo;s flagged here before your
          users hit it.
        </p>
      </div>
      <Button variant="primary" size="md" onClick={startWatching} className="shrink-0">
        Watch this app
      </Button>
    </div>
  );
}
