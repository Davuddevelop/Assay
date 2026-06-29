"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/** Copies text to the clipboard with a transient "Copied" confirmation. */
export function CopyButton({ text, label = "Copy fix" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
        copied
          ? "border-iris/50 bg-iris/10 text-iris-soft"
          : "border-border text-ivory-dim hover:border-border-strong hover:text-ivory",
      )}
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
