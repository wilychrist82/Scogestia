'use server'

import { createClient } from '@/lib/supabase/server'

export type SearchResult = {
  id: string
  title: string
  subtitle: string
  href: string
  type: 'student' | 'invoice' | 'staff'
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return []

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .limit(1).maybeSingle()

  const schoolId = roleData?.school_id
  if (!schoolId) return []

  const results: SearchResult[] = []
  const searchQuery = `%${query}%`

  // 1. Search Students (first_name, last_name, matricule)
  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, matricule, classes(name)')
    .eq('school_id', schoolId)
    .or(`first_name.ilike.${searchQuery},last_name.ilike.${searchQuery},matricule.ilike.${searchQuery}`)
    .limit(5)

  if (students) {
    students.forEach(s => {
      results.push({
        id: s.id,
        title: `${s.first_name} ${s.last_name}`,
        subtitle: `Élève - Matricule: ${s.matricule} - Classe: ${(s.classes as any)?.name || 'N/A'}`,
        href: `/admin/eleves/${s.id}`,
        type: 'student'
      })
    })
  }

  // 2. Search Dues/Invoices (payment_label)
  const { data: dues } = await supabase
    .from('dues')
    .select('id, payment_label, amount, students(first_name, last_name)')
    .eq('school_id', schoolId)
    .ilike('payment_label', searchQuery)
    .limit(5)

  if (dues) {
    dues.forEach(d => {
      const studentName = d.students ? `${(d.students as any).first_name} ${(d.students as any).last_name}` : 'Classe entière'
      results.push({
        id: d.id,
        title: d.payment_label,
        subtitle: `Facture - ${new Intl.NumberFormat('fr-FR').format(d.amount)} FCFA - ${studentName}`,
        href: `/admin/finance/echeances`,
        type: 'invoice'
      })
    })
  }

  // 3. Search Staff (full_name)
  const { data: staff } = await supabase
    .from('user_school_roles')
    .select('id, full_name, role')
    .eq('school_id', schoolId)
    .ilike('full_name', searchQuery)
    .limit(5)

  if (staff) {
    staff.forEach(s => {
      results.push({
        id: s.id,
        title: s.full_name || 'Utilisateur inconnu',
        subtitle: `Personnel - Rôle: ${s.role}`,
        href: `/admin/personnel`,
        type: 'staff'
      })
    })
  }

  return results
}
