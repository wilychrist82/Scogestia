import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CashRegister } from '@/components/comptable/CashRegister'

export const metadata = {
  title: 'Caisse (Encaissements) | Scogestia'
}

export default async function CaissePage() {
  const supabase = await createClient()

  // 1. Authentification et Rôle
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: userRole } = await supabase
    .from('user_school_roles')
    .select('role, school_id, full_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!userRole || !['admin', 'comptable'].includes(userRole.role)) {
    redirect('/admin')
  }

  // 2. Récupérer les informations de l'école (pour le reçu)
  const { data: schoolData } = await supabase
    .from('schools')
    .select('name, logo_url, signature_url, stamp_url')
    .eq('id', userRole.school_id)
    .maybeSingle()

  // 2.5 Nom du caissier depuis user_school_roles
  const cashierName = userRole.full_name || 'La Direction'

  // 3. Récupérer tous les élèves et leurs échéances et paiements
  const { data: studentsData } = await supabase
    .from('students')
    .select(`
      id,
      first_name,
      last_name,
      classes:class_id(name)
    `)
    .eq('school_id', userRole.school_id)
    .order('last_name')

  const { data: duesData } = await supabase
    .from('payment_schedules')
    .select('id, student_id, label, amount_due, status, due_date')
    .eq('school_id', userRole.school_id)

  const { data: paymentsData } = await supabase
    .from('payments')
    .select('schedule_id, amount')
    .eq('school_id', userRole.school_id)

  // Assemblage des données
  const studentsMap = new Map<string, any>()
  
  studentsData?.forEach((s: any) => {
    const className = Array.isArray(s.classes) ? s.classes[0]?.name : s.classes?.name

    studentsMap.set(s.id, {
      id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      class_name: className || 'Non assignée',
      dues: []
    })
  })

  // Agréger les paiements par échéance
  const paidAmountsByDue = new Map<string, number>()
  paymentsData?.forEach(p => {
    const current = paidAmountsByDue.get(p.schedule_id) || 0
    paidAmountsByDue.set(p.schedule_id, current + Number(p.amount))
  })

  // Assigner les échéances aux élèves
  duesData?.forEach(due => {
    const student = studentsMap.get(due.student_id)
    if (student) {
      student.dues.push({
        id: due.id,
        label: due.label,
        amount: Number(due.amount_due),
        status: due.status,
        due_date: due.due_date,
        paid_amount: paidAmountsByDue.get(due.id) || 0
      })
    }
  })

  const formattedStudents = Array.from(studentsMap.values())

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Caisse (Encaissements)</h1>
        <p className="text-gray-500 mt-2">
          Recherchez un élève pour encaisser ses frais de scolarité, cantine, transport, etc.
        </p>
      </div>

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
