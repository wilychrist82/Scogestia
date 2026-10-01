'use client'

import { useState, useTransition } from 'react'
import { linkChildWithCode } from '@/app/actions/invitations'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { X, UserPlus, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'

type Props = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (studentId: string) => void
}

export function LinkChildModal({ isOpen, onClose, onSuccess }: Props) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!isOpen) return null

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setCode(val)
    if (error) setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) {
      setError("Le code d'activation doit comporter 6 caractères.")
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await linkChildWithCode(code)
      if (result.error) {
        setError(result.error)
        toast.error(result.error)
      } else {
        toast.success(`🎉 ${result.studentName} a été lié à votre compte avec succès !`, {
          duration: 5000,
        })
        setCode('')
        onClose()
        if (result.studentId && onSuccess) {
          onSuccess(result.studentId)
        }
        router.refresh()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[var(--color-primary)] to-[#004230] p-6 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
          
          <div className="w-14 h-14 mx-auto mb-3 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner">
            <UserPlus size={26} className="text-emerald-300" />
          </div>
          <h2 className="text-xl font-black tracking-tight">Lier un autre enfant</h2>
          <p className="text-xs text-white/80 mt-1 max-w-xs mx-auto">
            Ajoutez un nouvel élève à votre compte avec son code d'invitation à 6 caractères
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Code d'activation (6 caractères)
            </label>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="EX: ABC123"
                autoFocus
                maxLength={6}
                className="w-full text-center text-2xl font-black tracking-[0.3em] uppercase py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 outline-none transition-all placeholder:text-gray-300 placeholder:tracking-normal"
              />
              {code.length === 6 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                  <CheckCircle2 size={22} />
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-2">
              💡 Ce code vous a été remis par l'administration ou sur la fiche d'inscription de l'élève.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-red-600">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending || code.length !== 6}
              className="flex-1 py-3 px-4 rounded-xl bg-[var(--color-primary)] hover:bg-[#004230] text-white font-bold text-sm shadow-lg shadow-[var(--color-primary)]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Vérification...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Lier l'élève</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
