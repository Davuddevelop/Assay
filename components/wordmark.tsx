import { cn } from "@/lib/utils";

/**
 * The hallmark mark — a struck seal. A gold ring with a check punched through,
 * reading as a maker's stamp at small sizes.
 */
export function HallmarkMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("h-6 w-6", className)}
    >
      <circle cx="12" cy="12" r="10.25" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M7.75 12.4 10.7 15.3 16.4 8.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The ASSAY wordmark: Fraunces, restrained, with the wide tracking the brand
 * reserves for the name itself. Pairs the mark with the letters.
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
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {showMark && <HallmarkMark className={cn("text-gold", markClassName)} />}
      <span className="font-display text-lg leading-none tracking-[0.22em] text-ivory">
        ASSAY
      </span>
    </span>
  );
}
