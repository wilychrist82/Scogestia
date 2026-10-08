'use client'

import { useState, useTransition, useRef } from 'react'
import { linkChildWithCode } from '@/app/actions/invitations'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { X, UserPlus, Loader2, Sparkles, CheckCircle2, ClipboardPaste, AlertCircle } from 'lucide-react'

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
  const inputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setCode(val)
    if (error) setError(null)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const val = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
      if (val) {
        setCode(val)
        if (error) setError(null)
        toast.success(`Code ${val} collé !`, { duration: 2000 })
      }
    } catch {
      toast.error('Impossible de lire le presse-papier. Tapez le code directement.')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = code.trim().toUpperCase()
    if (cleanCode.length !== 6) {
      setError("Le code d'activation doit comporter exactement 6 caractères.")
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await linkChildWithCode(cleanCode)
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      style={{ color: '#0f172a' }}
    >
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 text-slate-900"
        style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
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
          <h2 className="text-xl font-black tracking-tight text-white">Lier un autre enfant</h2>
          <p className="text-xs text-white/80 mt-1 max-w-xs mx-auto">
            Ajoutez un nouvel élève à votre compte avec son code d'invitation à 6 caractères
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-slate-900" style={{ color: '#0f172a' }}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Code d'activation (6 caractères)
              </label>
              <button
                type="button"
                onClick={handlePaste}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded transition-colors border border-emerald-200"
              >
                <ClipboardPaste size={12} />
                <span>Coller</span>
              </button>
            </div>

            {/* Champ de saisie principal */}
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="EX: Y2C9CK"
                autoFocus
                maxLength={6}
                style={{
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  caretColor: '#059669',
                }}
                className="w-full text-center text-3xl font-black font-mono tracking-[0.35em] uppercase py-3.5 px-4 rounded-xl border-2 border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 outline-none transition-all placeholder:text-slate-300 placeholder:tracking-normal text-slate-900 bg-white shadow-inner"
              />
              {code.length === 6 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
                  <CheckCircle2 size={24} />
                </div>
              )}
            </div>

            {/* 6 Boîtes visuelles de prévisualisation des caractères */}
            <div 
              className="flex justify-center gap-2 mt-3 cursor-pointer"
              onClick={() => inputRef.current?.focus()}
            >
              {Array.from({ length: 6 }).map((_, i) => {
                const char = code[i] || ''
                return (
                  <div 
                    key={i}
                    className={`w-10 h-12 rounded-lg border-2 flex items-center justify-center text-xl font-black font-mono transition-all ${
                      char 
                        ? 'border-emerald-600 bg-emerald-50 text-slate-900 shadow-xs' 
                        : 'border-slate-200 bg-slate-50 text-slate-300'
                    }`}
                    style={{ color: char ? '#0f172a' : '#cbd5e1' }}
                  >
                    {char || '·'}
                  </div>
                )
              })}
            </div>

            <p className="text-[11px] text-slate-500 mt-2 text-center">
              💡 Code visible sur la fiche de l'élève (section <em>Invitation Parent</em>).
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
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
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span className="text-white">Vérification...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} className="text-white" />
                  <span className="text-white">Lier l'élève</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
