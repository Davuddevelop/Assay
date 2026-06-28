import { cn } from "@/lib/utils";

/** A pulsing placeholder block for loading states. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-[var(--radius-control)] bg-surface/70", className)}
    />
  );
}
