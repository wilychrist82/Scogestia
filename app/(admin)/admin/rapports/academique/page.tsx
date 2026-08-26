import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AcademiqueRapportsManager } from '@/components/admin/rapports/AcademiqueRapportsManager'

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
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', schoolId)
    .order('name')

  // Récupérer les moyennes (simulées via les notes si pas de vue pré-calculée)
  // Pour un SaaS réel, on a souvent une table term_summaries. 
  // On va utiliser student_term_summary s'il existe, sinon on mock.
  const { data: termSummaries } = await supabase
    .from('student_term_summary')
    .select('class_id, term_name, average')
    .eq('school_id', schoolId)

  // Agréger par classe
  const classStats: any[] = []
  
  if (classes) {
    classes.forEach(c => {
      const classSummaries = termSummaries?.filter(s => s.class_id === c.id) || []
      const totalStudents = classSummaries.length
      const passed = classSummaries.filter(s => Number(s.average) >= 10).length
      const successRate = totalStudents > 0 ? (passed / totalStudents) * 100 : 0
      
      let classTotalAvg = 0
      classSummaries.forEach(s => classTotalAvg += Number(s.average))
      const classAverage = totalStudents > 0 ? classTotalAvg / totalStudents : 0

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
