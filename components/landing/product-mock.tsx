import { HallmarkStamp } from "@/components/hallmark-stamp";
import { HallmarkMark } from "@/components/wordmark";
import { cn } from "@/lib/utils";

const CHECKS = [
  { label: "Tests", value: "42 passed" },
  { label: "Security", value: "No issues" },
  { label: "Rules", value: "3 of 3 held" },
];

/**
 * The product, rendered. A struck check detail — the hallmark moment shown in
 * the real interface rather than described. This is the hero's anchor.
 */
export function ProductMock({ className }: { className?: string }) {
  return (
    <div className={cn("product-frame panel overflow-hidden", className)}>
      {/* window chrome */}
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2.5">
          <HallmarkMark className="h-4 w-4 text-gold" />
          <span className="font-mono text-xs text-ivory-dim">davud/checkout</span>
        </div>
        <span className="font-mono text-xs text-ash">feat/idempotency-key</span>
      </div>

      {/* body */}
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ash">
              Check · 8f21a3c
            </p>
            <h3 className="mt-2 text-lg font-medium leading-snug text-ivory">
              Add idempotency key to checkout
            </h3>
          </div>
          <HallmarkStamp state="assayed" />
        </div>

        {/* the three checks, struck */}
        <div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-[var(--radius-control)] border border-line bg-line">
          {CHECKS.map((c) => (
            <div key={c.label} className="bg-obsidian-2 px-3 py-3.5 sm:px-4">
              <div className="flex items-center gap-1.5 text-gold">
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
