'use client'

import React, { useState, useTransition } from 'react'
import { Settings, ShieldOff, CheckCircle, CalendarPlus, Loader2 } from 'lucide-react'
import { updateSchoolPlan, toggleSchoolStatus, reactivateOrExtendSchool } from '@/app/actions/super_admin'
import toast from 'react-hot-toast'

type Props = {
  schoolId: string
  currentPlan: string
  currentStatus: string
}

export function SchoolRowActions({ schoolId, currentPlan, currentStatus }: Props) {
  const [plan, setPlan] = useState(currentPlan || 'starter')
  const [status, setStatus] = useState(currentStatus || 'active')
  const [isPending, startTransition] = useTransition()
  const [actionType, setActionType] = useState<string | null>(null)

  const handleUpdatePlan = () => {
    setActionType('plan')
    startTransition(async () => {
      const res = await updateSchoolPlan(schoolId, plan)
      if (res?.error) {
        toast.error(`Erreur: ${res.error}`)
      } else {
        toast.success(`Plan mis à jour avec succès sur ${plan.toUpperCase()} !`)
      }
      setActionType(null)
    })
  }

  const handleExtend = () => {
    setActionType('extend')
    startTransition(async () => {
      const res = await reactivateOrExtendSchool(schoolId, 30)
      if (res?.error) {
        toast.error(`Erreur: ${res.error}`)
      } else {
        setStatus('active')
        toast.success("Établissement réactivé et prolongé de 30 jours !")
      }
      setActionType(null)
    })
  }

  const handleToggle = () => {
    setActionType('toggle')
    startTransition(async () => {
      const res = await toggleSchoolStatus(schoolId, status)
      if (res?.error) {
        toast.error(`Erreur: ${res.error}`)
      } else {
        const nextStatus = status === 'active' ? 'suspended' : 'active'
        setStatus(nextStatus)
        toast.success(nextStatus === 'active' ? "Établissement réactivé !" : "Établissement suspendu !")
      }
      setActionType(null)
    })
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Sélecteur de Plan */}
      <select
        value={plan}
        onChange={(e) => setPlan(e.target.value)}
        disabled={isPending}
        className="text-xs border border-gray-300 rounded-md py-1 px-2 bg-white focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] shadow-sm"
      >
        <option value="starter">Starter</option>
        <option value="pro">Pro</option>
        <option value="premium">Premium</option>
      </select>

      {/* Bouton Sauvegarder le Plan */}
      <button
        onClick={handleUpdatePlan}
        disabled={isPending}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
        title="Sauvegarder le plan"
      >
        {isPending && actionType === 'plan' ? (
          <Loader2 size={16} className="animate-spin text-blue-600" />
        ) : (
          <Settings size={16} />
        )}
      </button>

      {/* Bouton Prolonger +30j */}
      <button
        onClick={handleExtend}
        disabled={isPending}
        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors disabled:opacity-50"
        title="Réactiver ou prolonger de 30 jours"
      >
        {isPending && actionType === 'extend' ? (
          <Loader2 size={14} className="animate-spin text-emerald-700" />
        ) : (
          <CalendarPlus size={14} />
        )}
        <span>+30j</span>
      </button>

      {/* Bouton Bloquer / Débloquer */}
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${
          status === 'active'
            ? 'text-red-600 hover:bg-red-50'
            : 'text-green-600 hover:bg-green-50'
        }`}
        title={status === 'active' ? "Suspendre l'école" : "Réactiver l'école"}
      >
        {isPending && actionType === 'toggle' ? (
          <Loader2 size={16} className="animate-spin" />
        ) : status === 'active' ? (
          <ShieldOff size={16} />
        ) : (
          <CheckCircle size={16} />
        )}
      </button>
    </div>
  )
}
