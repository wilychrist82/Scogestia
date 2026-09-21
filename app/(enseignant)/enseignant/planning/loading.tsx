export default function Loading() {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)] relative flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-[var(--color-on-surface-variant)] text-sm font-medium">Chargement de votre emploi du temps...</p>
    </div>
  )
}
