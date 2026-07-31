import { cn } from "@/lib/utils";
import { MARK_PATH, MARK_VIEWBOX } from "@/lib/brand";

/**
 * The Assay mark. Monochrome by design — it inherits `currentColor`, so the
 * same component serves the ivory-on-onyx chrome, a dark-on-white icon, and
 * anywhere else it's dropped.
 *
 * The artwork is slightly wider than it is tall, so inside a square box it
 * centres with a little space above and below rather than stretching.
 */
export function HallmarkMark({ className }: { className?: string }) {
  return (
    <svg viewBox={MARK_VIEWBOX} aria-hidden className={cn("h-6 w-6", className)}>
      <path fill="currentColor" fillRule="evenodd" d={MARK_PATH} />
    </svg>
  );
}

/**
 * The Assay wordmark: the mark paired with a tight, modern grotesk lockup.
 */
export function Wordmark({
  className,
  markClassName,
  showMark = true,
}: {
  className?: string;
  markClassName?: string;
  showMark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {showMark && <HallmarkMark className={cn("h-5 w-5 text-ivory", markClassName)} />}
      <span className="font-display text-lg font-semibold tracking-tight text-ivory">
        Assay
      </span>
    </span>
  );
}
