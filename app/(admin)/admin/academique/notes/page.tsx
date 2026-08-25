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
      // Primary
      { school_id: schoolId, name: 'Je sais écrire les mots (dictée, questions)', cycle: 'primaire', category: 'Français' },
      { school_id: schoolId, name: 'Je produis un texte (Rédaction)', cycle: 'primaire', category: 'Français' },
      { school_id: schoolId, name: 'Lecture', cycle: 'primaire', category: 'Français' },
      { school_id: schoolId, name: 'Je sais parler (langage)', cycle: 'primaire', category: 'Français' },
      { school_id: schoolId, name: 'Calcul Écrit', cycle: 'primaire', category: 'Mathématiques' },
      { school_id: schoolId, name: 'Calcul mental', cycle: 'primaire', category: 'Mathématiques' },
      { school_id: schoolId, name: 'Problème', cycle: 'primaire', category: 'Mathématiques' },
      { school_id: schoolId, name: 'Sciences Humaines (Histoire-Géographie)', cycle: 'primaire', category: 'Sciences' },
      { school_id: schoolId, name: 'Education Sociale (ECM)', cycle: 'primaire', category: 'Sciences' },
      { school_id: schoolId, name: 'Sciences et Technologie (Edusivip)', cycle: 'primaire', category: 'Sciences' },
      { school_id: schoolId, name: 'Arts plastiques (Dessin)', cycle: 'primaire', category: 'Divers' },
      { school_id: schoolId, name: 'Chant, Récitation', cycle: 'primaire', category: 'Divers' },
      { school_id: schoolId, name: 'Anglais', cycle: 'primaire', category: 'Divers' },
      { school_id: schoolId, name: 'EPS', cycle: 'primaire', category: 'Divers' },
      
      // Secondary
      { school_id: schoolId, name: 'Français', cycle: 'secondaire', coefficient: 2 },
      { school_id: schoolId, name: 'Rédaction', cycle: 'secondaire', coefficient: 1 },
      { school_id: schoolId, name: 'Histoire-Géographie', cycle: 'secondaire', coefficient: 2 },
      { school_id: schoolId, name: 'Anglais', cycle: 'secondaire', coefficient: 2 },
      { school_id: schoolId, name: 'SVT', cycle: 'secondaire', coefficient: 2 },
      { school_id: schoolId, name: 'Mathématiques', cycle: 'secondaire', coefficient: 4 },
      { school_id: schoolId, name: 'Sciences physiques', cycle: 'secondaire', coefficient: 3 },
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
