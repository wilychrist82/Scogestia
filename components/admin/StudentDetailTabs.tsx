'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { generateParentCode } from '@/app/actions/invitations'
import { EmptyState } from '@/components/ui/EmptyState'
import { 
  FileEdit, CalendarDays, Banknote, Camera, User, GraduationCap, 
  CalendarCheck, CreditCard, CheckCircle2, Clock, CalendarOff, Receipt, Plus,
  Loader2, Edit3, Mail, Trash2, Users, Copy, Key, HeartPulse, X, Mic, 
  ChevronRight, MessageSquare, Info, ArrowLeft, Send, AlertTriangle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { AudioRecorder } from '@/components/ui/AudioRecorder'

type Student = {
  id: string
  matricule: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  birth_place?: string | null
  gender?: string | null
  blood_group?: string | null
  address?: string | null
  parent_phone?: string | null
  parent_email?: string | null
  avatar_url?: string | null
  classes: {
    name: string
  } | null
}

type Props = {
  student: Student
  grades?: any[]
  attendances?: any[]
  schedules?: any[]
  payments?: any[]
}

export function StudentDetailTabs({ 
  student, 
  grades = [], 
  attendances = [], 
  schedules = [], 
  payments = [] 
}: Props) {
  const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'presences' | 'paiements'>('info')
  const [isPending, startTransition] = useTransition()
  const [invitationCode, setInvitationCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const [activeContactView, setActiveContactView] = useState<'list' | 'vocal' | 'sms'>('list')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const handleStudentDelete = () => {
    startTransition(async () => {
      const { deleteStudent } = await import('@/app/actions/students')
      const res = await deleteStudent(student.id)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(`Élève ${student.first_name} ${student.last_name} supprimé avec succès.`)
        setIsDeleteModalOpen(false)
        router.push('/admin/eleves')
      }
    })
  }

  const handleStudentUnassign = () => {
    startTransition(async () => {
      const { removeStudentFromClass } = await import('@/app/actions/students')
      const res = await removeStudentFromClass(student.id)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(`Élève retiré de sa classe avec succès.`)
        setIsDeleteModalOpen(false)
        router.refresh()
      }
    })
  }
  
  const handleVoiceMessageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!audioUrl) {
      toast.error("Veuillez enregistrer un message vocal.")
      return
    }
    
    const formData = new FormData()
    formData.append('recipientType', 'parent')
    formData.append('selectedParent', student.id)
    formData.append('subject', 'Message vocal')
    formData.append('message', 'Vous avez reçu un nouveau message vocal.')
    formData.append('audioUrl', audioUrl)
    
    startTransition(async () => {
      const { sendCommunication } = await import('@/app/actions/communication')
      const result = await sendCommunication(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Message vocal envoyé avec succès !")
        setIsContactModalOpen(false)
        setActiveContactView('list')
        setAudioUrl(null)
      }
    })
  }

  const handleTextSubmit = async (e: React.FormEvent<HTMLFormElement>, channel: 'sms' | 'email' | 'whatsapp') => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const textMessage = formData.get('message') as string

    if (!textMessage || textMessage.trim() === '') {
      toast.error("Veuillez saisir un message.")
      return
    }

    const payload = new FormData()
    payload.append('recipientType', 'parent')
    payload.append('selectedParent', student.id)
    payload.append('subject', `Message ${channel.toUpperCase()}`)
    payload.append('message', textMessage)

    if (channel === 'sms') payload.append('sendSms', 'true')
    if (channel === 'email') payload.append('sendEmail', 'true')
    if (channel === 'whatsapp') payload.append('sendWhatsapp', 'true')

    startTransition(async () => {
      const { sendCommunication } = await import('@/app/actions/communication')
      const result = await sendCommunication(payload)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Message envoyé avec succès !`)
        setIsContactModalOpen(false)
        setActiveContactView('list')
      }
    })
  }

  const handleGenerateCode = () => {
    setError(null)
    startTransition(async () => {
      const result = await generateParentCode(student.id)
      if (result.error) {
        setError(result.error)
      } else if (result.code) {
        setInvitationCode(result.code)
      }
    })
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setEditError(null)
    const formData = new FormData(e.currentTarget)
    formData.append('student_id', student.id)
    
    startTransition(async () => {
      // Import the action dynamically to avoid circular dependencies or server issues
      const { updateStudent } = await import('@/app/actions/students')
      const result = await updateStudent(null, formData)
      
      if (result?.error) {
        setEditError(result.error)
      } else {
        setIsEditModalOpen(false)
      }
    })
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image est trop volumineuse (max 5MB).")
      return
    }

    try {
      setIsUploading(true)
      const supabase = createClient()
      
      // Upload to storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${student.id}-${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const avatarUrl = publicUrlData.publicUrl

      // Update student record
      const { error: updateError } = await supabase
        .from('students')
        .update({ avatar_url: avatarUrl })
        .eq('id', student.id)

      if (updateError) throw updateError

      toast.success("Photo mise à jour avec succès.")
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast.error("Erreur lors de l'upload de l'image.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleAvatarUpload}
            disabled={isUploading}
          />
          <div className="w-24 h-24 rounded-lg bg-[#d5e0f8] overflow-hidden flex items-center justify-center text-4xl font-bold text-[#0b1c30] relative border border-[var(--color-outline-variant)]">
            {student.avatar_url ? (
              <img src={student.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <>{student.first_name[0]}{student.last_name[0]}</>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {isUploading ? (
                <Loader2 className="w-7 h-7 text-white animate-spin" />
              ) : (
                <Camera className="text-white" size={28} />
              )}
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-full p-1 z-10">
            <span className="w-4 h-4 rounded-full bg-[#10b981] block"></span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">{student.first_name} {student.last_name}</h2>
              <p className="text-[var(--color-on-surface-variant)] mt-1">Matricule: #{student.matricule} • Classe: {student.classes?.name || 'Non assigné'}</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="h-11 px-4 rounded-xl border border-[var(--color-primary)] text-[var(--color-primary)] font-semibold text-sm hover:bg-[#eff4ff] transition-colors flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Modifier
              </button>
              <button 
                onClick={() => { setIsContactModalOpen(true); setActiveContactView('list'); }}
                className="h-11 px-4 rounded-xl bg-[var(--color-primary)] text-white font-semibold text-sm hover:opacity-90 transition-colors flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Contacter
              </button>
              <button 
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="h-11 px-4 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 hover:border-red-300 transition-colors flex items-center gap-2"
                title="Supprimer l'élève de l'école ou de la classe"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Navigation */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto no-scrollbar pb-px">
        <button 
          type="button"
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'info' 
              ? 'bg-emerald-50 text-emerald-700 shadow-2xs border border-emerald-200/60' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <User size={16} className={activeTab === 'info' ? 'text-emerald-600' : 'text-slate-400'} />
          Informations
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'notes' 
              ? 'bg-emerald-50 text-emerald-700 shadow-2xs border border-emerald-200/60' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <GraduationCap size={16} className={activeTab === 'notes' ? 'text-emerald-600' : 'text-slate-400'} />
          Notes & Bulletins
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('presences')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'presences' 
              ? 'bg-emerald-50 text-emerald-700 shadow-2xs border border-emerald-200/60' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <CalendarCheck size={16} className={activeTab === 'presences' ? 'text-emerald-600' : 'text-slate-400'} />
          Présences & Appel
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('paiements')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'paiements' 
              ? 'bg-emerald-50 text-emerald-700 shadow-2xs border border-emerald-200/60' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
          }`}
        >
          <CreditCard size={16} className={activeTab === 'paiements' ? 'text-emerald-600' : 'text-slate-400'} />
          Paiements & Échéances
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          {/* Personal Info */}
          <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-6 lg:col-span-2 space-y-6">
            <h3 className="text-xl font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
              <User className="w-5 h-5 text-[var(--color-primary)]" />
              Détails Personnels
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-[var(--color-on-surface-variant)] mb-1">Date de naissance</p>
                <p className="font-medium text-[var(--color-on-surface)]">{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('fr-FR') : 'Non renseignée'}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-on-surface-variant)] mb-1">Lieu de naissance</p>
                <p className="font-medium text-[var(--color-on-surface)]">{student.birth_place || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-on-surface-variant)] mb-1">Genre</p>
                <p className="font-medium text-[var(--color-on-surface)]">{student.gender === 'M' ? 'Masculin' : student.gender === 'F' ? 'Féminin' : student.gender || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-on-surface-variant)] mb-1">Groupe Sanguin</p>
                <p className="font-medium text-[var(--color-on-surface)]">{student.blood_group || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-on-surface-variant)] mb-1">Adresse Domicile</p>
                <p className="font-medium text-[var(--color-on-surface)]">{student.address || 'Non renseignée'}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-on-surface-variant)] mb-1">Téléphone du parent</p>
                <p className="font-medium text-[var(--color-on-surface)]">{student.parent_phone || 'Non renseigné'}</p>
              </div>
            </div>
          </div>
          
          {/* Contact & Medical */}
          <div className="space-y-6">
            {/* Parent Contact */}
            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-6">
              <h3 className="text-xl font-semibold text-[var(--color-on-surface)] flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[var(--color-primary)]" />
                Contact Parent
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-[var(--color-on-surface-variant)]">Les informations de contact seront disponibles après l'activation du compte parent.</p>
                
                <div className="pt-4 border-t border-[var(--color-outline-variant)]/50">
                  <h4 className="text-sm font-semibold text-[var(--color-on-surface)] mb-2">Invitation Parent</h4>
                  {invitationCode ? (
                    <div className="bg-[#eff4ff] border border-[var(--color-outline-variant)] rounded-lg p-4">
                      <p className="text-sm text-[var(--color-on-surface-variant)] mb-2">Lien magique à envoyer au parent :</p>
                      <div className="text-2xl font-mono font-bold text-[var(--color-primary)] tracking-widest bg-white p-3 rounded text-center shadow-sm">
                        {invitationCode}
                      </div>
                      
                      <button 
                        onClick={() => {
                          const message = `Bonjour, voici le lien pour activer votre accès parent afin de suivre mon enfant. Cliquez ici : https://scogestia.vercel.app/activer-parent?code=${invitationCode}`;
                          navigator.clipboard.writeText(message);
                          alert("Lien copié dans le presse-papier ! Vous pouvez le coller sur WhatsApp.");
                        }}
                        className="w-full mt-3 h-10 bg-white border border-[var(--color-primary)] text-[var(--color-primary)] rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#e6eeff] transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        Copier le lien pour WhatsApp
                      </button>

                      <p className="text-xs text-[var(--color-on-surface-variant)] mt-3 text-center">Ce code expirera dans 7 jours.</p>
                    </div>
                  ) : (
                    <div>
                      {error && <p className="text-sm text-[var(--color-status-retard-text)] mb-2">{error}</p>}
                      <button 
                        onClick={handleGenerateCode}
                        disabled={isPending}
                        className="h-10 px-4 rounded-lg border border-[var(--color-primary)] text-[var(--color-primary)] font-semibold text-sm hover:bg-[#eff4ff] transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                        {isPending ? 'Génération...' : 'Générer un code d\'activation'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Medical Info */}
            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-6">
              <h3 className="text-xl font-semibold text-[var(--color-on-surface)] flex items-center gap-2 mb-4">
                <HeartPulse className="w-5 h-5 text-[var(--color-status-retard-text)]" />
                Info Médicale
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-[var(--color-on-surface-variant)]">Aucune information médicale enregistrée.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onglet 2 : Notes Scolaires Réelles */}
      {activeTab === 'notes' && (
        <div className="pt-4 space-y-6">
          {grades.length === 0 ? (
            <EmptyState 
              title="Aucune note enregistrée"
              description="Aucune évaluation n'a encore été saisie pour cet élève dans le système."
              actionLabel="Accéder à la saisie des notes"
              onAction={() => router.push('/admin/academique/notes')}
              icon={FileEdit}
            />
          ) : (
            <div className="space-y-6">
              {(() => {
                // Grouper les notes par trimestre
                const terms: Record<string, any[]> = {}
                grades.forEach(g => {
                  const t = g.term || 'Trimestre 1'
                  if (!terms[t]) terms[t] = []
                  terms[t].push(g)
                })

                return Object.entries(terms).map(([termName, termGrades]) => {
                  // Calcul moyenne du trimestre
                  let totalWeighted = 0
                  let totalCoef = 0
                  termGrades.forEach(g => {
                    const scoreOn20 = (Number(g.score || 0) / Number(g.max_score || 20)) * 20
                    const coef = Number(g.coefficient || 1)
                    totalWeighted += scoreOn20 * coef
                    totalCoef += coef
                  })
                  const avg = totalCoef > 0 ? (totalWeighted / totalCoef).toFixed(2) : '0.00'
                  const isPass = Number(avg) >= 10

                  return (
                    <div key={termName} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-800 text-base">{termName}</span>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-200/70 text-slate-700 font-semibold">
                            {termGrades.length} note{termGrades.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-medium">Moyenne trimestrielle :</span>
                          <span className={`text-sm font-black px-3 py-1 rounded-lg ${
                            isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {avg} / 20
                          </span>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50/40 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                              <th className="px-6 py-3 font-semibold">Matière</th>
                              <th className="px-4 py-3 font-semibold">Type d'évaluation</th>
                              <th className="px-4 py-3 font-semibold text-center">Note brute</th>
                              <th className="px-4 py-3 font-semibold text-center">Coef</th>
                              <th className="px-4 py-3 font-semibold text-center">Note / 20</th>
                              <th className="px-6 py-3 font-semibold">Appréciation</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {termGrades.map(g => {
                              const noteOn20 = ((Number(g.score || 0) / Number(g.max_score || 20)) * 20).toFixed(1)
                              const isGood = Number(noteOn20) >= 10

                              return (
                                <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-3.5 font-bold text-slate-800">{g.subject_name || 'Matière'}</td>
                                  <td className="px-4 py-3.5 text-xs text-slate-600 capitalize">
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium">
                                      {g.evaluation_type || 'Devoir'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5 text-center font-semibold text-slate-700">
                                    {g.score} <span className="text-xs text-slate-400">/ {g.max_score || 20}</span>
                                  </td>
                                  <td className="px-4 py-3.5 text-center text-xs font-semibold text-slate-500">
                                    {g.coefficient || 1}
                                  </td>
                                  <td className="px-4 py-3.5 text-center">
                                    <span className={`font-bold px-2.5 py-1 rounded-md text-xs ${
                                      isGood ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-rose-50 text-rose-700 font-bold'
                                    }`}>
                                      {noteOn20} / 20
                                    </span>
                                  </td>
                                  <td className="px-6 py-3.5 text-xs text-slate-500 italic">
                                    {g.remarks || '—'}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          )}
        </div>
      )}

      {/* Onglet 3 : Suivi des Présences Réelles */}
      {activeTab === 'presences' && (
        <div className="pt-4 space-y-6">
          {attendances.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center flex flex-col items-center justify-center shadow-sm">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Assiduité exemplaire</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Aucune absence ni aucun retard n'a été enregistré pour cet élève.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Synthèse Bento */}
              {(() => {
                const absences = attendances.filter(a => a.status === 'absent')
                const retards = attendances.filter(a => a.status === 'retard')

                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <CalendarOff size={24} />
                      </div>
                      <div>
                        <span className="text-2xl font-black text-rose-700">{absences.length}</span>
                        <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Absences au total</p>
                      </div>
                    </div>

                    <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <Clock size={24} />
                      </div>
                      <div>
                        <span className="text-2xl font-black text-amber-700">{retards.length}</span>
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Retards au total</p>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Tableau de l'historique */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800 text-sm">
                  Historique des présences
                </div>
                <div className="divide-y divide-slate-100">
                  {attendances.map(a => {
                    const isAbsent = a.status === 'absent'
                    return (
                      <div key={a.id} className="p-4 px-6 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full ${isAbsent ? 'bg-rose-500' : 'bg-amber-500'}`} />
                          <div>
                            <span className="font-semibold text-slate-800 text-sm capitalize">
                              {a.status === 'absent' ? 'Absence' : 'Retard'}
                            </span>
                            <p className="text-xs text-slate-400">
                              {new Date(a.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          {a.justified ? (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
                              Justifié
                            </span>
                          ) : (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                              Non justifié
                            </span>
                          )}
                          {a.reason && <p className="text-xs text-slate-500 mt-1 italic">{a.reason}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Onglet 4 : Finances & Paiements Réels */}
      {activeTab === 'paiements' && (
        <div className="pt-4 space-y-6">
          {schedules.length === 0 && payments.length === 0 ? (
            <EmptyState 
              title="Aucune donnée financière"
              description="Aucune échéance de frais scolaires ni aucun paiement n'a encore été rattaché à cet élève."
              actionLabel="Créer une échéance"
              onAction={() => router.push('/admin/finance/echeances')}
              icon={Banknote}
            />
          ) : (
            <div className="space-y-6">
              {/* Synthèse Financière */}
              {(() => {
                const totalAttendu = schedules.reduce((acc, s) => acc + Number(s.amount_due || 0), 0)
                const totalEncaisse = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0)
                const resteDu = Math.max(0, totalAttendu - totalEncaisse)

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Attendu</p>
                      <span className="text-2xl font-black text-slate-800">{totalAttendu.toLocaleString('fr-FR')} <span className="text-sm font-semibold text-slate-500">FCFA</span></span>
                    </div>

                    <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-100">
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Déjà Encaissé</p>
                      <span className="text-2xl font-black text-emerald-700">{totalEncaisse.toLocaleString('fr-FR')} <span className="text-sm font-semibold text-emerald-600">FCFA</span></span>
                    </div>

                    <div className={`rounded-2xl p-5 border ${
                      resteDu > 0 ? 'bg-amber-50/70 border-amber-100' : 'bg-emerald-50/70 border-emerald-100'
                    }`}>
                      <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                        resteDu > 0 ? 'text-amber-700' : 'text-emerald-700'
                      }`}>
                        Reste à payer
                      </p>
                      <span className={`text-2xl font-black ${
                        resteDu > 0 ? 'text-amber-700' : 'text-emerald-700'
                      }`}>
                        {resteDu.toLocaleString('fr-FR')} <span className="text-sm font-semibold">FCFA</span>
                      </span>
                    </div>
                  </div>
                )
              })()}

              {/* Échéancier */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800 text-sm flex justify-between items-center">
                  <span>Échéancier scolaire</span>
                  <Link href="/admin/finance/echeances" className="text-xs text-[var(--color-primary)] hover:underline font-semibold">
                    Gérer les échéances
                  </Link>
                </div>
                <div className="divide-y divide-slate-100">
                  {schedules.map(s => {
                    const isPaid = s.status === 'paye'
                    return (
                      <div key={s.id} className="p-4 px-6 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{s.label}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Échéance : {new Date(s.due_date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <span className="font-bold text-sm text-slate-800">{Number(s.amount_due).toLocaleString('fr-FR')} FCFA</span>
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isPaid ? 'Soldé' : 'En attente'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Historique des paiements */}
              {payments.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-800 text-sm">
                    Historique des reçus d'encaissement
                  </div>
                  <div className="divide-y divide-slate-100">
                    {payments.map(p => (
                      <div key={p.id} className="p-4 px-6 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <Receipt size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">
                              {p.schedule?.label || 'Paiement scolarité'}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(p.paid_at).toLocaleDateString('fr-FR')} • Reçu n° {p.receipt_number || p.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                        <span className="font-black text-emerald-600 text-sm">
                          +{Number(p.amount).toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b1c30]/40  transition-opacity p-4">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-lg rounded-xl shadow-lg border border-[var(--color-outline-variant)] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-outline-variant)] flex justify-between items-center bg-[var(--color-surface-bright)]">
              <h2 className="text-xl font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[var(--color-primary)]" />
                Modifier les informations
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] p-1 rounded-full hover:bg-[#dce9ff] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="flex flex-col max-h-[80vh]">
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                {editError && (
                  <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-3 rounded text-sm font-medium">
                    {editError}
                  </div>
                )}
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="birth_place">
                    Lieu de naissance
                  </label>
                  <input 
                    className="w-full px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all" 
                    id="birth_place" name="birth_place" 
                    placeholder="Ex: Lomé" 
                    defaultValue={student.birth_place || ''}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="gender">
                    Genre
                  </label>
                  <select 
                    className="w-full px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all" 
                    id="gender" name="gender" 
                    defaultValue={student.gender || ''}
                  >
                    <option value="">Sélectionner un genre</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="blood_group">
                    Groupe Sanguin
                  </label>
                  <select 
                    className="w-full px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all" 
                    id="blood_group" name="blood_group" 
                    defaultValue={student.blood_group || ''}
                  >
                    <option value="">Non renseigné</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="address">
                    Adresse Domicile
                  </label>
                  <textarea 
                    className="w-full px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all min-h-[100px] resize-y" 
                    id="address" name="address" 
                    placeholder="Adresse complète du domicile" 
                    defaultValue={student.address || ''}
                  ></textarea>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="parent_phone">
                    Téléphone du parent
                  </label>
                  <input 
                    type="tel"
                    className="w-full px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all" 
                    id="parent_phone" name="parent_phone" 
                    placeholder="Ex: +228 90 00 00 00" 
                    defaultValue={student.parent_phone || ''}
                  />
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] flex justify-end gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)} 
                  className="px-5 py-2.5 rounded-lg border border-[var(--color-outline)] text-[var(--color-on-surface)] font-semibold text-sm hover:bg-[#eff4ff] transition-colors" 
                  disabled={isPending}
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:opacity-90 transition-colors shadow-sm disabled:opacity-50" 
                  disabled={isPending}
                >
                  {isPending ? 'Mise à jour...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b1c30]/40  transition-opacity p-4">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-md rounded-xl shadow-lg border border-[var(--color-outline-variant)] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-outline-variant)] flex justify-between items-center bg-[var(--color-surface-bright)]">
              <h2 className="text-xl font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                <Mail className="w-5 h-5 text-[var(--color-primary)]" />
                Contacter le parent
              </h2>
              <button onClick={() => { setIsContactModalOpen(false); setActiveContactView('list'); }} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] p-1 rounded-full hover:bg-[#dce9ff] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {activeContactView === 'list' ? (
              <div className="p-6 space-y-4">
                <p className="text-sm text-[var(--color-on-surface-variant)]">
                  Sélectionnez un moyen de communication pour contacter le parent ou tuteur de <span className="font-semibold text-[var(--color-on-surface)]">{student.first_name}</span>.
                </p>
                
                <div className="grid grid-cols-1 gap-3 mt-4">
                  <button 
                    onClick={() => setActiveContactView('vocal')}
                    className="w-full flex items-center justify-between p-4 rounded-lg border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] hover:bg-[#eff4ff] transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#e6eeff] text-[var(--color-primary)] flex items-center justify-center group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                        <Mic className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-[var(--color-on-surface)] text-sm">Message Vocal</p>
                        <p className="text-xs text-[var(--color-on-surface-variant)]">Message vocal via l'application</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)]" />
                  </button>

                <button 
                  onClick={() => setActiveContactView('sms')}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] hover:bg-[#eff4ff] transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#e6eeff] text-[var(--color-primary)] flex items-center justify-center group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-[var(--color-on-surface)] text-sm">Envoyer un SMS</p>
                      <p className="text-xs text-[var(--color-on-surface-variant)]">Écrire un SMS via la plateforme</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)]" />
                </button>

                <a 
                  href={student.parent_phone ? `https://wa.me/${student.parent_phone.replace(/[^0-9]/g, '')}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => { if (!student.parent_phone) { e.preventDefault(); alert("Le numéro de téléphone du parent n'est pas encore renseigné. Veuillez l'ajouter dans les informations de l'élève."); } }}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-[var(--color-outline-variant)] hover:border-[#25D366] hover:bg-[#dcf8c6]/30 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#dcf8c6] text-[#25D366] flex items-center justify-center group-hover:bg-[#25D366] group-hover:text-white transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-[var(--color-on-surface)] text-sm">WhatsApp</p>
                      <p className="text-xs text-[var(--color-on-surface-variant)]">Ouvrir l'application WhatsApp</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--color-on-surface-variant)] group-hover:text-[#25D366]" />
                </a>

                <a 
                  href={student.parent_email ? `mailto:${student.parent_email}` : '#'}
                  onClick={(e) => { if (!student.parent_email) { e.preventDefault(); alert("L'email du parent n'est pas encore renseigné. Veuillez l'ajouter dans les informations de l'élève."); } }}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] hover:bg-[#eff4ff] transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#e6eeff] text-[var(--color-primary)] flex items-center justify-center group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-[var(--color-on-surface)] text-sm">Envoyer un Email</p>
                      <p className="text-xs text-[var(--color-on-surface-variant)]">Ouvrir votre boîte mail</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)]" />
                </a>
              </div>
              
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 leading-tight">
                  Ces options utiliseront les coordonnées renseignées par le parent une fois son compte activé (voir section <b>Contact Parent</b>).
                </p>
              </div>
            </div>
            ) : activeContactView === 'vocal' ? (
              <div className="p-6 space-y-4">
                <button 
                  onClick={() => setActiveContactView('list')}
                  className="flex items-center gap-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors text-sm font-semibold mb-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour aux options
                </button>
                <h3 className="font-semibold text-[var(--color-on-surface)]">Enregistrer un message vocal pour le parent de {student.first_name}</h3>
                
                <form onSubmit={handleVoiceMessageSubmit} className="flex flex-col gap-4">
                  <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-outline-variant)] rounded-xl flex flex-col gap-4">
                    <AudioRecorder onAudioReady={(url) => setAudioUrl(url)} />
                  </div>
                  <div className="flex justify-end gap-3 mt-2">
                    <button 
                      type="submit" 
                      disabled={isPending || !audioUrl}
                      className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {isPending ? 'Envoi en cours...' : 'Envoyer le message vocal'}
                    </button>
                  </div>
                </form>
              </div>
            ) : activeContactView === 'sms' ? (
              <div className="p-6 space-y-4">
                <button 
                  onClick={() => setActiveContactView('list')}
                  className="flex items-center gap-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors text-sm font-semibold mb-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour aux options
                </button>
                <h3 className="font-semibold text-[var(--color-on-surface)]">
                  Envoyer un SMS au parent de {student.first_name}
                </h3>
                
                <form onSubmit={(e) => handleTextSubmit(e, 'sms')} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <textarea 
                      name="message"
                      rows={4}
                      placeholder="Tapez votre message ici..."
                      className="w-full px-4 py-3 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-base focus:outline-none focus:border-[var(--color-primary)] focus:border-2 transition-all resize-y"
                    ></textarea>
                    <p className="text-xs text-[var(--color-on-surface-variant)]">
                      Ce message sera envoyé directement sur le téléphone du parent si ses coordonnées sont enregistrées.
                    </p>
                  </div>
                  <div className="flex justify-end gap-3 mt-2">
                    <button 
                      type="submit" 
                      disabled={isPending}
                      className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {isPending ? 'Envoi en cours...' : 'Envoyer le SMS'}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal de Confirmation de Suppression */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Supprimer la fiche élève
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Vous êtes sur le point de supprimer le dossier de <strong className="text-gray-900">{student.first_name} {student.last_name}</strong> (Matricule : <span className="font-mono font-semibold">{student.matricule}</span>).
              </p>

              <div className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs text-gray-700">
                <p>
                  <strong>• Option 1 (Suppression définitive) :</strong> Recommandé si l'élève a quitté l'école (déménagement, changement d'établissement). Supprime définitivement son dossier et toutes ses données associées (notes, présences, etc.).
                </p>
                {student.classes?.name && (
                  <p>
                    <strong>• Option 2 (Retirer de la classe) :</strong> Retire l'élève de la classe <strong>{student.classes.name}</strong> sans supprimer son compte ni son historique.
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded-lg transition-colors order-3 sm:order-1"
              >
                Annuler
              </button>
              {student.classes?.name && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleStudentUnassign}
                  className="px-4 py-2 text-sm font-semibold text-gray-800 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors order-2"
                >
                  {isPending ? 'En cours...' : 'Retirer de la classe'}
                </button>
              )}
              <button
                type="button"
                disabled={isPending}
                onClick={handleStudentDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 order-1 sm:order-3"
              >
                <Trash2 className="w-4 h-4" />
                {isPending ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
