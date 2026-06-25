import { cn } from "@/lib/utils";

/**
 * A crisp mono section label — a small gold tick and the label. No decorative
 * numbering; structure should encode meaning, not ornament.
 */
export function Eyebrow({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold" />
      <span className="font-mono text-xs uppercase tracking-[0.22em] text-gold-text">
        {label}
      </span>
    </div>
  );
}
