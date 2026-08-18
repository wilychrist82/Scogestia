import Link from 'next/link'

export default function BulletinsPlaceholder() {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="w-20 h-20 bg-[#e8f0fe] rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-[40px] text-[#1a73e8]">workspace_premium</span>
      </div>
      <h2 className="text-2xl font-bold text-[var(--color-on-surface)] mb-3">Bulletins Trimestriels</h2>
      <p className="text-[var(--color-on-surface-variant)] mb-8">
        La consultation et le téléchargement des bulletins de votre enfant seront disponibles très prochainement.
      </p>
      <Link href="/parent" className="bg-[var(--color-primary)] text-white font-bold py-3 px-8 rounded-full shadow-md active:scale-95 transition-transform">
        Retour à l'accueil
      </Link>
    </div>
  )
}
