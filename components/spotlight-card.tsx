"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * A card with a soft iris spotlight that follows the cursor. The glow position
 * is written to --mx/--my and rendered by the `.spotlight::after` rule.
 */
export function SpotlightCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={cn("spotlight relative overflow-hidden", className)}
    >
      {children}
    </div>
  );
}
