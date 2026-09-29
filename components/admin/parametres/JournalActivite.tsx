'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  ShieldCheck, 
  Search, 
  CircleDollarSign, 
  UserPlus, 
  MessageSquare, 
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  Building2
} from 'lucide-react'

export type ActivityItem = {
  id: string
  type: 'payment' | 'student' | 'communication' | 'system'
  title: string
  description: string
  timestamp: string
  actor: string
  amount?: number
  metadata?: string
}

type Props = {
  activities: ActivityItem[]
  schoolName: string
}

export function JournalActivite({ activities, schoolName }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'payment' | 'student' | 'communication'>('all')

  const filtered = activities.filter(act => {
    const matchesFilter = selectedFilter === 'all' || act.type === selectedFilter
    const matchesSearch = act.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.actor.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getTypeBadge = (type: ActivityItem['type']) => {
    switch (type) {
      case 'payment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CircleDollarSign size={12} /> Encaissement
          </span>
        )
      case 'student':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <UserPlus size={12} /> Inscription
          </span>
        )
      case 'communication':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <MessageSquare size={12} /> Communication
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock size={12} /> Système
          </span>
        )
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation retour */}
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/parametres" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft size={14} />
            Retour aux paramètres
          </Link>
        </div>

        {/* En-tête */}
        <div className="bg-[var(--color-surface-container-lowest)] p-6 rounded-2xl border border-[var(--color-outline-variant)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck size={16} />
              Audit & Traçabilité
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Journal d'activités</h1>
            <p className="text-xs text-slate-500 mt-1">
              Historique chronologique certifié des opérations enregistrées pour <span className="font-semibold text-slate-700">{schoolName}</span>.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total événements</p>
            <p className="text-xl font-black text-slate-800">{activities.length}</p>
          </div>
        </div>

        {/* Navigation Onglets Paramètres */}
        <div className="flex items-center gap-2 border-b border-[var(--color-outline-variant)]">
          <Link
            href="/admin/parametres"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors"
          >
            <Building2 size={16} />
            Établissement & Identité
          </Link>
          <Link
            href="/admin/parametres/journal"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 border-emerald-600 text-emerald-700 transition-colors"
          >
            <ShieldCheck size={16} />
            Journal d'activités & Audit
          </Link>
        </div>

        {/* Barre de filtre & recherche */}
        <div className="bg-[var(--color-surface-container-lowest)] p-4 rounded-xl border border-[var(--color-outline-variant)] flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Recherche */}
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par libellé, agent..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Filtres par type */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Tout' },
              { id: 'payment', label: 'Finances' },
              { id: 'student', label: 'Inscriptions' },
              { id: 'communication', label: 'Messages' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedFilter === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste chronologique */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-outline-variant)] overflow-hidden shadow-xs">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Calendar size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">Aucune activité trouvée</p>
              <p className="text-xs text-slate-400 mt-1">Les opérations enregistrées apparaîtront ici automatiquement.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(act => (
                <div key={act.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="mt-0.5 flex-shrink-0">
                      {getTypeBadge(act.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 leading-snug">{act.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-snug">{act.description}</p>
                      {act.metadata && (
                        <p className="text-[11px] text-slate-400 mt-1 font-mono">{act.metadata}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto text-right flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {act.amount !== undefined && (
                      <span className="text-sm font-black text-emerald-700">
                        +{act.amount.toLocaleString('fr-FR')} FCFA
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium mt-0.5">
                      <Clock size={11} />
                      {new Date(act.timestamp).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
