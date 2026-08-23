export default function AdminLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[var(--color-surface)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[var(--color-on-surface-variant)] text-sm font-medium animate-pulse">Chargement...</p>
      </div>
    </div>
  )
}
