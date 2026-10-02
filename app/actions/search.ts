'use server'

import { createClient } from '@/lib/supabase/server'

export type SearchResult = {
  id: string
  title: string
  subtitle: string
  href: string
  type: 'student' | 'invoice' | 'staff' | 'class'
}

export async function globalSearch(query: string, overrideRole?: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return []

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id, role')
    .eq('user_id', user.id)
    .limit(1).maybeSingle()

  const schoolId = roleData?.school_id
  if (!schoolId) return []

  const role = overrideRole || roleData.role
  const isEnseignant = role === 'enseignant'

  const results: SearchResult[] = []
  const searchQuery = `%${query}%`

  // ── ESPACE ENSEIGNANT : RECHERCHE STRICTEMENT RESTREINTE AUX ÉLÈVES DE SES CLASSES ──
  if (isEnseignant) {
    const { data: assignments } = await supabase
      .from('teacher_class_subjects')
      .select('class_id')
      .eq('teacher_id', user.id)

    const classIds = Array.from(new Set(assignments?.map(a => a.class_id).filter(Boolean) || []))

    if (classIds.length === 0) return []

    const { data: students } = await supabase
      .from('students')
      .select('id, first_name, last_name, matricule, class_id, classes(name)')
      .eq('school_id', schoolId)
      .in('class_id', classIds)
      .or(`first_name.ilike.${searchQuery},last_name.ilike.${searchQuery},matricule.ilike.${searchQuery}`)
      .limit(10)

    if (students) {
      students.forEach(s => {
        results.push({
          id: s.id,
          title: `${s.first_name} ${s.last_name}`,
          subtitle: `Élève • Classe : ${(s.classes as any)?.name || 'N/A'}${s.matricule ? ` • N° ${s.matricule}` : ''}`,
          href: `/enseignant/notes?classe=${s.class_id}`,
          type: 'student'
        })
      })
    }

    return results
  }

  // ── ESPACE ADMINISTRATEUR : RECHERCHE COMPLÈTE ÉTABLISSEMENT ──
  // 1. Search Students
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
        subtitle: `Élève - Matricule: ${s.matricule || 'N/A'} - Classe: ${(s.classes as any)?.name || 'N/A'}`,
        href: `/admin/eleves/${s.id}`,
        type: 'student'
      })
    })
  }

  // 2. Search Invoices / Schedules
  const { data: schedules } = await supabase
    .from('payment_schedules')
    .select('id, label, amount_due, student:students(first_name, last_name)')
    .eq('school_id', schoolId)
    .ilike('label', searchQuery)
    .limit(5)

  if (schedules) {
    schedules.forEach(d => {
      const studentName = d.student ? `${(d.student as any).first_name} ${(d.student as any).last_name}` : 'Classe entière'
      results.push({
        id: d.id,
        title: d.label || 'Échéance',
        subtitle: `Facturation - ${new Intl.NumberFormat('fr-FR').format(d.amount_due || 0)} FCFA - ${studentName}`,
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
        title: s.full_name || 'Personnel',
        subtitle: `Personnel - Rôle: ${s.role}`,
        href: `/admin/personnel`,
        type: 'staff'
      })
    })
  }

  // 4. Search Classes (name)
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .ilike('name', searchQuery)
    .limit(4)

  if (classes) {
    classes.forEach(c => {
      results.push({
        id: c.id,
        title: c.name,
        subtitle: `Classe`,
        href: `/admin/classes`,
        type: 'class'
      })
    })
  }

  return results
}
