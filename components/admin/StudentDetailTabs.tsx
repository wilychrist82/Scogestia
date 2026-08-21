'use client'

import { useState, useTransition } from 'react'
import { generateParentCode } from '@/app/actions/invitations'
import { EmptyState } from '@/components/ui/EmptyState'
import { FileEdit, CalendarDays, Banknote } from 'lucide-react'

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
  classes: {
    name: string
  } | null
}

type Props = {
  student: Student
}

export function StudentDetailTabs({ student }: Props) {
  const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'presences' | 'paiements'>('info')
  const [isPending, startTransition] = useTransition()
  const [invitationCode, setInvitationCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

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

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-lg bg-[#d5e0f8] flex items-center justify-center text-4xl font-bold text-[#0b1c30]">
            {student.first_name[0]}{student.last_name[0]}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-full p-1">
            <span className="w-4 h-4 rounded-full bg-[#10b981] block"></span>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">{student.first_name} {student.last_name}</h2>
              <p className="text-[var(--color-on-surface-variant)] mt-1">Matricule: #{student.matricule} • Classe: {student.classes?.name || 'Non assigné'}</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="h-12 px-4 rounded-lg border border-[var(--color-primary)] text-[var(--color-primary)] font-semibold text-sm hover:bg-[#eff4ff] transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Modifier
              </button>
              <button className="h-12 px-4 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:opacity-90 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">mail</span>
                Contacter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Navigation */}
      <div className="border-b border-[var(--color-outline-variant)] flex gap-8 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('info')}
          className={`px-2 py-4 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors ${activeTab === 'info' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'}`}
        >
          Informations
        </button>
        <button 
          onClick={() => setActiveTab('notes')}
          className={`px-2 py-4 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors ${activeTab === 'notes' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'}`}
        >
          Notes
        </button>
        <button 
          onClick={() => setActiveTab('presences')}
          className={`px-2 py-4 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors ${activeTab === 'presences' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'}`}
        >
          Présences
        </button>
        <button 
          onClick={() => setActiveTab('paiements')}
          className={`px-2 py-4 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors ${activeTab === 'paiements' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'}`}
        >
          Paiements
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          {/* Personal Info */}
          <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-6 lg:col-span-2 space-y-6">
            <h3 className="text-xl font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-primary)]">person</span>
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
              <div className="sm:col-span-2">
                <p className="text-sm text-[var(--color-on-surface-variant)] mb-1">Adresse Domicile</p>
                <p className="font-medium text-[var(--color-on-surface)]">{student.address || 'Non renseignée'}</p>
              </div>
            </div>
          </div>
          
          {/* Contact & Medical */}
          <div className="space-y-6">
            {/* Parent Contact */}
            <div className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-6">
              <h3 className="text-xl font-semibold text-[var(--color-on-surface)] flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[var(--color-primary)]">family_restroom</span>
                Contact Parent
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-[var(--color-on-surface-variant)]">Les informations de contact seront disponibles après l'activation du compte parent.</p>
                
                <div className="pt-4 border-t border-[var(--color-outline-variant)]/50">
                  <h4 className="text-sm font-semibold text-[var(--color-on-surface)] mb-2">Invitation Parent</h4>
                  {invitationCode ? (
                    <div className="bg-[#eff4ff] border border-[var(--color-outline-variant)] rounded-lg p-4">
                      <p className="text-sm text-[var(--color-on-surface-variant)] mb-2">Code d'activation à transmettre au parent :</p>
                      <div className="text-2xl font-mono font-bold text-[var(--color-primary)] tracking-widest bg-white p-3 rounded text-center shadow-sm">
                        {invitationCode}
                      </div>
                      <p className="text-xs text-[var(--color-on-surface-variant)] mt-2 text-center">Ce code expirera dans 7 jours.</p>
                    </div>
                  ) : (
                    <div>
                      {error && <p className="text-sm text-[var(--color-status-retard-text)] mb-2">{error}</p>}
                      <button 
                        onClick={handleGenerateCode}
                        disabled={isPending}
                        className="h-10 px-4 rounded-lg border border-[var(--color-primary)] text-[var(--color-primary)] font-semibold text-sm hover:bg-[#eff4ff] transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[18px]">{isPending ? 'hourglass_empty' : 'vpn_key'}</span>
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
                <span className="material-symbols-outlined text-[var(--color-status-retard-text)]">medical_information</span>
                Info Médicale
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-[var(--color-on-surface-variant)]">Aucune information médicale enregistrée.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="pt-4">
          <EmptyState 
            title="Module Notes (Bientôt disponible)"
            description="L'affichage détaillé des notes par matière, ainsi que les moyennes trimestrielles, seront intégrés lors de la prochaine phase."
            icon={FileEdit}
          />
        </div>
      )}

      {activeTab === 'presences' && (
        <div className="pt-4">
          <EmptyState 
            title="Module Présences (Bientôt disponible)"
            description="Le suivi journalier des présences, retards et justifications sera ajouté très prochainement."
            icon={CalendarDays}
          />
        </div>
      )}

      {activeTab === 'paiements' && (
        <div className="pt-4">
          <EmptyState 
            title="Module Paiements (Bientôt disponible)"
            description="L'historique des transactions, les reçus et les échéanciers pour cet élève apparaîtront ici."
            icon={Banknote}
          />
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/40 backdrop-blur-sm transition-opacity p-4">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-lg rounded-xl shadow-lg border border-[var(--color-outline-variant)] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-outline-variant)] flex justify-between items-center bg-[var(--color-surface-bright)]">
              <h2 className="text-xl font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)]">edit</span>
                Modifier les informations
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] p-1 rounded-full hover:bg-[#dce9ff] transition-colors">
                <span className="material-symbols-outlined">close</span>
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
    </div>
  )
}
