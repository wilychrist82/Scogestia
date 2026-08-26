'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function AbonnementSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const saleId = searchParams.get('sale_id')

  const [status, setStatus] = useState<'verifying' | 'success' | 'failed' | 'pending'>('verifying')
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    if (!saleId) {
      setStatus('failed')
      return
    }

    const verifyPayment = async () => {
      try {
        const res = await fetch('/api/chariow/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sale_id: saleId })
        })
        
        const data = await res.json()

        if (data.status === 'succeeded') {
          setStatus('success')
        } else {
          // Si c'est toujours en pending, on retry max 10 fois (toutes les 3s)
          if (attempts < 10) {
            setTimeout(() => {
              setAttempts(prev => prev + 1)
            }, 3000)
          } else {
            setStatus('pending') // Lent
          }
        }
      } catch (error) {
        console.error(error)
        setStatus('failed')
      }
    }

    verifyPayment()
  }, [saleId, attempts])

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)] flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full max-w-md bg-[var(--color-surface-container-lowest)] p-8 rounded-2xl shadow-xl text-center border border-[var(--color-outline-variant)]">
        
        {status === 'verifying' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-[#e8f0fe] rounded-full flex items-center justify-center mb-6 text-[#1a73e8] animate-pulse">
              <span className="material-symbols-outlined text-[32px] animate-spin">progress_activity</span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-on-surface)] mb-2">Vérification du paiement...</h2>
            <p className="text-[var(--color-on-surface-variant)] text-sm">
              Veuillez patienter pendant que nous confirmons la transaction avec Chariow. ({attempts}/10)
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-[#e6f4ea] rounded-full flex items-center justify-center mb-6 text-[#1e8e3e]">
              <span className="material-symbols-outlined text-[40px]">check_circle</span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-on-surface)] mb-2">Paiement Réussi !</h2>
            <p className="text-[var(--color-on-surface-variant)] text-sm mb-8">
              Merci pour votre confiance. Votre abonnement Scogestia a été prolongé avec succès.
            </p>
            <Link 
              href="/admin/abonnement"
              className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity w-full block"
            >
              Retourner au tableau de bord
            </Link>
          </div>
        )}

        {status === 'pending' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-[#fff8e1] rounded-full flex items-center justify-center mb-6 text-[#f57f17]">
              <span className="material-symbols-outlined text-[40px]">schedule</span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-on-surface)] mb-2">Paiement en attente</h2>
            <p className="text-[var(--color-on-surface-variant)] text-sm mb-8">
              Votre paiement est en cours de traitement par votre opérateur. S'il est validé, votre abonnement sera activé automatiquement.
            </p>
            <Link 
              href="/admin/abonnement"
              className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity w-full block"
            >
              Vérifier le statut
            </Link>
          </div>
        )}

        {status === 'failed' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-[#fce8e6] rounded-full flex items-center justify-center mb-6 text-[#d93025]">
              <span className="material-symbols-outlined text-[40px]">error</span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-on-surface)] mb-2">Échec de la vérification</h2>
            <p className="text-[var(--color-on-surface-variant)] text-sm mb-8">
              Nous n'avons pas pu confirmer ce paiement. Si vous avez été débité, veuillez contacter le support.
            </p>
            <Link 
              href="/admin/abonnement"
              className="border border-[var(--color-outline)] text-[var(--color-on-surface)] px-8 py-3 rounded-lg font-bold hover:bg-black/5 transition-colors w-full block"
            >
              Réessayer
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
