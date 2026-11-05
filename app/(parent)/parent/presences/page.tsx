import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { resolveStudentId } from '@/lib/parent-utils'
import { ChildSwitchBar } from '@/components/parent/ChildSwitchBar'
import { JustifyAbsenceButton } from '@/components/parent/JustifyAbsenceButton'
import { UserX, ArrowLeft, CalendarOff, Clock, CheckCircle2, Calendar, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ParentPresencesPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/connexion')

  const resolvedSearchParams = await searchParams;
  const { childrenList, selectedChild, selectedChildId } = await resolveStudentId(supabase, user.id, resolvedSearchParams)

  if (!selectedChildId) {
    return (
      <div className="p-6 text-center flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <UserX className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">Aucun élève lié</h2>
        <p className="text-[var(--color-on-surface-variant)] mb-6">Vous n'avez aucun enfant lié à votre compte.</p>
        <Link href="/parent" className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-full font-semibold">
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  const childId = selectedChildId

  // Si on veut être sûr que le student complet existe (pour classes, etc.)
  const { data: student } = await supabase
    .from('students')
    .select('first_name, last_name, class_id, classes(name)')
    .eq('id', childId)
    .single()

  if (!student) {
    return (
      <div className="p-6 text-center">
        <p>Informations de l'élève introuvables.</p>
      </div>
    )
  }

  // Récupérer les présences de l'élève
  const { data: attendances } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', childId)
    .order('date', { ascending: false })

  const absences = (attendances || []).filter(a => a.status === 'absent')
  const retards = (attendances || []).filter(a => a.status === 'retard')

  return (
    <div className="p-4 space-y-6 pb-20">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-[var(--color-outline-variant)]">
        <Link href="/parent" className="text-[var(--color-on-surface-variant)] hover:text-emerald-700 transition-colors p-1 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-on-surface)]">Assiduité</h1>
          <p className="text-sm text-[var(--color-primary)] font-medium">
            {student.first_name} {student.last_name} • {(student.classes as any)?.name}
          </p>
        </div>
      </div>

      {childrenList.length > 0 && (
        <ChildSwitchBar
          childrenList={childrenList}
          selectedChildId={childId}
          title="Élève"
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col items-center justify-center text-center">
          <CalendarOff className="w-8 h-8 text-red-500 mb-1" />
          <span className="text-2xl font-bold text-red-600">{absences.length}</span>
          <span className="text-xs text-red-800 font-medium uppercase tracking-wide">Absences</span>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col items-center justify-center text-center">
          <Clock className="w-8 h-8 text-orange-500 mb-1" />
          <span className="text-2xl font-bold text-orange-600">{retards.length}</span>
          <span className="text-xs text-orange-800 font-medium uppercase tracking-wide">Retards</span>
        </div>
      </div>

      {!attendances || attendances.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-[var(--color-outline-variant)] text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-[#e8f5e9] rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#2e7d32]" />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-on-surface)] mb-1">Excellente assiduité</h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm">Aucune absence ou retard n'a été enregistré.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-outline-variant)] overflow-hidden">
          <div className="bg-[var(--color-surface)] px-4 py-3 border-b border-[var(--color-outline-variant)] font-bold text-[var(--color-on-surface)]">
            Historique
          </div>
          <div className="divide-y divide-[var(--color-outline-variant)]">
            {attendances.map((record: any) => {
              const isAbsent = record.status === 'absent';
              const isJustified = record.status === 'absent_justifie' || Boolean(record.justification);
              const isPresent = record.status === 'present';

              const statusLabel =
                record.status === 'absent_justifie'
                  ? 'Absence justifiée'
                  : record.status === 'absent'
                  ? 'Absent(e)'
                  : record.status === 'retard'
                  ? 'Retard'
                  : record.status === 'present'
                  ? 'Présent(e)'
                  : record.status;

              return (
                <div key={record.id} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isPresent
                        ? 'bg-emerald-100 text-emerald-700'
                        : isJustified
                        ? 'bg-blue-100 text-blue-700'
                        : isAbsent
                        ? 'bg-red-100 text-red-600'
                        : 'bg-orange-100 text-orange-600'
                    }`}
                  >
                    {isPresent ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isJustified ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : isAbsent ? (
                      <CalendarOff className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-[var(--color-on-surface)]">
                        {statusLabel}
                      </h3>
                      {isJustified && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Justifié
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-on-surface-variant)] flex items-center gap-1 mt-1">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(record.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    {record.justification && (
                      <div className="mt-2 text-xs sm:text-sm bg-emerald-50/70 p-2.5 rounded-lg text-slate-700 italic border-l-3 border-emerald-500">
                        Motif : &ldquo;{record.justification}&rdquo;
                      </div>
                    )}
                    <JustifyAbsenceButton
                      attendanceId={record.id}
                      currentJustification={record.justification}
                      status={record.status}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )
}
