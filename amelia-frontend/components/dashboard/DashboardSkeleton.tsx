export default function DashboardSkeleton() {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col md:min-h-[calc(100dvh-3.5rem)] md:flex-row">
      <aside className="h-44 w-full shrink-0 bg-gradient-to-b from-[#0c2238] to-cap-navy md:h-auto md:w-[260px]" />
      <div className="relative flex min-w-0 flex-1 flex-col bg-cap-bg dark:bg-slate-950">
        <div className="h-[4.75rem] border-b border-white/40 bg-white/50 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60" />
        <div className="flex-1 space-y-8 p-6 md:p-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="dashboard-shimmer relative h-36 overflow-hidden rounded-2xl border border-white/50 bg-white/60 dark:border-white/[0.06] dark:bg-slate-800/50"
              />
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="dashboard-shimmer relative h-80 overflow-hidden rounded-2xl border border-white/50 bg-white/60 dark:border-white/[0.06] dark:bg-slate-800/50" />
            <div className="dashboard-shimmer relative h-80 overflow-hidden rounded-2xl border border-white/50 bg-white/60 dark:border-white/[0.06] dark:bg-slate-800/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
