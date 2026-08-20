'use client'

import { EmptyState } from '@/components/ui/EmptyState'
import { Banknote } from 'lucide-react'

export default function FraisPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Frais scolaires</h1>
          <p className="text-gray-500">Gérez les structures tarifaires et les catégories de frais.</p>
        </div>
      </div>
      <EmptyState 
        title="Aucun frais configuré"
        description="Vous n'avez pas encore défini de structure de frais (ex: Scolarité, Cantine, Transport)."
        icon={Banknote}
      />
    </div>
  )
}
