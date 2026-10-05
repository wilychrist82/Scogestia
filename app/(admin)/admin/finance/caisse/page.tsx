import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CashRegister } from '@/components/comptable/CashRegister'
import { FinanceNavTabs } from '@/components/admin/finance/FinanceNavTabs'
import { FinanceExecutiveBanner } from '@/components/admin/finance/FinanceExecutiveBanner'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Caisse (Encaissements) | Scogestia'
}

export default async function CaissePage() {
  const supabase = await createClient()

  // 1. Authentification
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // 2. Rôle et Établissement
  const { data: userRole } = await supabase
    .from('user_school_roles')
    .select('role, school_id, full_name')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!userRole?.school_id) {
    redirect('/admin')
  }

  const schoolId = userRole.school_id

  // 3. Récupérer les informations de l'école (pour le reçu)
  const { data: schoolData } = await supabase
    .from('schools')
    .select('name, logo_url, signature_url, stamp_url, current_academic_year')
    .eq('id', schoolId)
    .limit(1)
    .maybeSingle()

  const cashierName = userRole.full_name || 'La Direction'
  const academicYear = schoolData?.current_academic_year || '2024-2025'

  // 4. Récupérer tous les élèves et leurs classes avec la syntaxe PostgREST correcte `classes(name)`
  const { data: studentsData } = await supabase
    .from('students')
    .select(`
      id,
      first_name,
      last_name,
      classes(name)
    `)
    .eq('school_id', schoolId)
    .order('last_name')

  // 5. Échéances de l'école
  const { data: duesData } = await supabase
    .from('payment_schedules')
    .select('id, student_id, label, amount_due, status, due_date')
    .eq('school_id', schoolId)

  // 6. Paiements reçus
  const { data: paymentsData } = await supabase
    .from('payments')
    .select('schedule_id, amount')
    .eq('school_id', schoolId)

  // Assemblage sécurisé des données
  const studentsMap = new Map<string, any>()
  
  studentsData?.forEach((s: any) => {
    const className = Array.isArray(s.classes) ? s.classes[0]?.name : s.classes?.name

    studentsMap.set(s.id, {
      id: s.id,
      first_name: s.first_name || '',
      last_name: s.last_name || '',
      class_name: className || 'Non assignée',
      dues: []
    })
  })

  // Agréger les paiements par échéance
  const paidAmountsByDue = new Map<string, number>()
  paymentsData?.forEach(p => {
    if (!p.schedule_id) return
    const current = paidAmountsByDue.get(p.schedule_id) || 0
    paidAmountsByDue.set(p.schedule_id, current + Number(p.amount || 0))
  })

  // Assigner les échéances aux élèves
  duesData?.forEach(due => {
    const student = studentsMap.get(due.student_id)
    if (student) {
      student.dues.push({
        id: due.id,
        label: due.label || 'Frais scolaire',
        amount: Number(due.amount_due || 0),
        status: due.status || 'en_attente',
        due_date: due.due_date || '',
        paid_amount: paidAmountsByDue.get(due.id) || 0
      })
    }
  })

  const formattedStudents = Array.from(studentsMap.values())

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12 px-1">
      <FinanceNavTabs basePath="/admin/finance" />

      <FinanceExecutiveBanner
        badge={`OPÉRATIONS DE GUICHET · ${academicYear}`}
        title="Guichet de Caisse & Encaissements"
        subtitle="Recherchez un élève pour encaisser un versement de scolarité ou cantine et éditer le reçu de paiement officiel."
        stats={[
          { label: 'Élèves actifs', value: formattedStudents.length, color: 'text-blue-700' },
          { label: 'Guichet', value: 'Ouvert', color: 'text-emerald-700' },
        ]}
      />

      <CashRegister 
        students={formattedStudents} 
        schoolData={{
          name: schoolData?.name || 'École',
          logo_url: schoolData?.logo_url,
          director_signature_url: schoolData?.signature_url,
          stamp_url: schoolData?.stamp_url
        }} 
        cashierName={cashierName}
      />
    </div>
  )
}
