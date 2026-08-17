'use client'

import { useState } from 'react'

type Props = {
  dueId: string
  label: string
  amount: number
}

export function PaymentForm({ dueId, label, amount }: Props) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>('tmoney')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Veuillez sélectionner un moyen de paiement.')
      return
    }

    setIsPending(true)
    setError(null)

    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          due_id: dueId,
          payment_method: selectedMethod
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Une erreur est survenue lors de l\'initialisation du paiement.')
      }

      if (data.payment_url) {
        // Rediriger vers CinetPay
        window.location.href = data.payment_url
      }
    } catch (err: any) {
      setError(err.message)
      setIsPending(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col gap-6 md:p-8">
      {/* Summary Card */}
      <section className="bg-white border border-[var(--color-outline-variant)] rounded-xl p-4 md:p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-2">Récapitulatif</h2>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-2xl text-[var(--color-on-surface)] font-semibold">{label}</p>
          </div>
          <div className="text-right flex items-baseline gap-1">
            <p className="text-3xl text-[var(--color-primary)] font-bold">{amount.toLocaleString('fr-FR')}</p>
            <p className="text-sm text-[var(--color-on-surface-variant)] font-medium">FCFA</p>
          </div>
        </div>
      </section>

      {error && (
        <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-4 rounded-lg text-sm border border-[var(--color-status-retard-text)]/20">
          {error}
        </div>
      )}

      {/* Payment Methods */}
      <section className="flex-1 flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-2">Moyen de paiement</h2>
        <div className="grid grid-cols-1 gap-3">
          
          {/* T-Money */}
          <label className="relative cursor-pointer">
            <input 
              type="radio" 
              name="payment_method" 
              value="tmoney" 
              checked={selectedMethod === 'tmoney'}
              onChange={() => setSelectedMethod('tmoney')}
              className="peer sr-only" 
            />
            <div className={`flex items-center justify-between p-4 bg-white border rounded-xl transition-all duration-200 ${selectedMethod === 'tmoney' ? 'border-[var(--color-primary)] bg-[#eff4ff]' : 'border-[var(--color-outline-variant)]'}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#FFD700] rounded-lg flex items-center justify-center font-bold text-black border border-[var(--color-outline-variant)]/30">
                  T
                </div>
                <span className="text-xl text-[var(--color-on-surface)] font-medium">T-Money</span>
              </div>
              {selectedMethod === 'tmoney' && (
                <span className="material-symbols-outlined text-[var(--color-primary)]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              )}
            </div>
          </label>

          {/* Flooz */}
          <label className="relative cursor-pointer">
            <input 
              type="radio" 
              name="payment_method" 
              value="flooz" 
              checked={selectedMethod === 'flooz'}
              onChange={() => setSelectedMethod('flooz')}
              className="peer sr-only" 
            />
            <div className={`flex items-center justify-between p-4 bg-white border rounded-xl transition-all duration-200 ${selectedMethod === 'flooz' ? 'border-[var(--color-primary)] bg-[#eff4ff]' : 'border-[var(--color-outline-variant)]'}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#0089C4] rounded-lg flex items-center justify-center font-bold text-white border border-[var(--color-outline-variant)]/30">
                  F
                </div>
                <span className="text-xl text-[var(--color-on-surface)] font-medium">Flooz</span>
              </div>
              {selectedMethod === 'flooz' && (
                <span className="material-symbols-outlined text-[var(--color-primary)]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              )}
            </div>
          </label>

          {/* Wave */}
          <label className="relative cursor-pointer">
            <input 
              type="radio" 
              name="payment_method" 
              value="wave" 
              checked={selectedMethod === 'wave'}
              onChange={() => setSelectedMethod('wave')}
              className="peer sr-only" 
            />
            <div className={`flex items-center justify-between p-4 bg-white border rounded-xl transition-all duration-200 ${selectedMethod === 'wave' ? 'border-[var(--color-primary)] bg-[#eff4ff]' : 'border-[var(--color-outline-variant)]'}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#1C82FF] rounded-lg flex items-center justify-center font-bold text-white border border-[var(--color-outline-variant)]/30">
                  W
                </div>
                <span className="text-xl text-[var(--color-on-surface)] font-medium">Wave</span>
              </div>
              {selectedMethod === 'wave' && (
                <span className="material-symbols-outlined text-[var(--color-primary)]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              )}
            </div>
          </label>

          {/* Orange Money */}
          <label className="relative cursor-pointer">
            <input 
              type="radio" 
              name="payment_method" 
              value="orange" 
              checked={selectedMethod === 'orange'}
              onChange={() => setSelectedMethod('orange')}
              className="peer sr-only" 
            />
            <div className={`flex items-center justify-between p-4 bg-white border rounded-xl transition-all duration-200 ${selectedMethod === 'orange' ? 'border-[var(--color-primary)] bg-[#eff4ff]' : 'border-[var(--color-outline-variant)]'}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#FF7900] rounded-lg flex items-center justify-center font-bold text-white border border-[var(--color-outline-variant)]/30">
                  O
                </div>
                <span className="text-xl text-[var(--color-on-surface)] font-medium">Orange Money</span>
              </div>
              {selectedMethod === 'orange' && (
                <span className="material-symbols-outlined text-[var(--color-primary)]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              )}
            </div>
          </label>

          {/* MTN MoMo */}
          <label className="relative cursor-pointer">
            <input 
              type="radio" 
              name="payment_method" 
              value="momo" 
              checked={selectedMethod === 'momo'}
              onChange={() => setSelectedMethod('momo')}
              className="peer sr-only" 
            />
            <div className={`flex items-center justify-between p-4 bg-white border rounded-xl transition-all duration-200 ${selectedMethod === 'momo' ? 'border-[var(--color-primary)] bg-[#eff4ff]' : 'border-[var(--color-outline-variant)]'}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#FFCC00] rounded-lg flex items-center justify-center font-bold text-black border border-[var(--color-outline-variant)]/30">
                  M
                </div>
                <span className="text-xl text-[var(--color-on-surface)] font-medium">MTN MoMo</span>
              </div>
              {selectedMethod === 'momo' && (
                <span className="material-symbols-outlined text-[var(--color-primary)]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              )}
            </div>
          </label>
        </div>
      </section>

      {/* Action Button */}
      <div className="mt-8">
        <button 
          onClick={handlePayment}
          disabled={isPending || !selectedMethod}
          className="w-full h-12 min-h-[48px] bg-[var(--color-primary)] text-white text-xl font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--color-primary-container)] transition-colors active:scale-95 disabled:opacity-50"
        >
          <span className="material-symbols-outlined">{isPending ? 'hourglass_empty' : 'lock'}</span>
          {isPending ? 'Redirection...' : 'Confirmer le paiement'}
        </button>
        <p className="text-center text-xs text-[var(--color-on-surface-variant)] mt-3 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[14px]">shield</span>
          Paiement sécurisé et crypté
        </p>
      </div>
    </div>
  )
}
