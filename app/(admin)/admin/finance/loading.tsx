export default function FinanceLoading() {
  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 w-full space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-7 w-44 bg-slate-200 rounded-lg" />
          <div className="h-4 w-72 bg-slate-100 rounded" />
        </div>
        <div className="flex gap-2.5">
          <div className="h-10 w-32 bg-slate-200 rounded-xl" />
          <div className="h-10 w-40 bg-emerald-100 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="w-8 h-8 rounded-lg bg-emerald-50" />
            </div>
            <div className="h-8 w-36 bg-slate-300 rounded-lg" />
            <div className="h-3 w-28 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Main Financial Tables / Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-2">
            <div className="h-5 w-44 bg-slate-200 rounded-lg" />
            <div className="h-4 w-20 bg-slate-100 rounded" />
          </div>
          <div className="h-64 bg-slate-50 rounded-xl" />
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="h-5 w-36 bg-slate-200 rounded-lg mb-2" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-xl space-y-2">
              <div className="h-4 w-3/4 bg-slate-200 rounded" />
              <div className="h-3 w-1/2 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
