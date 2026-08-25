import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BulletinsManager } from '@/components/admin/academique/BulletinsManager'

export const dynamic = 'force-dynamic'

export default async function BulletinsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData, error: roleError } = await supabase
    .from('user_school_roles')
    .select('school_id, school:schools(name, logo_url, city, phone)')
    .eq('user_id', user.id)
    .limit(1).maybeSingle()

  if (!roleData?.school_id) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">École introuvable: {roleError?.message || 'Inconnu'}</div>
  }

  const schoolId = roleData.school_id
  const schoolDetails = roleData.school

  const { data: classes } = await supabase.from('classes').select('id, name, level').eq('school_id', schoolId).order('name')
  const { data: students } = await supabase.from('students').select('id, matricule, last_name, first_name, class_id').eq('school_id', schoolId).eq('status', 'actif').order('last_name')
  let { data: subjects } = await supabase.from('subjects').select('*').eq('school_id', schoolId)
  
  if (!subjects || subjects.length === 0) {
    // Auto-seed from Togolese curriculum (user captures)
    const seedSubjects = [
      // Primary
      { school_id: schoolId, name: 'Lecture', cycle: 'primaire', category: 'Français' },
      { school_id: schoolId, name: 'Récitation / Chant', cycle: 'primaire', category: 'Français' },
      { school_id: schoolId, name: 'Conjugaison', cycle: 'primaire', category: 'Français' },
      { school_id: schoolId, name: 'Grammaire', cycle: 'primaire', category: 'Français' },
      { school_id: schoolId, name: 'Orthographe', cycle: 'primaire', category: 'Français' },
      { school_id: schoolId, name: 'Vocabulaire', cycle: 'primaire', category: 'Français' },
      { school_id: schoolId, name: 'Dictée', cycle: 'primaire', category: 'Français' },
      { school_id: schoolId, name: 'Expression Écrite', cycle: 'primaire', category: 'Français' },
      { school_id: schoolId, name: 'Numération', cycle: 'primaire', category: 'Mathématiques' },
      { school_id: schoolId, name: 'Opération', cycle: 'primaire', category: 'Mathématiques' },
      { school_id: schoolId, name: 'Problème', cycle: 'primaire', category: 'Mathématiques' },
      { school_id: schoolId, name: 'Géométrie', cycle: 'primaire', category: 'Mathématiques' },
      { school_id: schoolId, name: 'Mesure', cycle: 'primaire', category: 'Mathématiques' },
      { school_id: schoolId, name: 'Calcul mental', cycle: 'primaire', category: 'Mathématiques' },
      { school_id: schoolId, name: 'EDPM', cycle: 'primaire', category: 'Sciences et Technologies' },
      { school_id: schoolId, name: 'EDVS', cycle: 'primaire', category: 'Sciences et Technologies' },
      { school_id: schoolId, name: 'Histoire', cycle: 'primaire', category: 'Sciences Humaines' },
      { school_id: schoolId, name: 'Géographie', cycle: 'primaire', category: 'Sciences Humaines' },
      { school_id: schoolId, name: 'ECM', cycle: 'primaire', category: 'Sciences Humaines' },
      { school_id: schoolId, name: 'Dessin', cycle: 'primaire', category: 'Education Sociale' },
      { school_id: schoolId, name: 'EPS', cycle: 'primaire', category: 'Education Sociale' },
      
      // Secondary
      { school_id: schoolId, name: 'Français', cycle: 'secondaire', coefficient: 2 },
      { school_id: schoolId, name: 'Anglais', cycle: 'secondaire', coefficient: 2 },
      { school_id: schoolId, name: 'Philosophie', cycle: 'secondaire', coefficient: 2 },
      { school_id: schoolId, name: 'Histoire-Géographie', cycle: 'secondaire', coefficient: 2 },
      { school_id: schoolId, name: 'Mathématiques', cycle: 'secondaire', coefficient: 4 },
      { school_id: schoolId, name: 'Sciences Physiques', cycle: 'secondaire', coefficient: 3 },
      { school_id: schoolId, name: 'SVT', cycle: 'secondaire', coefficient: 4 },
      { school_id: schoolId, name: 'ECM', cycle: 'secondaire', coefficient: 1 },
      { school_id: schoolId, name: 'EPS', cycle: 'secondaire', coefficient: 1 },
    ];
    await supabase.from('subjects').insert(seedSubjects);
    const { data: newSubjects } = await supabase.from('subjects').select('*').eq('school_id', schoolId);
    subjects = newSubjects;
  }
  
  // We fetch all grades for the school to compute client side. 
  // In a huge real-world app, this would be behind a dedicated API route per student/class, but we keep it simple here.
  const { data: primaryGrades } = await supabase.from('primary_grades').select('*').eq('school_id', schoolId)
  const { data: secondaryGrades } = await supabase.from('secondary_grades').select('*').eq('school_id', schoolId)

  return (
    <BulletinsManager 
      classes={classes || []} 
      students={students || []} 
      subjects={subjects || []}
      primaryGrades={primaryGrades || []}
      secondaryGrades={secondaryGrades || []}
      schoolName={(schoolDetails as any)?.name || 'École'}
    />
  )
}
