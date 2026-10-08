export default function ParentLoading() {
  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 w-full space-y-6 animate-pulse">
      
      {/* Ligne 1: Hero Banner + Annonces */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        
        {/* Skeleton Carte Hero Banner */}
        <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-emerald-900/60 via-slate-900/80 to-slate-900 rounded-[2rem] p-6 sm:p-8 min-h-[220px] sm:min-h-[260px] border border-white/5 flex flex-col justify-between">
          <div className="space-y-3 max-w-sm">
            <div className="h-3.5 w-24 bg-white/20 rounded-full" />
            <div className="h-8 sm:h-10 w-64 bg-white/30 rounded-xl" />
            <div className="h-4 w-80 bg-white/15 rounded-lg hidden sm:block" />
          </div>
          <div className="h-9 w-44 bg-white/10 rounded-xl" />
        </div>

        {/* Skeleton Annonces */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-32 bg-slate-200 rounded-lg" />
            <div className="h-4 w-12 bg-slate-100 rounded-md" />
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
              <div className="h-4 w-3/4 bg-slate-200 rounded" />
              <div className="h-3 w-1/2 bg-slate-100 rounded" />
            </div>
            <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
              <div className="h-4 w-2/3 bg-slate-200 rounded" />
              <div className="h-3 w-1/3 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Ligne 2: Cartes Enfants */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-40 bg-slate-200 rounded-lg" />
          <div className="h-8 w-32 bg-slate-100 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100/70" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                  <div className="h-3 w-16 bg-slate-100 rounded" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl">
                <div className="text-center space-y-1">
                  <div className="h-3 w-10 bg-slate-200 rounded mx-auto" />
                  <div className="h-5 w-8 bg-slate-300 rounded mx-auto" />
                </div>
                <div className="text-center space-y-1">
                  <div className="h-3 w-10 bg-slate-200 rounded mx-auto" />
                  <div className="h-5 w-8 bg-slate-300 rounded mx-auto" />
                </div>
                <div className="text-center space-y-1">
                  <div className="h-3 w-10 bg-slate-200 rounded mx-auto" />
                  <div className="h-5 w-8 bg-slate-300 rounded mx-auto" />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="h-9 flex-1 bg-slate-100 rounded-xl" />
                <div className="h-9 flex-1 bg-emerald-50 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ligne 3: Raccourcis d'accès rapide */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-20 bg-slate-200 rounded" />
              <div className="h-2.5 w-12 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
