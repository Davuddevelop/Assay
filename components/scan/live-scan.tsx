"use client";

import { useEffect, useRef, useState } from "react";

import { ScanReport } from "@/components/scan/scan-report";
import type { ScanRow, ScanFindingRow } from "@/lib/db/types";

interface DoneData {
  scan: ScanRow;
  findings: ScanFindingRow[];
  /** True until the plain-English pass lands, so the report can say so. */
  explaining: boolean;
}

/**
 * The live scan feed: opens the streaming endpoint and prints each step as it
 * happens — the app tearing through your code in real time — then reveals the
 * report. This is the "watch it work" moment that makes a scan feel like an
 * expert auditing you, not a button that did nothing.
 */
export function LiveScan({ target }: { target: string }) {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState<DoneData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctrl = new AbortController();

    (async () => {
      try {
        const res = await fetch(`/api/scan/stream?url=${encodeURIComponent(target)}`, {
          signal: ctrl.signal,
        });
        if (!res.body) throw new Error("no stream");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        // Tracked locally as well as in state: when the stream ends we need to
        // know whether a verdict ever arrived, and setState isn't readable here.
        let settled = false;

        for (;;) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n");
          buf = parts.pop() ?? "";
          for (const part of parts) {
            if (!part.trim()) continue;
            const evt = JSON.parse(part);
            if (evt.type === "log") setLines((l) => [...l, evt.line]);
            else if (evt.type === "done") {
              settled = true;
              setDone({ scan: evt.scan, findings: evt.findings, explaining: !!evt.explaining });
            } else if (evt.type === "explained") {
              setDone((d) => (d ? { ...d, findings: evt.findings, explaining: false } : d));
            } else if (evt.type === "error") {
              settled = true;
              setError(evt.message);
            }
          }
        }

        // A stream can end without ever sending a verdict — the platform caps a
        // function at 60s and kills it mid-scan, taking the connection with it.
        // Without this branch the loop just exited and the reader was left
        // watching a dead log feed forever, with no error and no way back.
        if (!settled && !ctrl.signal.aborted) {
          setError(
            "The scan was cut short before it finished — that usually means the app took too long to respond. Try again; it often works second time.",
          );
        }
      } catch {
        if (!ctrl.signal.aborted) setError("We couldn't reach that app.");
      }
    })();

    return () => ctrl.abort();
  }, [target]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [lines]);

  // The report wins over a late error on purpose: once a verdict has been
  // delivered, a connection dropping during the plain-English pass must not
  // replace a finished report with a failure.
  if (done) {
    return (
      <div className="mt-12">
        {done.explaining && (
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.16em] text-ash">
            Writing plain-English fixes…
          </p>
        )}
        <ScanReport scan={done.scan} findings={done.findings} showNextStep />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-12 rounded-card border border-oxblood/40 bg-oxblood/10 p-6">
        <p className="font-display text-lg font-bold text-ivory">Couldn&rsquo;t scan that app.</p>
        <p className="mt-1 text-sm text-ivory-dim">{error}</p>
      </div>
    );
  }

  return (
    <div className="mt-12 overflow-hidden rounded-card border border-line bg-onyx">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-oxblood/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-gold/50" />
        <span className="h-2.5 w-2.5 rounded-full bg-iris/50" />
        <span className="ml-2 font-mono text-xs text-ash">assay — scanning {target}</span>
      </div>
      <div ref={feedRef} className="max-h-80 overflow-y-auto px-5 py-4 font-mono text-[13px] leading-relaxed">
        {lines.map((line, i) => (
          <div
            key={i}
            className={line.startsWith("⚠") ? "text-oxblood-soft" : "text-ivory-dim"}
          >
            <span className="mr-2 text-ash">{line.startsWith("⚠") ? "" : "→"}</span>
            {line}
          </div>
        ))}
        <div className="mt-1 flex items-center gap-2 text-iris-soft">
          <span className="inline-block h-3.5 w-2 animate-pulse bg-iris-soft" />
        </div>
      </div>
    </div>
  );
}
