"use client";

import { useEffect, useRef, useState } from "react";

import { HallmarkMark } from "@/components/wordmark";
import { Spinner } from "@/components/ui/spinner";
import { relativeTime } from "@/lib/data/derive";
import type { ActivityEvent } from "@/lib/monitor/activity";
import { cn } from "@/lib/utils";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const KIND_TONE: Record<ActivityEvent["kind"], string> = {
  baseline: "text-ivory",
  steady: "text-ivory",
  regression: "text-oxblood-soft",
  fixed: "text-iris-soft",
};

function AgentAvatar() {
  return (
    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-iris-soft">
      <HallmarkMark className="h-3.5 w-3.5" />
    </span>
  );
}

/**
 * The app's own chat with its agent. The re-check history renders as messages
 * FROM Assay — every check the agent ran is something it "said" — and the
 * owner can type back: ask what a finding means, whether it's safe to launch,
 * what changed. Answers come grounded in this app's real scan data.
 */
export function AppAgent({
  monitorId,
  appUrl,
  events,
}: {
  monitorId: string;
  appUrl: string;
  events: ActivityEvent[]; // oldest → newest
}) {
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [chat, thinking]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || thinking) return;
    const next = [...chat, { role: "user" as const, content: text }];
    setChat(next);
    setInput("");
    setThinking(true);
    try {
      const res = await fetch("/api/monitor/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ monitorId, messages: next }),
      });
      const data = (await res.json()) as { reply?: string };
      setChat((c) => [
        ...c,
        {
          role: "assistant",
          content:
            data.reply ??
            "I couldn't answer that just now — try again in a moment.",
        },
      ]);
    } catch {
      setChat((c) => [
        ...c,
        { role: "assistant", content: "I couldn't answer that just now — try again in a moment." },
      ]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface/40">
      {/* thread */}
      <div className="max-h-[60vh] space-y-5 overflow-y-auto p-5 sm:p-6">
        {/* the agent's own history — every check is a message from Assay */}
        {events.length === 0 && (
          <div className="flex gap-3">
            <AgentAvatar />
            <div className="min-w-0">
              <p className="text-sm leading-relaxed text-ivory-dim">
                I&rsquo;m watching <span className="font-mono text-ivory">{appUrl}</span>.
                The first baseline check runs shortly — from then on I re-check the
                moment you ship a change, and everything I do shows up here.
              </p>
            </div>
          </div>
        )}
        {events.map((e) => (
          <div key={e.id} className="flex gap-3">
            <AgentAvatar />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                <span className={cn("text-sm font-semibold", KIND_TONE[e.kind])}>{e.headline}</span>
                {e.scoreDelta !== null && e.scoreDelta !== 0 && (
                  <span
                    className={cn(
                      "font-mono text-[11px]",
                      e.scoreDelta < 0 ? "text-oxblood-soft" : "text-iris-soft",
                    )}
                  >
                    {e.scoreDelta > 0 ? "+" : ""}
                    {e.scoreDelta}
                  </span>
                )}
                <span className="font-mono text-[11px] text-ash">{relativeTime(e.at)}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-ivory-dim">{e.detail}</p>
            </div>
          </div>
        ))}

        {/* the live conversation */}
        {chat.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-md border border-iris/25 bg-iris/10 px-4 py-2.5 text-sm leading-relaxed text-ivory">
                {m.content}
              </p>
            </div>
          ) : (
            <div key={i} className="flex gap-3">
              <AgentAvatar />
              <p className="max-w-[85%] whitespace-pre-wrap text-sm leading-relaxed text-ivory-dim">
                {m.content}
              </p>
            </div>
          ),
        )}
        {thinking && (
          <div className="flex items-center gap-3">
            <AgentAvatar />
            <span className="flex items-center gap-2 font-mono text-xs text-ash">
              <Spinner className="h-3 w-3" />
              checking the data…
            </span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* composer */}
      <form onSubmit={send} className="flex items-center gap-3 border-t border-line bg-surface/60 p-3 sm:p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Assay about this app — “is it safe to launch?”"
          maxLength={2000}
          className="min-w-0 flex-1 rounded-pill border border-line bg-onyx/60 px-4 py-2.5 text-sm text-ivory placeholder:text-ash focus:border-iris/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={thinking || input.trim().length === 0}
          className="shrink-0 rounded-pill border border-iris/40 bg-iris/15 px-4 py-2.5 text-sm font-semibold text-iris-soft transition-colors hover:bg-iris/25 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
