import { cn } from "@/lib/utils";

/**
 * A numbered editorial eyebrow: a short gold rule, the section index, and a
 * mono label. The quiet signature on every section.
 */
export function Eyebrow({
  index,
  label,
  className,
}: {
  index?: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span aria-hidden className="h-px w-6 bg-gold/70" />
      {index && (
        <span className="font-mono text-xs tracking-[0.2em] text-ash">
          {index}
        </span>
      )}
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
        {label}
      </span>
    </div>
  );
}
