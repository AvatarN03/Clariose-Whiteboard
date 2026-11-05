import { Skeleton } from "@/components/ui/skeleton";

function ArchiveCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Skeleton className="h-52 rounded-none" />
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-3">
          <Skeleton className="h-5 w-36 max-w-full" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="size-7 rounded-md" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 lg:px-10" aria-label="Loading archive">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-4 h-11 w-md max-w-full" />
      <Skeleton className="mt-3 h-5 w-lg max-w-full" />

      <section className="mt-10">
        <div className="mb-5 flex items-center gap-2">
          <Skeleton className="size-5 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <ArchiveCardSkeleton />
          <ArchiveCardSkeleton />
          <ArchiveCardSkeleton />
        </div>
      </section>
    </main>
  );
}
