import { cn } from "@/lib/utils";

/**
 * The hallmark mark — a struck gold stamp. `metallic` renders a filled gold
 * disc with a dark check punched through (crisp at any size); the default is a
 * line version that inherits `currentColor`.
 */
export function HallmarkMark({
  className,
  metallic = false,
}: {
  className?: string;
  metallic?: boolean;
}) {
  if (metallic) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className={cn("h-6 w-6", className)}
      >
        {/* sharp "A" monogram in the iris gradient */}
        <path
          d="M4.5 20 12 4 19.5 20"
          stroke="url(#assay-iris)"
          strokeWidth="2.6"
          strokeLinejoin="miter"
          strokeLinecap="square"
        />
        <path
          d="M8 13.4H16"
          stroke="url(#assay-iris)"
          strokeWidth="2.6"
          strokeLinecap="square"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn("h-6 w-6", className)}
    >
      <circle cx="12" cy="12" r="10.25" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M7.75 12.4 10.7 15.3 16.4 8.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The Assay wordmark: the struck stamp paired with a tight, modern grotesk
 * lockup.
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
      {showMark && <HallmarkMark metallic className={cn("h-5 w-5", markClassName)} />}
      <span className="font-display text-lg font-semibold tracking-tight text-ivory">
        Assay
      </span>
    </span>
  );
}
