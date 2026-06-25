import { cn } from "@/lib/utils";

type HallmarkSealProps = {
  /** Stamp in on mount, once. Reduced-motion falls back to a fade. */
  animate?: boolean;
  className?: string;
};

/**
 * The hallmark, made physical: a large round struck seal — the brand's single
 * gold moment. Distinct from the small pill `HallmarkStamp`. Strikes in on load.
 */
export function HallmarkSeal({ animate = true, className }: HallmarkSealProps) {
  return (
    <div
      role="status"
      aria-label="Assayed — sound"
      className={cn(
        "flex h-24 w-24 flex-col items-center justify-center rounded-[var(--radius-pill)] border border-gold/80 bg-obsidian/85 text-gold shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] backdrop-blur-sm sm:h-32 sm:w-32",
        animate && "hallmark-animate",
        className,
      )}
    >
      {/* inner hairline — the second ring of a struck seal */}
      <div className="flex h-[88%] w-[88%] flex-col items-center justify-center rounded-[var(--radius-pill)] border border-gold/40">
        <span aria-hidden className="text-xl leading-none text-gold-soft sm:text-3xl">
          ✓
        </span>
        <span className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.28em] text-gold">
          Assayed
        </span>
      </div>
    </div>
  );
}
