'use client'

import { useTransition, useState } from 'react'
import { sendCommunication } from '@/app/actions/communication'
import { WhatsAppInputBar } from '@/components/ui/WhatsAppInputBar'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

type Teacher = {
  id: string
  full_name: string
}

type Props = {
  teachers?: Teacher[]
}

export function ParentMessageForm({ teachers = [] }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [recipientType, setRecipientType] = useState<'admin' | 'enseignant'>('admin')
  const [selectedTeacher, setSelectedTeacher] = useState('')

  const handleSend = (payload: { text: string; audioUrl: string | null; fileUrl?: string | null; fileType?: string | null }) => {
    setError(null)

    if (recipientType === 'enseignant' && !selectedTeacher) {
      toast.error("Veuillez sélectionner un enseignant avant d'envoyer.", { position: 'top-center' })
      return
    }

    const formData = new FormData()
    formData.append('recipientType', recipientType)
    formData.append('subject', recipientType === 'admin' ? 'Message parent' : 'Message parent → enseignant')
    formData.append('message', payload.text || 'Message vocal')

    if (recipientType === 'enseignant' && selectedTeacher) {
      formData.append('selectedEnseignant', selectedTeacher)
    }
    if (payload.audioUrl) {
      formData.append('audioUrl', payload.audioUrl)
    }
    if (payload.fileUrl) {
      formData.append('fileUrl', payload.fileUrl)
    }
    if (payload.fileType) {
      formData.append('fileType', payload.fileType)
    }
    if ((payload as any).originalFileName) {
      formData.append('originalFileName', (payload as any).originalFileName)
    }

    startTransition(async () => {
      const result = await sendCommunication(formData)
      if (result.error) {
        setError(result.error)
        toast.error(result.error, { duration: 4000, position: 'top-center' })
      } else {
        toast.success('✅ Message envoyé !', {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#1e8e3e', color: '#fff',
            fontWeight: '600', fontSize: '14px',
            borderRadius: '12px', padding: '12px 16px',
          },
        })
        // Recharger pour afficher le message dans l'historique
        router.refresh()
      }
    })
  }

  return (
    <div className="bg-[var(--color-surface)] border-t border-[var(--color-outline-variant)]">

      {/* Sélecteur de destinataire */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <span className="text-xs font-semibold text-[var(--color-on-surface-variant)] shrink-0">Envoyer à :</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setRecipientType('admin'); setSelectedTeacher('') }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              recipientType === 'admin'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
            Admin
          </button>
          {teachers.length > 0 && (
            <button
              type="button"
              onClick={() => setRecipientType('enseignant')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                recipientType === 'enseignant'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">school</span>
              Enseignant
            </button>
          )}
        </div>
      </div>

      {/* Sélecteur d'enseignant (affiché uniquement si recipientType = enseignant) */}
      {recipientType === 'enseignant' && teachers.length > 0 && (
        <div className="px-4 pt-1 pb-1">
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="w-full text-sm border border-[var(--color-outline-variant)] rounded-lg px-3 py-2 bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)] transition-colors"
          >
            <option value="">— Sélectionner un enseignant —</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="px-4 py-2 text-xs font-medium text-red-700 bg-red-50 border-b border-red-100">
          {error}
        </div>
      )}

      <div className="bg-[#f0f2f5]">
        <WhatsAppInputBar
          onSend={handleSend}
          isPending={isPending}
          placeholder={
            recipientType === 'admin'
              ? 'Message à l\'administration...'
              : selectedTeacher
                ? 'Message à l\'enseignant...'
                : "Sélectionnez un enseignant d'abord"
          }
        />
      </div>
    </div>
  )
}
