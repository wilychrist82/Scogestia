'use client'

import { useTransition, useState } from 'react'
import { sendCommunication } from '@/app/actions/communication'
import { WhatsAppInputBar } from '@/components/ui/WhatsAppInputBar'
import toast from 'react-hot-toast'

export function ParentMessageForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSend = (payload: { text: string; audioUrl: string | null; fileUrl?: string | null; fileType?: string | null }) => {
    setError(null)
    const formData = new FormData()
    formData.append('recipientType', 'admin')
    formData.append('subject', 'Message parent')
    formData.append('message', payload.text || 'Message vocal')
    
    if (payload.audioUrl) {
      formData.append('audioUrl', payload.audioUrl)
    }
    if (payload.fileUrl) {
      formData.append('fileUrl', payload.fileUrl)
    }
    if (payload.fileType) {
      formData.append('fileType', payload.fileType)
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
      }
    })
  }

  return (
    <div className="bg-[#f0f2f5] border-t border-[var(--color-outline-variant)]">
      {error && (
        <div className="px-4 py-2 text-xs font-medium text-red-700 bg-red-50 border-b border-red-100">
          {error}
        </div>
      )}
      <WhatsAppInputBar onSend={handleSend} isPending={isPending} placeholder="Message" />
    </div>
  )
}
