import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AcademiqueRapportsManager } from '@/components/admin/rapports/AcademiqueRapportsManager'
import { sortClasses } from '@/lib/classes'

export const dynamic = 'force-dynamic'

export default async function AcademiqueRapportsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id')
    .eq('user_id', user.id)
    .limit(1).maybeSingle()

  if (!roleData?.school_id) {
    return <div className="p-8 text-[var(--color-status-retard-text)]">École introuvable.</div>
  }

  const schoolId = roleData.school_id

  // Récupérer les classes
  const { data: classesRaw } = await supabase
    .from('classes')
    .select('id, name, level')
    .eq('school_id', schoolId)

  const classes = sortClasses(classesRaw || [])

  // Récupérer les élèves de l'école
  const { data: schoolStudents } = await supabase
    .from('students')
    .select('id, class_id')
    .eq('school_id', schoolId)

  // Récupérer toutes les notes et bulletins réels
  const [
    { data: secGrades },
    { data: primGrades },
    { data: legacyGrades },
    { data: pubBulletins }
  ] = await Promise.all([
    supabase
      .from('secondary_grades')
      .select('student_id, class_score, comp_score')
      .eq('school_id', schoolId),
    supabase
      .from('primary_grades')
      .select('student_id, score, max_score')
      .eq('school_id', schoolId)
      .not('score', 'is', null),
    supabase
      .from('grades')
      .select('student_id, score')
      .eq('school_id', schoolId)
      .not('score', 'is', null),
    supabase
      .from('published_bulletins')
      .select('student_id, general_average')
      .eq('school_id', schoolId)
  ])

  // Agréger les moyennes par élève
  const studentAverages: Record<string, number> = {}
  const studentScoreBuckets: Record<string, number[]> = {}

  // 1. Bulletins officiels déjà publiés
  pubBulletins?.forEach((b: any) => {
    if (b.student_id && b.general_average !== null && b.general_average !== undefined) {
      studentAverages[b.student_id] = Number(b.general_average)
    }
  })

  // 2. Notes du secondaire (Collège & Lycée)
  secGrades?.forEach((g: any) => {
    if (!g.student_id) return
    let val: number | null = null
    if (g.class_score !== null && g.class_score !== undefined && g.comp_score !== null && g.comp_score !== undefined) {
      val = (Number(g.class_score) + Number(g.comp_score)) / 2
    } else if (g.comp_score !== null && g.comp_score !== undefined) {
      val = Number(g.comp_score)
    } else if (g.class_score !== null && g.class_score !== undefined) {
      val = Number(g.class_score)
    }
    if (val !== null) {
      if (!studentScoreBuckets[g.student_id]) studentScoreBuckets[g.student_id] = []
      studentScoreBuckets[g.student_id].push(val)
    }
  })

  // 3. Notes du primaire (harmonisé sur 20)
  primGrades?.forEach((g: any) => {
    if (!g.student_id || g.score === null) return
    const max = Number(g.max_score) || 10
    const val = (Number(g.score) / max) * 20
    if (!studentScoreBuckets[g.student_id]) studentScoreBuckets[g.student_id] = []
    studentScoreBuckets[g.student_id].push(val)
  })

  // 4. Notes legacy
  legacyGrades?.forEach((g: any) => {
    if (!g.student_id || g.score === null) return
    if (!studentScoreBuckets[g.student_id]) studentScoreBuckets[g.student_id] = []
    studentScoreBuckets[g.student_id].push(Number(g.score))
  })

  // Calcul de la moyenne pour chaque élève sans bulletin publié
  Object.entries(studentScoreBuckets).forEach(([sId, scores]) => {
    if (studentAverages[sId] === undefined && scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      studentAverages[sId] = Math.round(avg * 100) / 100
    }
  })

  // Agréger par classe pour alimenter les graphiques et le tableau
  const classStats: any[] = []
  
  if (classes) {
    classes.forEach(c => {
      const classStudents = schoolStudents?.filter(s => s.class_id === c.id) || []
      const evaluatedStudents = classStudents.filter(s => studentAverages[s.id] !== undefined)
      
      const totalStudents = evaluatedStudents.length > 0 ? evaluatedStudents.length : classStudents.length
      const passed = evaluatedStudents.filter(s => (studentAverages[s.id] ?? 0) >= 10).length
      const successRate = evaluatedStudents.length > 0 ? (passed / evaluatedStudents.length) * 100 : 0
      
      let classTotalAvg = 0
      evaluatedStudents.forEach(s => {
        classTotalAvg += studentAverages[s.id] || 0
      })
      const classAverage = evaluatedStudents.length > 0 ? classTotalAvg / evaluatedStudents.length : 0

      classStats.push({
        id: c.id,
        name: c.name,
        totalStudents,
        successRate: Number(successRate.toFixed(2)),
        classAverage: Number(classAverage.toFixed(2)),
      })
    })
  }

  return (
    <AcademiqueRapportsManager 
      classStats={classStats}
    />
  )
}
