export default function AdminLoading() {
  return (
    <div className="p-6 md:p-8 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded-lg bg-slate-200/80" />
          <div className="h-4 w-72 rounded-md bg-slate-100" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-32 rounded-xl bg-slate-200/70" />
          <div className="h-10 w-36 rounded-xl bg-slate-200/90" />
        </div>
      </div>

      {/* KPI Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 rounded bg-slate-200/80" />
              <div className="h-8 w-8 rounded-xl bg-slate-100" />
            </div>
            <div className="h-7 w-32 rounded-lg bg-slate-200" />
            <div className="h-3 w-20 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Table / Content Card Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="h-9 w-64 rounded-xl bg-slate-100" />
          <div className="h-4 w-24 rounded bg-slate-100" />
        </div>
        <div className="divide-y divide-slate-100">
          {[0, 1, 2, 3, 4, 5].map(row => (
            <div key={row} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-100 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 w-40 rounded bg-slate-200/80" />
                  <div className="h-3 w-24 rounded bg-slate-100" />
                </div>
              </div>
              <div className="h-4 w-24 rounded bg-slate-100 hidden sm:block" />
              <div className="h-6 w-20 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
