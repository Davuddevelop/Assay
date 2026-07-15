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
  // A bold, struck hallmark: a heavy filled seal with the "A" apex punched out
  // as clean negative space. Reads at any size, from favicon to hero.
  const fill = metallic ? "url(#assay-iris)" : "currentColor";
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("h-6 w-6", className)}>
      <defs>
        <mask id="assay-hallmark-cut">
          <rect
            x="5"
            y="5"
            width="14"
            height="14"
            rx="4"
            transform="rotate(45 12 12)"
            fill="white"
          />
          {/* the struck triangle — the punch, and the apex of the A */}
          <path d="M12 7.3 16 14.7 8 14.7Z" fill="black" />
        </mask>
      </defs>
      <rect
        x="5"
        y="5"
        width="14"
        height="14"
        rx="4"
        transform="rotate(45 12 12)"
        fill={fill}
        mask="url(#assay-hallmark-cut)"
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
