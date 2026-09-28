'use client'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4 border border-red-100">
        <span className="text-3xl">⚠️</span>
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">
        Une erreur est survenue
      </h2>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        Impossible de charger cette page. Vérifiez votre connexion internet et réessayez.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-md"
      >
        Réessayer
      </button>
    </div>
  )
}
