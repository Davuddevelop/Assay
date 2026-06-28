import { Skeleton } from "@/components/ui/skeleton";

export default function RulesLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-6 h-9 w-72" />
      <Skeleton className="mt-4 h-12 w-full" />
      <div className="mt-12 space-y-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-[var(--radius-card)]" />
        ))}
      </div>
    </div>
  );
}
