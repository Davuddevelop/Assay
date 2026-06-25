import { cn } from "@/lib/utils";
import { HallmarkStamp } from "@/components/hallmark-stamp";

const CHECKS = [
  { label: "Tests", value: "42 passed" },
  { label: "Security", value: "No issues" },
  { label: "Rules", value: "3 of 3 held" },
];

/**
 * The product in a browser window — a concrete check detail, the way the best
 * AI-startup pages show their app. Clean, framed, lifted.
 */
export function ProductMock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-frame)] border border-border bg-surface shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      {/* browser chrome */}
      <div className="flex items-center gap-4 border-b border-line px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-border-strong" />
          <span className="h-3 w-3 rounded-full bg-border-strong" />
          <span className="h-3 w-3 rounded-full bg-border-strong" />
        </div>
        <div className="flex h-7 flex-1 items-center justify-center rounded-pill bg-onyx/60 px-4 font-mono text-xs text-ash">
          assay.dev/davud/checkout/checks/8f21a3c
        </div>
      </div>

      {/* body */}
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
              Check · feat/idempotency-key
            </p>
            <h3 className="mt-2 text-lg font-semibold leading-snug text-ivory">
              Add idempotency key to checkout
            </h3>
          </div>
          <HallmarkStamp state="assayed" animate={false} />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {CHECKS.map((c) => (
            <div
              key={c.label}
              className="rounded-[var(--radius-control)] border border-line bg-onyx/40 px-3 py-3.5 sm:px-4"
            >
              <div className="flex items-center gap-1.5 text-ivory-dim">
                <span aria-hidden className="text-xs leading-none">
                  ✓
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ash">
                  {c.label}
                </span>
              </div>
              <p className="mt-2 text-sm text-ivory">{c.value}</p>
            </div>
          ))}
        </div>

        <p className="mt-5 text-sm leading-relaxed text-ivory-dim">
          Every check your repository defines passed. The change is sound.
        </p>
      </div>
    </div>
  );
}
