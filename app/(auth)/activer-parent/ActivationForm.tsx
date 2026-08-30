'use client'

import { useState, useTransition, useRef, KeyboardEvent, useEffect } from 'react'
import { activateParentAccount } from '@/app/actions/invitations'
import { useRouter } from 'next/navigation'

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
    <main className="w-full max-w-md bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-xl p-4 md:p-8 shadow-sm flex flex-col gap-6">
      {/* Header & Logo */}
      <div className="flex flex-col items-center text-center gap-2">
        <div className="w-20 h-20 bg-[var(--color-primary-container)] rounded-xl flex items-center justify-center text-[var(--color-on-primary-container)] mb-2">
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">Activer mon compte</h1>
        <p className="text-[var(--color-on-surface-variant)] text-sm">Créez votre accès parent avec votre numéro de téléphone pour suivre la scolarité de votre enfant.</p>
      </div>

      {error && (
        <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-3 rounded-md text-sm text-center border border-[var(--color-status-retard-text)]/20 font-medium">
          {error}
        </div>
      )}

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
        
        {/* Contact Input (Phone only) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="phone-input">
            Numéro de téléphone
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-[var(--color-on-surface-variant)]">
              call
            </span>
            <input 
              id="phone-input" 
              type="tel"
              placeholder="+228 90 00 00 00"
              required 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full h-12 pl-10 pr-3 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary-container)] focus:border-[var(--color-primary-container)] text-base outline-none transition-all font-medium"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="password-input">
            Créer un mot de passe
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-[var(--color-on-surface-variant)]">lock</span>
            <input 
              id="password-input" 
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required 
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 pl-10 pr-10 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary-container)] focus:border-[var(--color-primary-container)] text-base outline-none transition-all font-medium"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors p-1"
            >
              <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
          <span className="text-xs text-[var(--color-on-surface-variant)]">Ce mot de passe vous servira pour vos prochaines connexions. (Min 6 caractères)</span>
        </div>

        {/* OTP Input */}
        <div className="flex flex-col gap-1.5 mt-2">
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
                className="w-full h-12 md:h-14 text-center text-xl font-bold rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-container)] focus:border-[var(--color-primary-container)] outline-none uppercase transition-all shadow-sm"
              />
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button 
          type="submit" 
          disabled={isPending}
          className="w-full h-12 bg-[var(--color-primary)] text-white font-semibold text-base rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 shadow-md"
        >
          {isPending ? 'Activation en cours...' : 'Activer mon accès'}
          {!isPending && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
        </button>
      </form>
    </main>
  )
}
