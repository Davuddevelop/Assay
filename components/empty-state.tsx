import { Button } from "@/components/ui/button";
import { HallmarkMark } from "@/components/wordmark";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  body: string;
  action?: { label: string; href: string };
  className?: string;
};

/**
 * An invitation to act, never a dead end. The mark, a quiet line, and one
 * clear next step. Used wherever there's nothing yet.
 */
export function EmptyState({ title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-line bg-obsidian-2/40 px-6 py-16 text-center",
        className,
      )}
    >
      <span className="relative flex h-12 w-12 items-center justify-center rounded-[var(--radius-pill)] border border-line text-gold">
        <span aria-hidden className="glow absolute inset-0 -z-10 scale-150" />
        <HallmarkMark className="h-6 w-6" />
      </span>
      <h3 className="mt-6 font-display text-xl text-ivory">{title}</h3>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-ivory-dim">{body}</p>
      {action && (
        <Button href={action.href} variant="primary" size="md" className="mt-7">
          {action.label}
        </Button>
      )}
    </div>
  );
}
