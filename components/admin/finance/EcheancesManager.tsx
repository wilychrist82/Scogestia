'use client'

import { useState, useTransition, FormEvent } from 'react'
import { generateSchedule, deleteSchedule } from '@/app/actions/finance'
import Link from 'next/link'

type ClassItem = { id: string; name: string }
type StudentItem = { id: string; last_name: string; first_name: string; matricule: string }
type ScheduleItem = {
  id: string
  label: string
  amount_due: number
  due_date: string
  status: string
  student: { last_name: string, first_name: string, classes: { name: string } | null, parent_phone?: string | null } | null
}

type Props = {
  schedules: ScheduleItem[]
  classes: ClassItem[]
  students: StudentItem[]
}

export function EcheancesManager({ schedules, classes, students, basePath = "/admin/finance" }: Props & { basePath?: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [scheduleType, setScheduleType] = useState<'class' | 'individual'>('class')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  const openAddModal = () => {
    setError(null)
    setIsModalOpen(true)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.append('type', scheduleType)
    
    startTransition(async () => {
      const result = await generateSchedule(null, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setIsModalOpen(false)
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette échéance ? Cette action est irréversible.")) return
    
    startTransition(async () => {
      const result = await deleteSchedule(id)
      if (result?.error) {
        alert(result.error)
      } else {
        setOpenDropdownId(null)
      }
    })
  }

  const formatCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount).replace('XOF', 'FCFA')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paye': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e6f4ea] text-[#1e8e3e]">Payé</span>
      case 'en_attente': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f1f3f4] text-[#5f6368]">En attente</span>
      case 'partiel': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fef7e0] text-[#e37400]">Partiel</span>
      case 'en_retard': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fce8e6] text-[#d93025]">En retard</span>
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1280px] mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
              <Link href={basePath} className="hover:text-[var(--color-primary)] transition-colors text-sm font-semibold">
                Finance
              </Link>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Échéances</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Gestion des Échéances</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Consultez et générez les frais scolaires pour vos élèves.</p>
          </div>
          <button onClick={openAddModal} className="flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white h-12 px-6 rounded-full text-sm font-semibold hover:opacity-90 transition-colors shadow-sm w-full sm:w-auto shrink-0">
            <span className="material-symbols-outlined text-[20px]">add_task</span>
            Générer une échéance
          </button>
        </div>

        {error && (
          <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-3 rounded text-sm font-medium">
            {error}
          </div>
        )}

        {/* Data Table Container */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] overflow-hidden shadow-sm flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-[var(--color-outline-variant)] flex flex-col sm:flex-row gap-4 bg-[var(--color-surface-bright)] justify-between items-center">
            <div className="flex gap-2 w-full sm:w-auto">
              <select className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none">
                <option value="">Toutes les classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg px-4 py-2.5 text-sm text-[var(--color-on-surface)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none">
                <option value="">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="paye">Payé</option>
                <option value="en_retard">En retard</option>
              </select>
            </div>
            <span className="text-sm font-medium text-[var(--color-on-surface-variant)]">{schedules.length} échéances trouvées</span>
          </div>

          {schedules.length === 0 ? (
             <div className="p-12 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] flex-1">
               <span className="material-symbols-outlined text-4xl mb-2 opacity-50">receipt_long</span>
               <p className="text-lg font-medium">Aucune échéance trouvée</p>
               <p className="text-sm">Générez des échéances pour vos classes ou élèves.</p>
            </div>
          ) : (
            <div className="overflow-x-auto min-h-[250px] custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] text-sm">
                    <th className="py-4 px-6 font-semibold">Élève</th>
                    <th className="py-4 px-6 font-semibold">Classe</th>
                    <th className="py-4 px-6 font-semibold">Type de frais</th>
                    <th className="py-4 px-6 font-semibold text-right">Montant</th>
                    <th className="py-4 px-6 font-semibold">Date d'échéance</th>
                    <th className="py-4 px-6 font-semibold">Statut</th>
                    <th className="py-4 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-outline-variant)] text-base">
                  {schedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-[var(--color-surface-container-lowest)]/50 transition-colors bg-[var(--color-surface-container-lowest)]">
                      <td className="py-3 px-6 font-medium text-[var(--color-on-surface)]">
                        {schedule.student?.last_name} {schedule.student?.first_name}
                      </td>
                      <td className="py-3 px-6 text-[var(--color-on-surface-variant)]">
                        {schedule.student?.classes?.name || '-'}
                      </td>
                      <td className="py-3 px-6 text-[var(--color-on-surface-variant)]">{schedule.label}</td>
                      <td className="py-3 px-6 text-right font-medium text-[var(--color-on-surface)]">{formatCFA(schedule.amount_due)}</td>
                      <td className="py-3 px-6 text-[var(--color-on-surface-variant)]">
                        {new Date(schedule.due_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-6">
                        {getStatusBadge(schedule.status)}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          {schedule.status !== 'paye' && schedule.student?.parent_phone && (
                            <a 
                              href={`https://wa.me/${schedule.student.parent_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                schedule.status === 'en_retard' 
                                ? `Bonjour, nous vous rappelons que le paiement de "${schedule.label}" pour votre enfant ${schedule.student.first_name} ${schedule.student.last_name} est en retard. Merci de régulariser la situation.`
                                : `Bonjour, nous vous rappelons que le paiement de "${schedule.label}" pour votre enfant ${schedule.student.first_name} ${schedule.student.last_name} est attendu pour le ${new Date(schedule.due_date).toLocaleDateString('fr-FR')}.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                                schedule.status === 'en_retard' 
                                ? 'bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white' 
                                : 'bg-gray-100 text-gray-500 hover:bg-[#25D366] hover:text-white'
                              }`}
                              title="Relancer par WhatsApp"
                            >
                              <span className="material-symbols-outlined text-[18px]">chat</span>
                            </a>
                          )}
                          <div className="relative">
                            <button 
                              onClick={() => setOpenDropdownId(openDropdownId === schedule.id ? null : schedule.id)}
                              className="p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container-high)] rounded-full transition-colors"
                            >
                              <span className="material-symbols-outlined text-[20px]">more_vert</span>
                            </button>
                            {openDropdownId === schedule.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setOpenDropdownId(null)}></div>
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[var(--color-outline-variant)] py-1 z-20 overflow-hidden">
                                  <button onClick={() => handleDelete(schedule.id)} disabled={isPending} className="w-full text-left px-4 py-2 text-sm text-[var(--color-status-retard-text)] hover:bg-[#fff0f0] flex items-center gap-2 border-[var(--color-outline-variant)] disabled:opacity-50">
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                    Supprimer
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Générer Échéance */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b1c30]/40 backdrop-blur-sm transition-opacity">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-lg rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--color-outline-variant)] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-outline-variant)] flex justify-between items-center bg-[var(--color-surface-bright)]">
              <h2 className="text-xl font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)]">add_task</span>
                Générer des échéances
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] p-1 rounded-full hover:bg-[#dce9ff] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-6">
                
                {/* Type selector */}
                <div className="flex gap-4 p-1 bg-[var(--color-surface-container-low)] rounded-lg">
                  <button 
                    type="button" 
                    onClick={() => setScheduleType('class')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${scheduleType === 'class' ? 'bg-white shadow text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'}`}
                  >
                    Pour une classe entière
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setScheduleType('individual')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${scheduleType === 'individual' ? 'bg-white shadow text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'}`}
                  >
                    Pour un seul élève
                  </button>
                </div>

                {scheduleType === 'class' ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="classId">
                      Classe <span className="text-[var(--color-status-retard-text)]">*</span>
                    </label>
                    <select className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none appearance-none bg-[var(--color-surface)]" id="classId" name="classId" required>
                      <option value="">Sélectionner une classe</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="studentId">
                      Élève <span className="text-[var(--color-status-retard-text)]">*</span>
                    </label>
                    <select className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none appearance-none bg-[var(--color-surface)]" id="studentId" name="studentId" required>
                      <option value="">Rechercher / Sélectionner un élève</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.matricule} - {s.last_name} {s.first_name}</option>)}
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="label">
                    Type de frais / Libellé <span className="text-[var(--color-status-retard-text)]">*</span>
                  </label>
                  <input className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]" id="label" name="label" type="text" placeholder="Ex: Scolarité 1er Trimestre" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="amount">
                      Montant (FCFA) <span className="text-[var(--color-status-retard-text)]">*</span>
                    </label>
                    <input className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]" id="amount" name="amount" type="number" min="0" placeholder="Ex: 50000" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="dueDate">
                      Date d'échéance <span className="text-[var(--color-status-retard-text)]">*</span>
                    </label>
                    <input className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]" id="dueDate" name="dueDate" type="date" required />
                  </div>
                </div>

              </div>
              
              <div className="px-6 py-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] flex justify-end gap-3 mt-auto">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-[var(--color-outline)] text-[var(--color-on-surface)] font-semibold text-sm hover:bg-[#eff4ff] transition-colors" disabled={isPending}>Annuler</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:opacity-90 transition-colors shadow-sm disabled:opacity-50" disabled={isPending}>
                  {isPending ? 'Génération...' : 'Générer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
