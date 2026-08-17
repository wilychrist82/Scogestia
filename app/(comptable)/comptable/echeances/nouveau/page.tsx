import { createClient } from '@/lib/supabase/server'
import { DuesGenerator } from '@/components/comptable/DuesGenerator'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function NouvellesEcheancesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id, role')
    .eq('user_id', user.id)
    .in('role', ['comptable', 'admin'])
    .single()

  if (!roleData) redirect('/')

  const schoolId = roleData.school_id

  // Récupérer les classes
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name')

  // Récupérer les élèves actifs
  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, class_id')
    .eq('school_id', schoolId)
    .eq('status', 'actif')
    .order('last_name')

  return (
    <div className="space-y-6">
      {/* Header avec bouton de retour */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/comptable/echeances"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-[var(--color-on-background)]">Génération des échéances</h2>
          <p className="text-base text-[var(--color-on-surface-variant)] mt-2 max-w-2xl">
            Planifiez et générez les appels de fonds pour la scolarité. Choisissez de cibler une classe entière ou un élève spécifique.
          </p>
        </div>
      </div>

      <DuesGenerator 
        classes={classes || []} 
        students={students || []} 
      />
    </div>
  )
}
