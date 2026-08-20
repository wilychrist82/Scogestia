'use client'

import { EmptyState } from '@/components/ui/EmptyState'
import { CalendarDays } from 'lucide-react'

export default function EmploisDuTempsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Emplois du temps</h1>
          <p className="text-gray-500">Gérez les plannings des classes et des professeurs.</p>
        </div>
      </div>
      <EmptyState 
        title="Aucun emploi du temps"
        description="Vous n'avez pas encore généré ou importé d'emplois du temps pour cette année."
        icon={CalendarDays}
      />
    </div>
  )
}
