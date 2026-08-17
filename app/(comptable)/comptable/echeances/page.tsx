import { createClient } from '@/lib/supabase/server'
import { DuesList } from '@/components/comptable/DuesList'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function EcheancesPage() {
  const supabase = await createClient()

  // Authentification et résolution de l'école
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

  // Récupérer les échéances
  const { data: dues, error: duesError } = await supabase
    .from('dues')
    .select(`
      id,
      label,
      amount,
      due_date,
      status,
      student:students (
        first_name,
        last_name,
        class:classes (name)
      )
    `)
    .eq('school_id', schoolId)
    .order('due_date', { ascending: false })

  // Récupérer les classes pour le filtre
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          {/* Header géré dans DuesList */}
        </div>
        <Link 
          href="/comptable/echeances/nouveau"
          className="h-12 px-6 bg-[var(--color-primary-container)] text-white font-semibold text-sm rounded-lg hover:bg-[var(--color-primary)] transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Nouvelles échéances
        </Link>
      </div>

      <DuesList 
        dues={dues || []} 
        classes={classes || []} 
      />
    </div>
  )
}
