'use client'

import { useParams } from 'next/navigation'
import { EmptyState } from '@/components/ui/EmptyState'
import { Presentation } from 'lucide-react'
import Link from 'next/link'

export default function ClassDetailsPage() {
  const params = useParams()
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/classes" className="text-gray-500 hover:text-gray-900 bg-white p-2 rounded-lg border border-gray-200">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Détails de la classe</h1>
          <p className="text-gray-500">Vue générale de la classe (ID: {params.id})</p>
        </div>
      </div>
      
      {/* Tabs would go here based on Cahier des Charges */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto custom-scrollbar">
        <button className="px-6 py-3 border-b-2 border-[var(--color-primary)] text-[var(--color-primary)] font-semibold whitespace-nowrap">Vue générale</button>
        <button className="px-6 py-3 text-gray-500 hover:text-gray-900 whitespace-nowrap">Élèves</button>
        <button className="px-6 py-3 text-gray-500 hover:text-gray-900 whitespace-nowrap">Notes</button>
        <button className="px-6 py-3 text-gray-500 hover:text-gray-900 whitespace-nowrap">Présences</button>
        <button className="px-6 py-3 text-gray-500 hover:text-gray-900 whitespace-nowrap">Devoirs</button>
      </div>

      <EmptyState 
        title="Contenu en développement"
        description="La fiche détaillée de la classe sera bientôt disponible dans cette version."
        icon={Presentation}
      />
    </div>
  )
}
