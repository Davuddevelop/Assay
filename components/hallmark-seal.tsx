import { cn } from "@/lib/utils";

type HallmarkSealProps = {
  /** Stamp in on mount, once. Reduced-motion falls back to a fade. */
  animate?: boolean;
  className?: string;
};

/**
 * The hallmark, made physical: a large round struck seal — the brand's single
 * gold moment, struck in metal (gradient ring + glyph). Strikes in on load.
 */
export function HallmarkSeal({ animate = true, className }: HallmarkSealProps) {
  return (
    <div
      role="status"
      aria-label="Assayed — sound"
      className={cn(
        "h-24 w-24 rounded-[var(--radius-pill)] bg-[image:var(--gradient-gold)] p-px shadow-[0_20px_50px_-20px_rgba(0,0,0,0.85)] sm:h-32 sm:w-32",
        animate && "hallmark-animate",
        className,
      )}
    >
      <div className="flex h-full w-full flex-col items-center justify-center rounded-[var(--radius-pill)] bg-onyx/90 backdrop-blur-sm">
        {/* inner hairline — the second ring of a struck seal */}
        <div className="flex h-[86%] w-[86%] flex-col items-center justify-center rounded-[var(--radius-pill)] border border-gold/25">
          <span
            aria-hidden
            className="gold-metallic text-xl font-semibold leading-none sm:text-3xl"
          >
            ✓
          </span>
          <span className="gold-metallic mt-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.28em]">
            Assayed
          </span>
        </div>
      </div>
    </div>
  );
}
