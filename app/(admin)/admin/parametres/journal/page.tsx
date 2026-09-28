import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { JournalActivite, ActivityItem } from '@/components/admin/parametres/JournalActivite'

export const dynamic = 'force-dynamic'

export default async function JournalPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: roleData } = await supabase
    .from('user_school_roles')
    .select('school_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!roleData?.school_id) {
    redirect('/admin')
  }

  const schoolId = roleData.school_id

  // 1. Fetch school info
  const { data: school } = await supabase
    .from('schools')
    .select('name')
    .eq('id', schoolId)
    .single()

  const activities: ActivityItem[] = []

  // 2. Fetch recent payments
  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount, payment_method, receipt_number, paid_at, student:students(first_name, last_name)')
    .eq('school_id', schoolId)
    .order('paid_at', { ascending: false })
    .limit(20)

  if (payments) {
    payments.forEach(p => {
      const studentName = p.student ? `${(p.student as any).first_name} ${(p.student as any).last_name}` : 'Élève'
      activities.push({
        id: `pay-${p.id}`,
        type: 'payment',
        title: `Paiement enregistré — ${studentName}`,
        description: `Mode: ${p.payment_method || 'Espèces / Caisse'} • Reçu N°: ${p.receipt_number || 'Non spécifié'}`,
        timestamp: p.paid_at || new Date().toISOString(),
        actor: 'Caisse / Comptabilité',
        amount: Number(p.amount) || 0,
        metadata: `Réf: ${p.receipt_number || p.id.slice(0, 8)}`
      })
    })
  }

  // 3. Fetch recent enrolled students
  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, matricule, created_at, classes(name)')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
    .limit(15)

  if (students) {
    students.forEach(s => {
      activities.push({
        id: `stu-${s.id}`,
        type: 'student',
        title: `Inscription élève — ${s.first_name} ${s.last_name}`,
        description: `Classe: ${(s.classes as any)?.name || 'N/A'} • Matricule: ${s.matricule}`,
        timestamp: s.created_at || new Date().toISOString(),
        actor: 'Secrétariat',
        metadata: `Matricule: ${s.matricule}`
      })
    })
  }

  // 4. Fetch recent communications
  const { data: comms } = await supabase
    .from('communications')
    .select('id, title, channel, created_at, audience_type')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (comms) {
    comms.forEach(c => {
      activities.push({
        id: `comm-${c.id}`,
        type: 'communication',
        title: `Communication diffusée — ${c.title}`,
        description: `Canal: ${c.channel || 'SMS/WhatsApp'} • Cible: ${c.audience_type || 'Parents'}`,
        timestamp: c.created_at || new Date().toISOString(),
        actor: 'Direction / Administration',
      })
    })
  }

  // Trier par date décroissante
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <JournalActivite 
      activities={activities} 
      schoolName={school?.name || 'Mon Établissement'} 
    />
  )
}
