'use client'

import { useState } from 'react'
import { ChariowProduct } from '@/lib/chariow/api'
import { parsePhoneNumberFromString } from 'libphonenumber-js'

type Props = {
  plan: ChariowProduct
  onClose: () => void
}

export function ChariowCheckout({ plan, onClose }: Props) {
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('TG') // Défaut Togo par exemple
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Validation basique côté client
    const parsed = parsePhoneNumberFromString(phone, country as any)
    if (!parsed || !parsed.isValid()) {
      setError("Numéro de téléphone invalide pour le pays sélectionné.")
      setIsLoading(false)
      return
    }

    try {
      // 1. Envoyer la requête au backend pour générer le lien de paiement
      const res = await fetch('/api/chariow/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: plan.id,
          phone: parsed.number, // E.164
          phoneCountry: country,
          plan_name: plan.name,
          amount: plan.price
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'initialisation du paiement.')
      }

      if (data.checkout_url) {
        // 2. Rediriger l'utilisateur vers Chariow
        window.location.href = data.checkout_url
      } else {
        throw new Error('URL de paiement introuvable dans la réponse.')
      }

    } catch (err: any) {
      console.error(err)
      setError(err.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 ">
      <div className="bg-[var(--color-surface)] w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 bg-[var(--color-surface-container-lowest)] border-b border-[var(--color-outline-variant)] flex justify-between items-start">
          <div>
            <h3 className="font-bold text-xl text-[var(--color-on-surface)]">Finaliser l'abonnement</h3>
            <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">Plan {plan.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full text-[var(--color-on-surface-variant)] transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Amount Summary */}
        <div className="bg-[var(--color-primary)] text-white p-6 flex flex-col items-center justify-center">
          <span className="text-sm opacity-80 uppercase tracking-wider font-semibold mb-1">Montant à payer</span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black">
              {plan.price != null && plan.price > 0 
                ? Number(plan.price).toLocaleString('fr-FR') 
                : (plan.name?.toLowerCase().includes('pro') ? '9 900' : '7 000')}
            </span>
            <span className="font-medium">{plan.currency || 'FCFA'}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleCheckout} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] rounded-lg text-sm font-medium border border-[var(--color-status-retard-bg)]">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--color-on-surface)]">
              Numéro Mobile Money (ou Carte)
            </label>
            <div className="flex gap-2">
              <select 
                value={country} 
                onChange={(e) => setCountry(e.target.value)}
                className="w-32 h-12 px-2 border border-[var(--color-outline-variant)] rounded-lg bg-[var(--color-surface)] text-[var(--color-on-surface)] focus:border-[var(--color-primary)] outline-none font-medium"
              >
                {/* Liste des pays principaux pris en charge avec drapeaux et indicatifs */}
                <option value="TG">🇹🇬 +228</option>
                <option value="CI">🇨🇮 +225</option>
                <option value="SN">🇸🇳 +221</option>
                <option value="BJ">🇧🇯 +229</option>
                <option value="ML">🇲🇱 +223</option>
                <option value="BF">🇧🇫 +226</option>
                <option value="CM">🇨🇲 +237</option>
                <option value="FR">🇫🇷 +33</option>
              </select>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Numéro sans indicatif"
                className="flex-1 h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg bg-[var(--color-surface)] text-[var(--color-on-surface)] focus:border-[var(--color-primary)] outline-none"
                required
              />
            </div>
            <p className="text-xs text-[var(--color-on-surface-variant)]">
              Saisissez le numéro tel qu'il est composé localement.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-12 flex items-center justify-center gap-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                Génération du lien...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">lock</span>
                Payer {plan.price != null && plan.price > 0 ? Number(plan.price).toLocaleString('fr-FR') : (plan.name?.toLowerCase().includes('pro') ? '9 900' : '7 000')} {plan.currency || 'FCFA'}
              </>
            )}
          </button>
        </form>
        
      </div>
    </div>
  )
}
