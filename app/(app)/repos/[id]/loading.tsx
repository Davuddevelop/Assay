import { Skeleton } from "@/components/ui/skeleton";

export default function RepoLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-6 h-8 w-64" />
      <Skeleton className="mt-12 h-4 w-20" />
      <Skeleton className="mt-5 h-28 w-full rounded-[var(--radius-card)]" />
      <Skeleton className="mt-14 h-4 w-20" />
      <Skeleton className="mt-5 h-40 w-full rounded-[var(--radius-card)]" />
    </div>
  );
}
