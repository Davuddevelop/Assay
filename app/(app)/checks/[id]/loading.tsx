import { Skeleton } from "@/components/ui/skeleton";

export default function CheckLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <Skeleton className="h-3 w-24" />
      <div className="mt-6 flex items-start justify-between gap-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-7 w-24 rounded-pill" />
      </div>
      <Skeleton className="mt-6 h-16 w-full rounded-[var(--radius-card)]" />
      <Skeleton className="mt-12 h-4 w-24" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-[var(--radius-control)]" />
        ))}
      </div>
    </div>
  );
}
