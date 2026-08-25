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
  const { data: students } = await supabase.from('students').select('id, matricule, last_name, first_name, class_id').eq('school_id', schoolId).order('last_name')
  let { data: subjects } = await supabase.from('subjects').select('*').eq('school_id', schoolId)
  
  if (!subjects || subjects.length === 0) {
    // Auto-seed from Togolese curriculum (user captures)
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
      { school_id: schoolId, name: 'Chant', cycle: 'primaire', category: 'Divers' },
      { school_id: schoolId, name: 'Récitation', cycle: 'primaire', category: 'Divers' },
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
    const { data: newSubjects } = await supabase.from('subjects').select('*').eq('school_id', schoolId);
    subjects = newSubjects;
  }
  
  // We fetch all grades for the school to compute client side. 
  // In a huge real-world app, this would be behind a dedicated API route per student/class, but we keep it simple here.
  const { data: primaryGrades } = await supabase.from('primary_grades').select('*').eq('school_id', schoolId)
  const { data: secondaryGrades } = await supabase.from('secondary_grades').select('*').eq('school_id', schoolId)

  // Fetch new metadata fields for primary (we can just fetch all for the school's students, or just ignore errors if table missing)
  const { data: studentsData } = await supabase.from('students').select('id').eq('school_id', schoolId);
  const studentIds = studentsData ? studentsData.map(s => s.id) : [];
  
  let primaryRanks: any[] = [];
  let primaryInfo: any[] = [];
  if (studentIds.length > 0) {
    const { data: r } = await supabase.from('primary_monthly_ranks').select('*').in('student_id', studentIds);
    if (r) primaryRanks = r;
    const { data: i } = await supabase.from('primary_bulletin_info').select('*').in('student_id', studentIds);
    if (i) primaryInfo = i;
  }

  return (
    <BulletinsManager 
      classes={classes || []} 
      students={students || []} 
      subjects={subjects || []}
      primaryGrades={primaryGrades || []}
      secondaryGrades={secondaryGrades || []}
      primaryRanks={primaryRanks}
      primaryInfo={primaryInfo}
      schoolName={(schoolDetails as any)?.name || 'École'}
    />
  )
}
