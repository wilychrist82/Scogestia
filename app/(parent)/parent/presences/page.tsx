import Link from 'next/link'

export default function PresencesPlaceholder() {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="w-20 h-20 bg-[#fff8e1] rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-[40px] text-[#f57f17]">fact_check</span>
      </div>
      <h2 className="text-2xl font-bold text-[var(--color-on-surface)] mb-3">Assiduité</h2>
      <p className="text-[var(--color-on-surface-variant)] mb-8">
        Le suivi des présences et retards sera disponible très prochainement.
      </p>
      <Link href="/parent" className="bg-[var(--color-primary)] text-white font-bold py-3 px-8 rounded-full shadow-md active:scale-95 transition-transform">
        Retour à l'accueil
      </Link>
    </div>
  )
}
