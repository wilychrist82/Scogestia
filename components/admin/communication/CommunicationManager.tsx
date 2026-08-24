'use client'

import { useState, useTransition, FormEvent } from 'react'
import Link from 'next/link'
import { sendCommunication } from '@/app/actions/communication'

type ClassItem = { id: string; name: string }
type ParentItem = { user_id: string; full_name: string }

type Props = {
  classes: ClassItem[]
  parents: ParentItem[]
}

export function CommunicationManager({ classes, parents }: Props) {
  const [recipientType, setRecipientType] = useState('all') // all, class, parent
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedParent, setSelectedParent] = useState('')
  
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSuccess(false)
    setError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.append('recipientType', recipientType)
    if (recipientType === 'class') formData.append('selectedClass', selectedClass)
    if (recipientType === 'parent') formData.append('selectedParent', selectedParent)
    
    startTransition(async () => {
      const result = await sendCommunication(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        form.reset()
      }
    })
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1280px] mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Communication</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Centre de Communication</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">Envoyez des messages, SMS et notifications aux parents d'élèves.</p>
          </div>
        </div>

        {error && (
          <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-4 rounded-xl border border-[var(--color-status-retard-text)] text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {error}
          </div>
        )}

        {success && (
          <div className="bg-[#e6f4ea] text-[#1e8e3e] p-4 rounded-xl border border-[#ceead6] text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            Message envoyé avec succès.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Nouveau Message Form */}
          <div className="lg:col-span-2 bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)]">
              <h3 className="font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-primary)]">send</span>
                Nouveau Message
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">Destinataires</label>
                <select 
                  value={recipientType}
                  onChange={(e) => setRecipientType(e.target.value)}
                  className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                >
                  <option value="all">Tous les parents</option>
                  <option value="class">Une classe spécifique</option>
                  <option value="parent">Un parent précis</option>
                </select>
              </div>

              {recipientType === 'class' && (
                <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]">Sélectionnez la classe</label>
                  <select 
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                    required
                  >
                    <option value="">Sélectionner...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {recipientType === 'parent' && (
                <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]">Rechercher un parent</label>
                  <select 
                    value={selectedParent}
                    onChange={(e) => setSelectedParent(e.target.value)}
                    className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                    required
                  >
                    <option value="">Sélectionner...</option>
                    {parents.map(p => <option key={p.user_id} value={p.user_id}>{p.full_name}</option>)}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">Objet</label>
                <input 
                  type="text" 
                  name="subject"
                  placeholder="Objet du message..." 
                  className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">Message</label>
                <textarea 
                  name="message"
                  placeholder="Rédigez votre message ici..." 
                  className="w-full p-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] min-h-[150px]"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                  {isPending ? 'Envoi en cours...' : 'Envoyer le message'}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar Info/Historique Rapide */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)]">
              <h3 className="font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)]">history</span>
                Historique Récent
              </h3>
            </div>
            <div className="p-6 flex flex-col gap-4 flex-1">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">mark_email_read</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[var(--color-on-surface)]">Réunion Parents-Professeurs</h4>
                  <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">Envoyé à Tous les parents • Il y a 2 jours</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-[#fce8e6] text-[#d93025] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">notification_important</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[var(--color-on-surface)]">Fermeture de l'école (Férié)</h4>
                  <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">Envoyé à Tous les parents • Il y a 1 semaine</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e6f4ea] text-[#1e8e3e] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[var(--color-on-surface)]">Rappel de paiement</h4>
                  <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">Envoyé à Classe 3ème A • Il y a 2 semaines</p>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-[var(--color-outline-variant)]">
                <button className="w-full text-center text-sm font-semibold text-[var(--color-primary)] hover:underline">
                  Voir tout l'historique
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
