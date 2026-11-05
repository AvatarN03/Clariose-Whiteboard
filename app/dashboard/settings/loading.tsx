import { Skeleton } from "@/components/ui/skeleton";

function SettingsCardSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      {children}
    </section>
  );
}

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 lg:px-10" aria-label="Loading settings">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-4 h-11 w-80 max-w-full" />
      <Skeleton className="mt-3 h-5 w-[32rem] max-w-full" />

      <div className="mt-10 space-y-6">
        <SettingsCardSkeleton>
          <div className="flex items-start justify-between gap-5">
            <div className="space-y-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-52 max-w-full" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="mt-6 flex items-center justify-between gap-4 rounded-xl bg-muted/60 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44 max-w-[45vw]" />
              </div>
            </div>
            <Skeleton className="size-8 rounded-full" />
          </div>
        </SettingsCardSkeleton>

        <SettingsCardSkeleton>
          <div className="flex items-start justify-between gap-5">
            <div className="space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-64 max-w-full" />
              <Skeleton className="h-4 w-96 max-w-full" />
            </div>
            <Skeleton className="size-8 rounded-lg" />
          </div>
        </SettingsCardSkeleton>

        <SettingsCardSkeleton>
          <div className="flex items-start gap-4">
            <Skeleton className="size-10 rounded-xl" />
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-8 w-64 max-w-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-16 w-full max-w-2xl" />
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-9 w-44 rounded-lg" />
                <Skeleton className="h-9 w-48 rounded-lg" />
              </div>
            </div>
          </div>
        </SettingsCardSkeleton>
      </div>
    </main>
  );
}