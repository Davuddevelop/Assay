import { cn } from "@/lib/utils";

type Severity = "critical" | "risky" | "minor";

const FINDINGS: {
  severity: Severity;
  title: string;
  detail: string;
  fix: string;
}[] = [
  {
    severity: "critical",
    title: "Service-role key shipped to the browser",
    detail:
      "Your admin database key is in the JavaScript anyone can read. It bypasses every rule you set.",
    fix: "Move it server-side and rotate the key in Supabase → Settings → API.",
  },
  {
    severity: "risky",
    title: "Row Level Security off on 3 tables",
    detail:
      "profiles, orders and messages are readable by any signed-in user, not just their owner.",
    fix: "Enable RLS, then add a policy matching auth.uid() to the owner column.",
  },
  {
    severity: "minor",
    title: "No Content-Security-Policy header",
    detail:
      "A stray script injected into a page would be allowed to run and phone home.",
    fix: "Add a default-src 'self' policy in next.config.ts headers().",
  },
];

const TONE: Record<Severity, string> = {
  critical: "border-[#b5443a]/50 text-[#e08a78]",
  risky: "border-[#8b8bf0]/40 text-[#b9b6f7]",
  minor: "border-white/20 text-[#8f8f97]",
};

/**
 * A report specimen, set as a document rather than a UI mock.
 *
 * The old landing page shows a browser chrome with a screenshot inside it,
 * which asks you to imagine using the product. This shows the actual output —
 * ruled rows, mono labels, a verdict — because the output is the product and
 * it reads as an instrument, not a dashboard.
 */
export function Specimen() {
  return (
    <div className="border border-white/[0.1] bg-white/[0.015]">
      <div className="flex items-center justify-between border-b border-white/[0.1] px-5 py-3.5 sm:px-7">
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-[#6f6f78]">
          Scan · my-saas.lovable.app
        </span>
        <span className="shrink-0 rounded-[2px] border border-[#b5443a]/50 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[#e08a78]">
          Held
        </span>
      </div>

      <div className="flex items-baseline gap-3 border-b border-white/[0.1] px-5 py-6 sm:px-7">
        <span className="font-display text-[2.6rem] font-bold leading-none tracking-[-0.03em] text-[#f4f1ea]">
          41
        </span>
        <span className="font-mono text-[11px] tracking-[0.16em] text-[#5a5a62]">/ 100</span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-[#6f6f78]">
          1 critical · 1 risky · 1 minor
        </span>
      </div>

      <ul className="divide-y divide-white/[0.07]">
        {FINDINGS.map((f) => (
          <li key={f.title} className="px-5 py-6 sm:px-7">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "rounded-[2px] border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em]",
                  TONE[f.severity],
                )}
              >
                {f.severity}
              </span>
              <h3 className="text-[15px] font-medium text-[#f4f1ea]">{f.title}</h3>
            </div>
            <p className="mt-3 max-w-[62ch] text-[14px] leading-[1.65] text-[#9a9aa2]">
              {f.detail}
            </p>
            <p className="mt-4 flex gap-3 border-l border-white/[0.14] pl-4 font-mono text-[12px] leading-[1.6] text-[#8f8f97]">
              <span className="shrink-0 text-[#5a5a62]">FIX</span>
              <span>{f.fix}</span>
            </p>
          </li>
        ))}
      </ul>

      <div className="border-t border-white/[0.1] px-5 py-3.5 sm:px-7">
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#4a4a52]">
          Re-checked every 3 hours on Pro
        </span>
      </div>
    </div>
  );
}
