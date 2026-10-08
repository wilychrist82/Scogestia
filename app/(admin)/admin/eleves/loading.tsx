export default function ElevesLoading() {
  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 w-full space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 rounded-lg" />
          <div className="h-4 w-64 bg-slate-100 rounded" />
        </div>
        <div className="flex gap-2.5">
          <div className="h-10 w-28 bg-slate-200 rounded-xl" />
          <div className="h-10 w-36 bg-emerald-100 rounded-xl" />
        </div>
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="h-10 flex-1 bg-slate-100 rounded-xl" />
        <div className="h-10 w-44 bg-slate-100 rounded-xl" />
        <div className="h-10 w-36 bg-slate-100 rounded-xl" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-4 w-20 bg-slate-100 rounded" />
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 bg-slate-200 rounded" />
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-6 w-20 bg-slate-100 rounded-md hidden sm:block" />
              <div className="h-6 w-16 bg-emerald-50 rounded-md" />
              <div className="h-8 w-20 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
