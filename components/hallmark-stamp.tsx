import { cn } from "@/lib/utils";

type HallmarkState = "assayed" | "held" | "incomplete";
type HallmarkSize = "sm" | "md" | "lg";

export type HallmarkStampProps = {
  /**
   * "assayed" — sound. "held" — looks right, but breaks something.
   * "incomplete" — not enough of it could be checked to say either.
   *
   * The third state is deliberately neither gold nor oxblood. Reusing "held"
   * for it would tell someone their app is flagged when what actually
   * happened is that we could not see it, and reusing "assayed" would claim a
   * pass nobody earned. It is grey because it is genuinely neither.
   */
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
    ring: "border-oxblood text-oxblood-soft",
    glyphColor: "text-oxblood-soft",
  },
  incomplete: {
    label: "INCOMPLETE",
    glyph: "–",
    ring: "border-border-strong text-ivory-dim",
    glyphColor: "text-ivory-dim",
  },
} satisfies Record<HallmarkState, unknown>;

const ARIA: Record<HallmarkState, string> = {
  assayed: "Assayed — sound",
  held: "Held — flagged",
  incomplete: "Incomplete — not enough could be checked",
};

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
  const metallic = state === "assayed";

  return (
    <span
      role="status"
      aria-label={ARIA[state]}
      className={cn(
        "inline-flex select-none items-center rounded-[var(--radius-pill)] border bg-surface/60 font-mono font-medium uppercase tracking-[0.22em]",
        SIZE[size],
        s.ring,
        animate && "hallmark-animate",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "leading-none",
          GLYPH_SIZE[size],
          metallic ? "gold-metallic" : s.glyphColor,
        )}
      >
        {s.glyph}
      </span>
      <span className={cn("leading-none", metallic && "gold-metallic")}>
        {s.label}
      </span>
    </span>
  );
}
