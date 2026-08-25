import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotesManager } from '@/components/admin/academique/NotesManager'

export const dynamic = 'force-dynamic'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .limit(1).maybeSingle()

  if (!roleData?.school_id) return <div className="p-8">École introuvable.</div>
  const schoolId = roleData.school_id

  const { data: classes } = await supabase.from('classes').select('id, name, level').eq('school_id', schoolId).order('name')
  const { data: students } = await supabase.from('students').select('id, first_name, last_name, matricule, class_id').eq('school_id', schoolId).order('last_name')
  let { data: subjects } = await supabase.from('subjects').select('id, name, cycle').eq('school_id', schoolId).order('name')
  
  if (!subjects || subjects.length === 0) {
    const seedSubjects = [
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
    const { data: newSubjects } = await supabase.from('subjects').select('id, name, cycle').eq('school_id', schoolId).order('name');
    subjects = newSubjects;
  }
  
  const { data: primaryGrades } = await supabase.from('primary_grades').select('*').eq('school_id', schoolId)
  const { data: secondaryGrades } = await supabase.from('secondary_grades').select('*').eq('school_id', schoolId)

  return (
    <NotesManager 
      classes={classes || []} 
      subjects={subjects || []} 
      students={students || []} 
      primaryGrades={primaryGrades || []}
      secondaryGrades={secondaryGrades || []}
    />
  )
}
