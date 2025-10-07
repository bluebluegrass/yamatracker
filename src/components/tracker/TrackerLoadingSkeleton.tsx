function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

function SkeletonLine({ className }: { className?: string }) {
  return <div className={`h-3 w-full animate-pulse rounded bg-slate-200 ${className ?? ''}`} />;
}

export function TrackerLoadingSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row">
      <aside className="lg:w-80">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <SkeletonLine className="h-4 w-24" />
          <div className="mt-4 space-y-3">
            <SkeletonLine className="h-3 w-full" />
            <SkeletonLine className="h-3 w-3/4" />
          </div>
          <div className="mt-6 space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </aside>

      <section className="flex-1 space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <SkeletonLine className="h-4 w-32" />
            <SkeletonLine className="h-3 w-16" />
          </div>
          <SkeletonBlock className="mt-4 h-72 w-full" />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <SkeletonLine className="h-4 w-40" />
            <SkeletonLine className="h-3 w-16" />
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-40 w-full" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
