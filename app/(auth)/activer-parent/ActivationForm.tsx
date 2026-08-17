'use client'

import { useState, useTransition, useRef, KeyboardEvent } from 'react'
import { activateParentAccount } from '@/app/actions/invitations'
import { useRouter } from 'next/navigation'

export function ActivationForm() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'phone' | 'email'>('phone')
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [password, setPassword] = useState('')
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
      setError("Veuillez saisir le code d'activation à 6 caractères.")
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
        <div className="w-24 h-24 bg-[var(--color-primary-container)] rounded-xl flex items-center justify-center text-[var(--color-on-primary-container)] mb-2">
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">Activer mon compte</h1>
        <p className="text-[var(--color-on-surface-variant)] text-base">Saisissez votre code d'activation et créez votre mot de passe pour accéder à votre espace parent.</p>
      </div>

      {error && (
        <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-3 rounded-md text-sm text-center border border-[var(--color-status-retard-text)]/20">
          {error}
        </div>
      )}

      {/* Activation Method Tabs */}
      <div className="w-full flex rounded-lg p-1 bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]" role="tablist">
        <button 
          onClick={() => { setActiveTab('phone'); setIdentifier(''); setError(null); }}
          className={`flex-1 py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-all ${
            activeTab === 'phone' 
              ? 'bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm ring-1 ring-[var(--color-outline-variant)]' 
              : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">smartphone</span>
          Téléphone
        </button>
        <button 
          onClick={() => { setActiveTab('email'); setIdentifier(''); setError(null); }}
          className={`flex-1 py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-all ${
            activeTab === 'email' 
              ? 'bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm ring-1 ring-[var(--color-outline-variant)]' 
              : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">mail</span>
          Email
        </button>
      </div>

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Contact Input */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="contact-input">
            {activeTab === 'phone' ? 'Numéro de téléphone' : 'Adresse Email'}
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-[var(--color-on-surface-variant)]">
              {activeTab === 'phone' ? 'call' : 'mail'}
            </span>
            <input 
              id="contact-input" 
              type={activeTab === 'phone' ? 'tel' : 'email'}
              placeholder={activeTab === 'phone' ? '+225 00 00 00 00 00' : 'parent@exemple.com'}
              required 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full h-12 pl-10 pr-3 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary-container)] focus:border-[var(--color-primary-container)] text-base outline-none transition-all"
            />
          </div>
        </div>

        {/* Password Input (Added for signup) */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="password-input">
            Créer un mot de passe
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-[var(--color-on-surface-variant)]">lock</span>
            <input 
              id="password-input" 
              type="password"
              placeholder="••••••••"
              required 
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 pl-10 pr-3 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary-container)] focus:border-[var(--color-primary-container)] text-base outline-none transition-all"
            />
          </div>
          <span className="text-xs text-[var(--color-on-surface-variant)] ml-1">Au moins 6 caractères</span>
        </div>

        {/* OTP Input */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-[var(--color-on-surface)]">Code d'activation (6 caractères)</label>
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
                className="w-full h-12 md:h-14 text-center text-xl font-semibold rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] focus:ring-2 focus:ring-[var(--color-primary-container)] focus:border-[var(--color-primary-container)] outline-none uppercase transition-all"
              />
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button 
          type="submit" 
          disabled={isPending}
          className="w-full h-12 bg-[var(--color-primary-container)] text-white font-semibold text-base rounded-lg hover:bg-[var(--color-primary)] focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary-container)] transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
        >
          {isPending ? 'Activation...' : 'Activer mon accès'}
          <span className="material-symbols-outlined text-[20px]">{isPending ? 'hourglass_empty' : 'arrow_forward'}</span>
        </button>
      </form>

      <div className="text-center mt-2">
        <a href="#" className="text-xs font-medium text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[16px]">help</span>
          Besoin d'aide ?
        </a>
      </div>
    </main>
  )
}
