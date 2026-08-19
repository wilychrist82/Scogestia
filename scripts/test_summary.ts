import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSummary() {
  console.log("=== Test de la vue student_term_summary ===")
  
  // 1. D'abord, générer quelques notes et absences pour que la vue ait des données.
  // Le seed de la Phase 0 contient des étudiants, mais peut-être pas de notes.
  // Récupérons des étudiants pour injecter des données
  const { data: students, error: stdErr } = await supabase
    .from('students')
    .select('id, class_id, school_id')
    .limit(3)
    
  if (stdErr || !students || students.length === 0) {
    console.error("Erreur récupération élèves:", stdErr)
    return
  }
  
  const term = "Trimestre 1"
  const s1 = students[0]
  const s2 = students[1]
  const s3 = students[2]
  
  // Injectons des notes
  await supabase.from('grades').insert([
    { school_id: s1.school_id, student_id: s1.id, class_id: s1.class_id, subject_name: 'Math', evaluation_type: 'devoir_mensuel', term, score: 15, max_score: 20, coefficient: 2 },
    { school_id: s1.school_id, student_id: s1.id, class_id: s1.class_id, subject_name: 'Français', evaluation_type: 'composition_trimestrielle', term, score: 10, max_score: 20, coefficient: 1 },
    
    { school_id: s2.school_id, student_id: s2.id, class_id: s2.class_id, subject_name: 'Math', evaluation_type: 'devoir_mensuel', term, score: 18, max_score: 20, coefficient: 2 },
    
    { school_id: s3.school_id, student_id: s3.id, class_id: s3.class_id, subject_name: 'Math', evaluation_type: 'devoir_mensuel', term, score: 8, max_score: 20, coefficient: 2 },
  ])
  
  // Injectons des absences
  await supabase.from('attendance').insert([
    { school_id: s1.school_id, student_id: s1.id, class_id: s1.class_id, date: '2023-10-01', status: 'absent' },
    { school_id: s1.school_id, student_id: s1.id, class_id: s1.class_id, date: '2023-10-02', status: 'absent' },
    { school_id: s2.school_id, student_id: s2.id, class_id: s2.class_id, date: '2023-10-01', status: 'absent' },
  ])
  
  // 2. Interroger la vue
  const { data: summary, error: sumErr } = await supabase
    .from('student_term_summary')
    .select(`
      student_id,
      term,
      term_average,
      class_rank,
      unjustified_absences,
      student:students(first_name, last_name)
    `)
    .order('class_rank', { ascending: true })
    
  if (sumErr) {
    console.error("Erreur requête vue:", sumErr)
  } else {
    console.log("Résultat de student_term_summary:")
    console.table(summary.map(s => ({
      Elève: `${(s.student as any).first_name} ${(s.student as any).last_name}`,
      Moyenne: s.term_average,
      Rang: s.class_rank,
      'Absences (non just.)': s.unjustified_absences
    })))
  }
}

testSummary()
