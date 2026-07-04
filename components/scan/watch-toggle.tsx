import { toggleWatch } from "@/app/(app)/scan/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ScanRow } from "@/lib/db/types";

/**
 * The retention hook on every finished report: one click to keep the app
 * watched. Watched apps are re-scanned daily and the dashboard flags any
 * regression, so a later edit that reopens a hole gets caught before users do.
 */
export function WatchToggle({ scan, watched }: { scan: ScanRow; watched: boolean }) {
  return (
    <div className="panel flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-7">
      <div className="min-w-0">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-iris-soft">
          {watched ? "Watching" : "Keep it safe"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ivory-dim">
          {watched
            ? "We re-check this app every day. If an edit opens a hole, it shows up on your dashboard — before your users find it."
            : "You'll keep editing this app. Watch it and we'll re-check it every day, and flag it on your dashboard the moment a change breaks something."}
        </p>
      </div>
      <form action={toggleWatch} className="shrink-0">
        <input type="hidden" name="app_url" value={scan.app_url} />
        <input type="hidden" name="scan_id" value={scan.id} />
        <input type="hidden" name="active" value={watched ? "false" : "true"} />
        <SubmitButton
          variant={watched ? "ghost" : "primary"}
          size="md"
          pendingText={watched ? "Stopping…" : "Watching…"}
        >
          {watched ? "Stop watching" : "Watch this app"}
        </SubmitButton>
      </form>
    </div>
  );
}
