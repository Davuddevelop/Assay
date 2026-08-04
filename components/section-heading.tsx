import { cn } from "@/lib/utils";

/**
 * A crisp mono section label — a hairline rule and the label.
 *
 * It used to be an accent dot plus accent-coloured text, on every section of
 * every page. Six of them down the home page meant the accent was doing no
 * work: when everything is highlighted, nothing is. The rule reads as
 * typographic structure rather than decoration, and it hands the accent budget
 * back to the one element per screen that should own it.
 */
export function Eyebrow({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span aria-hidden className="h-px w-6 bg-border-strong" />
      <span className="font-mono text-xs uppercase tracking-[0.22em] text-ash">
        {label}
      </span>
    </div>
  );
}
