import { cn } from "@/lib/utils";

type HallmarkState = "assayed" | "held";
type HallmarkSize = "sm" | "md" | "lg";

export type HallmarkStampProps = {
  /** "assayed" — sound. "held" — looks right, but breaks something. */
  state: HallmarkState;
  /** Stamp in on mount. Falls back to a quiet fade under reduced-motion. */
  animate?: boolean;
  size?: HallmarkSize;
  className?: string;
};

const STATE = {
  assayed: {
    label: "ASSAYED",
    glyph: "✓",
    ring: "border-gold text-gold",
    glyphColor: "text-gold-soft",
  },
  held: {
    label: "HELD",
    glyph: "⚠",
    ring: "border-oxblood text-oxblood",
    glyphColor: "text-oxblood",
  },
} satisfies Record<HallmarkState, unknown>;

const SIZE = {
  sm: "h-7 gap-1.5 pl-2 pr-2.5 text-[10px]",
  md: "h-9 gap-2 pl-2.5 pr-3.5 text-xs",
  lg: "h-11 gap-2.5 pl-3 pr-4 text-sm",
} satisfies Record<HallmarkSize, string>;

const GLYPH_SIZE = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
} satisfies Record<HallmarkSize, string>;

/**
 * The signature component: a struck-seal badge that certifies a check.
 * This is the one place Assay spends boldness — everything else stays quiet.
 */
export function HallmarkStamp({
  state,
  animate = true,
  size = "md",
  className,
}: HallmarkStampProps) {
  const s = STATE[state];

  return (
    <span
      role="status"
      aria-label={state === "assayed" ? "Assayed — sound" : "Held — flagged"}
      className={cn(
        "inline-flex select-none items-center rounded-[var(--radius-pill)] border bg-obsidian-2/60 font-mono font-medium uppercase tracking-[0.22em]",
        SIZE[size],
        s.ring,
        animate && "hallmark-animate",
        className,
      )}
    >
      <span aria-hidden className={cn("leading-none", GLYPH_SIZE[size], s.glyphColor)}>
        {s.glyph}
      </span>
      <span className="leading-none">{s.label}</span>
    </span>
  );
}
