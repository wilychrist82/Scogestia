export default function AdminLoading() {
  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-10 px-1">
      
      {/* Hero Skeleton */}
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[#070b14] min-h-[160px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/[0.06] px-6 sm:px-8 py-6">
        <div className="absolute -top-16 -left-16 w-80 h-80 bg-emerald-500/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="space-y-3">
          <div className="w-24 h-4 rounded-full bg-white/8 skeleton" />
          <div className="w-56 h-8 rounded-xl bg-white/10 skeleton" />
          <div className="w-36 h-3 rounded-full bg-white/6 skeleton" />
        </div>
        <div className="flex gap-2.5">
          {[60, 70, 80, 65].map((w, i) => (
            <div key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 text-center w-20">
              <div className={`h-2 bg-white/10 rounded-full mb-2 skeleton`} style={{ width: `${w}%` }} />
              <div className="h-5 bg-white/15 rounded-md skeleton" />
            </div>
          ))}
        </div>
      </div>

      {/* KPI Bento Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[
          'from-emerald-600/50 to-emerald-900/50',
          'from-blue-600/50 to-blue-900/50',
          'from-violet-600/50 to-violet-900/50',
          'from-amber-500/50 to-amber-800/50',
          'from-rose-500/50 to-rose-900/50',
        ].map((gradient, i) => (
          <div key={i} className={`rounded-[1.25rem] bg-gradient-to-br ${gradient} p-5 flex flex-col gap-3 opacity-40`}>
            <div className="w-9 h-9 rounded-xl bg-white/20 skeleton" />
            <div>
              <div className="w-12 h-7 bg-white/30 rounded-lg skeleton mb-2" />
              <div className="w-20 h-2.5 bg-white/20 rounded-full skeleton" />
            </div>
            <div className="w-16 h-4 bg-white/20 rounded-full skeleton" />
          </div>
        ))}
      </div>

      {/* Charts Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border border-[var(--color-outline-variant)] bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="w-48 h-5 bg-gray-200 rounded-lg skeleton mb-1.5" />
            <div className="w-32 h-3 bg-gray-100 rounded skeleton" />
          </div>
          <div className="p-6">
            <div className="h-[260px] bg-gray-50 rounded-xl skeleton" />
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
            <div className="flex gap-8">
              <div className="space-y-1.5">
                <div className="w-20 h-2.5 bg-gray-200 rounded skeleton" />
                <div className="w-28 h-5 bg-gray-100 rounded-lg skeleton" />
              </div>
              <div className="space-y-1.5">
                <div className="w-20 h-2.5 bg-gray-200 rounded skeleton" />
                <div className="w-28 h-5 bg-gray-100 rounded-lg skeleton" />
              </div>
            </div>
            <div className="w-20 h-20 rounded-full bg-gray-100 skeleton" />
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-outline-variant)] bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="w-32 h-5 bg-gray-200 rounded-lg skeleton" />
          </div>
          <div className="p-4 space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-3 p-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 skeleton flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-28 h-3.5 bg-gray-200 rounded skeleton" />
                  <div className="w-16 h-2.5 bg-gray-100 rounded skeleton" />
                </div>
                <div className="text-right space-y-1">
                  <div className="w-20 h-3.5 bg-gray-200 rounded skeleton" />
                  <div className="w-12 h-2.5 bg-gray-100 rounded skeleton" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1,2,3].map(i => (
          <div key={i} className="rounded-2xl border border-[var(--color-outline-variant)] bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="w-36 h-5 bg-gray-200 rounded-lg skeleton" />
            </div>
            <div className="p-5 flex gap-4 items-center">
              <div className="w-[120px] h-[120px] rounded-full bg-gray-100 skeleton shrink-0" />
              <div className="flex-1 space-y-3">
                {[1,2,3].map(j => (
                  <div key={j} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-200 skeleton" />
                      <div className="w-16 h-3 bg-gray-100 rounded skeleton" />
                    </div>
                    <div className="w-8 h-3 bg-gray-200 rounded skeleton" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
