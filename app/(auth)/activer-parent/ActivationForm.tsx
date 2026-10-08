'use client'

import { useState, useTransition, useRef, KeyboardEvent } from 'react'
import { activateParentAccount } from '@/app/actions/invitations'
import { useRouter } from 'next/navigation'
import { BookOpen, Phone, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react'

export function ActivationForm({ initialCode = '' }: { initialCode?: string }) {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  
  // Initialize OTP array from the initialCode string
  const defaultOtp = Array(6).fill('')
  const cleanCode = initialCode.slice(0, 6).toUpperCase()
  for (let i = 0; i < cleanCode.length; i++) {
    defaultOtp[i] = cleanCode[i]
  }
  
  const [otp, setOtp] = useState<string[]>(defaultOtp)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedValue = value.slice(0, 6).split('')
      const newOtp = [...otp]
      for (let i = 0; i < pastedValue.length; i++) {
        if (index + i < 6) {
          newOtp[index + i] = pastedValue[i]
        }
      }
      setOtp(newOtp)
      // Focus the last filled input
      const nextIndex = Math.min(index + pastedValue.length, 5)
      otpRefs.current[nextIndex]?.focus()
      return
    }

    const newOtp = [...otp]
    newOtp[index] = value.toUpperCase()
    setOtp(newOtp)

    // Move to next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    const code = otp.join('')
    if (code.length !== 6) {
      setError("Veuillez saisir le code d'activation complet à 6 caractères.")
      return
    }

    if (!identifier || identifier.length < 8) {
      setError("Veuillez entrer un numéro de téléphone valide.")
      return
    }

    if (!password || password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.")
      return
    }

    const formData = new FormData()
    formData.append('identifier', identifier)
    formData.append('code', code)
    formData.append('password', password)

    startTransition(async () => {
      const result = await activateParentAccount(null, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/parent') // Redirection vers l'espace parent après succès
      }
    })
  }

  return (
    <main className="w-full max-w-md bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
      {/* Header & Logo */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-16 h-16 bg-blue-50 text-[var(--color-primary)] rounded-2xl flex items-center justify-center mb-2 shadow-sm border border-blue-100">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-on-surface)]">Activer mon compte</h1>
        <p className="text-[var(--color-on-surface-variant)] text-sm">Créez votre accès parent avec votre numéro de téléphone pour suivre la scolarité de votre enfant.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 text-red-700 p-3.5 rounded-xl text-sm border border-red-200 font-medium animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* Contact Input (Phone only) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="phone-input">
            Numéro de téléphone
          </label>
          <div className="relative flex items-center">
            <Phone className="w-4 h-4 absolute left-3.5 text-slate-400" />
            <input 
              id="phone-input" 
              type="tel"
              placeholder="+228 90 00 00 00"
              required 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-[var(--color-primary)] text-sm outline-none transition-all font-medium placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="password-input">
            Créer un mot de passe
          </label>
          <div className="relative flex items-center">
            <Lock className="w-4 h-4 absolute left-3.5 text-slate-400" />
            <input 
              id="password-input" 
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required 
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-[var(--color-primary)] text-sm outline-none transition-all font-medium placeholder:text-slate-400"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors p-1"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <span className="text-xs text-[var(--color-on-surface-variant)]">Ce mot de passe vous servira pour vos prochaines connexions (min 6 caractères).</span>
        </div>

        {/* OTP Input */}
        <div className="flex flex-col gap-1.5 mt-1">
          <label className="text-sm font-semibold text-[var(--color-on-surface)]">
            Code d'activation de l'école
          </label>
          <div className="flex justify-between gap-2 otp-input-group mt-1">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { otpRefs.current[index] = el }}
                type="text"
                maxLength={6} // allow pasting multiple
                required
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className="w-full h-12 md:h-13 text-center text-lg font-bold rounded-xl border border-slate-200 bg-white text-[var(--color-primary)] focus:ring-2 focus:ring-blue-100 focus:border-[var(--color-primary)] outline-none uppercase transition-all shadow-sm"
              />
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button 
          type="submit" 
          disabled={isPending}
          className="w-full h-11 bg-[var(--color-primary)] text-white font-semibold text-sm rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 shadow-sm"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Activation en cours...</span>
            </>
          ) : (
            <>
              <span>Activer mon accès</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </main>
  )
}
