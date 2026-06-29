import { Skeleton } from "@/components/ui/skeleton";

export default function ScanLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-6 h-40 w-full rounded-[var(--radius-card)]" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-[var(--radius-card)]" />
        ))}
      </div>
    </div>
  );
}
