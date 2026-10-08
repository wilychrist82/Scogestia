export default function EnseignantLoading() {
  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 w-full space-y-6 animate-pulse">
      
      {/* Hero Banner Enseignant */}
      <div className="rounded-[2rem] bg-gradient-to-br from-emerald-900/60 via-slate-900 to-slate-900 p-6 sm:p-8 min-h-[180px] border border-white/5 flex flex-col justify-between">
        <div className="space-y-3 max-w-md">
          <div className="h-3.5 w-24 bg-white/20 rounded-full" />
          <div className="h-8 sm:h-9 w-72 bg-white/30 rounded-xl" />
          <div className="h-4 w-60 bg-white/15 rounded-lg" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-32 bg-white/10 rounded-xl" />
          <div className="h-9 w-32 bg-white/10 rounded-xl" />
        </div>
      </div>

      {/* Cartes Raccourcis Rapides Enseignant */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-28 bg-slate-200 rounded" />
              <div className="h-3 w-40 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Planning & Liste des Classes Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonne Principale : Emploi du temps du jour */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-2">
            <div className="h-5 w-48 bg-slate-200 rounded-lg" />
            <div className="h-4 w-20 bg-slate-100 rounded" />
          </div>

          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-7 w-24 bg-slate-200 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Colonne Latérale : Devoirs & Absences */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="h-5 w-36 bg-slate-200 rounded-lg mb-2" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div className="h-3.5 w-3/4 bg-slate-200 rounded" />
              <div className="h-3 w-1/2 bg-slate-100 rounded" />
            </div>
          ))}
        </div>

      </div>

    </div>
  )
}
