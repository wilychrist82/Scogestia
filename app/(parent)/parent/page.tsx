import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ParentDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .eq('role', 'parent')
    .single()

  if (!roleData) redirect('/')

  // Récupérer les enfants liés
  const { data: links } = await supabase
    .from('parent_student_links')
    .select(`
      student_id,
      students (
        id,
        first_name,
        last_name,
        class_id,
        classes (name)
      )
    `)
    .eq('parent_user_id', user.id)

  const children = links?.map(l => l.students).filter(Boolean) || []

  if (children.length === 0) {
    return (
      <div className="p-6 text-center text-[var(--color-on-surface-variant)] flex flex-col items-center justify-center h-full">
        <span className="material-symbols-outlined text-[64px] text-gray-300 mb-4">child_care</span>
        <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">Aucun enfant trouvé</h2>
        <p>Veuillez contacter l'administration de l'école pour lier le profil de votre enfant à votre compte.</p>
      </div>
    )
  }

  // Pour le dashboard mobile, on affiche une synthèse globale si plusieurs enfants, 
  // ou on boucle pour afficher un aperçu de chaque enfant.
  return (
    <div className="p-4 space-y-6">
      
      {children.map((child: any) => (
        <div key={child.id} className="bg-white rounded-2xl p-5 shadow-sm border border-[var(--color-outline-variant)]">
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xl font-bold shadow-md">
              {child.first_name[0]}{child.last_name[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-on-surface)]">{child.first_name} {child.last_name}</h2>
              <p className="text-sm text-[var(--color-primary)] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">school</span>
                {child.classes?.name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <Link href={`/parent/notes?child=${child.id}`} className="bg-[#e8f0fe] p-3 rounded-xl flex flex-col items-center justify-center gap-1 text-[#1a73e8] active:scale-95 transition-transform">
              <span className="material-symbols-outlined filled">grading</span>
              <span className="text-xs font-semibold">Notes</span>
            </Link>
            <Link href={`/parent/presences?child=${child.id}`} className="bg-[#fff8e1] p-3 rounded-xl flex flex-col items-center justify-center gap-1 text-[#f57f17] active:scale-95 transition-transform">
              <span className="material-symbols-outlined filled">fact_check</span>
              <span className="text-xs font-semibold">Assiduité</span>
            </Link>
            <Link href={`/parent/devoirs?child=${child.id}`} className="bg-[#f3e8fd] p-3 rounded-xl flex flex-col items-center justify-center gap-1 text-[#9c27b0] active:scale-95 transition-transform">
              <span className="material-symbols-outlined filled">assignment</span>
              <span className="text-xs font-semibold">Devoirs</span>
            </Link>
            <Link href={`/parent/bulletins?child=${child.id}`} className="bg-[#e6f4ea] p-3 rounded-xl flex flex-col items-center justify-center gap-1 text-[#1e8e3e] active:scale-95 transition-transform">
              <span className="material-symbols-outlined filled">workspace_premium</span>
              <span className="text-xs font-semibold">Bulletins</span>
            </Link>
          </div>

        </div>
      ))}

      {/* Raccourci Finances Globales Parent */}
      <div className="bg-gradient-to-r from-[var(--color-primary)] to-[#147a63] rounded-2xl p-5 shadow-lg text-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg">Finances</h3>
            <p className="text-sm text-[var(--color-primary-container)]">Gérer les frais de scolarité</p>
          </div>
          <span className="material-symbols-outlined text-[32px]">payments</span>
        </div>
        <Link href={`/parent/paiements${children && children.length > 0 ? `?child=${(children[0] as any).id}` : ''}`} className="w-full bg-white text-[var(--color-primary)] py-3 rounded-xl font-bold flex justify-center gap-2 items-center hover:opacity-90 active:scale-95 transition-transform shadow-sm">
          Voir les paiements
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>

    </div>
  )
}
