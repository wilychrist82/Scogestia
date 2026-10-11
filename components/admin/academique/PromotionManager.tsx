'use client'

import { useState, useTransition, useMemo } from 'react'
import { promoteStudents } from '@/app/actions/students'
import { getNextLevelSuggestion } from '@/lib/classes'
import { 
  CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, RefreshCw, 
  Users, School, Check, Search, Filter, ShieldCheck, Sparkles, AlertCircle
} from 'lucide-react'

export type PromotionStudent = {
  id: string
  matricule: string
  first_name: string
  last_name: string
  class_id: string
  average: number | null
  gradeCount: number
}

export type PromotionClass = {
  id: string
  name: string
  level?: string
}

type Props = {
  classes: PromotionClass[]
  students: PromotionStudent[]
}

export function PromotionManager({ classes, students }: Props) {
  // 1. Classe source sélectionnée (par défaut la 1ère classe qui a des élèves, ou la première classe)
  const defaultSourceId = useMemo(() => {
    const classWithStudents = classes.find(c => students.some(s => s.class_id === c.id))
    return classWithStudents ? classWithStudents.id : (classes[0]?.id || '')
  }, [classes, students])

  const [sourceClassId, setSourceClassId] = useState<string>(defaultSourceId)

  // 2. Trouver la classe source actuelle
  const sourceClass = useMemo(() => {
    return classes.find(c => c.id === sourceClassId)
  }, [classes, sourceClassId])

  // 3. Déterminer la suggestion de classe de destination
  const suggestedTargetClassId = useMemo(() => {
    if (!sourceClass) return ''
    const suggestedName = getNextLevelSuggestion(sourceClass.name)
    if (!suggestedName) return ''
    const match = classes.find(c => 
      c.id !== sourceClass.id && 
      c.name.toLowerCase().replace(/\s+/g, '').startsWith(suggestedName.toLowerCase().replace(/\s+/g, ''))
    )
    return match ? match.id : ''
  }, [classes, sourceClass])

  const [targetClassId, setTargetClassId] = useState<string>(suggestedTargetClassId || (classes.find(c => c.id !== defaultSourceId)?.id || ''))

  // Mettre à jour la cible quand la source change
  const handleSourceChange = (newSourceId: string) => {
    setSourceClassId(newSourceId)
    const newSource = classes.find(c => c.id === newSourceId)
    if (newSource) {
      const suggestedName = getNextLevelSuggestion(newSource.name)
      if (suggestedName) {
        const match = classes.find(c => 
          c.id !== newSource.id && 
          c.name.toLowerCase().replace(/\s+/g, '').startsWith(suggestedName.toLowerCase().replace(/\s+/g, ''))
        )
        if (match) {
          setTargetClassId(match.id)
          return
        }
      }
    }
    // Fallback: première classe différente
    const otherClass = classes.find(c => c.id !== newSourceId)
    if (otherClass) setTargetClassId(otherClass.id)
  }

  // 4. Élèves de la classe source
  const sourceStudents = useMemo(() => {
    return students.filter(s => s.class_id === sourceClassId)
  }, [students, sourceClassId])

  // 5. Sélection des élèves à promouvoir (par défaut, ceux qui ont average >= 10 ou pas de notes si maternelle)
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState('')

  // Initialiser les sélections selon la moyenne quand la classe change
  useMemo(() => {
    const initial: Record<string, boolean> = {}
    sourceStudents.forEach(s => {
      // Si la moyenne est >= 10 ou si l'élève n'a pas de notes (ex: maternelle), cocher par défaut
      if (s.average === null || s.average >= 10) {
        initial[s.id] = true
      } else {
        initial[s.id] = false
      }
    })
    setSelectedIds(initial)
  }, [sourceClassId, sourceStudents])

  // Filtrage par recherche
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return sourceStudents
    const q = searchTerm.toLowerCase().trim()
    return sourceStudents.filter(s => 
      s.first_name.toLowerCase().includes(q) || 
      s.last_name.toLowerCase().includes(q) || 
      s.matricule.toLowerCase().includes(q)
    )
  }, [sourceStudents, searchTerm])

  // Statistiques calculées
  const stats = useMemo(() => {
    const total = sourceStudents.length
    const admis = sourceStudents.filter(s => s.average !== null && s.average >= 10).length
    const redoublants = sourceStudents.filter(s => s.average !== null && s.average < 10).length
    const sansNotes = sourceStudents.filter(s => s.average === null).length
    const selectedCount = Object.values(selectedIds).filter(Boolean).length
    return { total, admis, redoublants, sansNotes, selectedCount }
  }, [sourceStudents, selectedIds])

  // Actions de sélection rapide
  const selectOnlyPassing = () => {
    const next: Record<string, boolean> = {}
    sourceStudents.forEach(s => {
      next[s.id] = s.average !== null ? s.average >= 10 : true
    })
    setSelectedIds(next)
  }

  const selectAll = () => {
    const next: Record<string, boolean> = {}
    sourceStudents.forEach(s => {
      next[s.id] = true
    })
    setSelectedIds(next)
  }

  const deselectAll = () => {
    const next: Record<string, boolean> = {}
    sourceStudents.forEach(s => {
      next[s.id] = false
    })
    setSelectedIds(next)
  }

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // État de transition et notification
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const handlePromote = () => {
    setFeedback(null)
    const idsToPromote = Object.entries(selectedIds)
      .filter(([_, isChecked]) => isChecked)
      .map(([id]) => id)

    if (idsToPromote.length === 0) {
      setFeedback({ type: 'error', message: 'Veuillez cocher au moins un élève à transférer.' })
      return
    }

    if (!targetClassId || targetClassId === sourceClassId) {
      setFeedback({ type: 'error', message: 'Veuillez sélectionner une classe de destination différente.' })
      return
    }

    const targetClass = classes.find(c => c.id === targetClassId)
    const confirmMessage = `Confirmez-vous le transfert de ${idsToPromote.length} élève(s) de "${sourceClass?.name}" vers "${targetClass?.name}" ?`
    
    if (!window.confirm(confirmMessage)) return

    startTransition(async () => {
      const result = await promoteStudents(idsToPromote, targetClassId)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else {
        setFeedback({ 
          type: 'success', 
          message: `Félicitations ! ${result.count} élève(s) ont été transférés avec succès vers la classe "${targetClass?.name}".` 
        })
      }
    })
  }

  const targetClass = classes.find(c => c.id === targetClassId)

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 border shadow-sm animate-in fade-in duration-300 ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-medium text-sm leading-relaxed">
            {feedback.message}
          </div>
        </div>
      )}

      {/* ── CARD PRINCIPALE : CONFIGURATION DU TRANSFERT ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-5">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-[#006039]" />
            Passage et Réinscription de Fin d&apos;Année
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Sélectionnez la classe d&apos;origine et la classe de destination. Cochez les élèves admis à passer au niveau supérieur.
          </p>
        </div>

        {/* Sélecteurs de Classes Source et Cible */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Classe d'origine */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              1. Classe d&apos;origine (Année écoulée)
            </label>
            <select
              value={sourceClassId}
              onChange={(e) => handleSourceChange(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006039] focus:border-transparent cursor-pointer shadow-xs"
            >
              {classes.map(cls => {
                const count = students.filter(s => s.class_id === cls.id).length
                return (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({count} élève{count > 1 ? 's' : ''})
                  </option>
                )
              })}
            </select>
            <p className="text-[11px] text-slate-400 mt-2">
              Effectif actuel : <strong className="text-slate-700">{sourceStudents.length} élèves</strong>
            </p>
          </div>

          {/* Classe de destination */}
          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/60">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
                2. Classe de destination (Nouvelle rentrée)
              </label>
              {suggestedTargetClassId === targetClassId && targetClassId && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                  Suggéré
                </span>
              )}
            </div>
            <select
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-emerald-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#006039] focus:border-transparent cursor-pointer shadow-xs"
            >
              <option disabled value="">Sélectionner la classe supérieure...</option>
              {classes.filter(c => c.id !== sourceClassId).map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.id === suggestedTargetClassId ? '★ (Progression normale)' : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-emerald-800/80 mt-2">
              Destination choisie : <strong className="text-emerald-900">{targetClass?.name || 'Aucune'}</strong>
            </p>
          </div>
        </div>

        {/* ── STATISTIQUES & ACTIONS DE SÉLECTION RAPIDE ── */}
        <div className="pt-2 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border-t border-slate-100">
          {/* Badges de stats */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
              Total : {stats.total}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Admis (≥ 10) : {stats.admis}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Redoublants (&lt; 10) : {stats.redoublants}
            </span>
            {stats.sansNotes > 0 && (
              <span className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-medium">
                Non notés : {stats.sansNotes}
              </span>
            )}
          </div>

          {/* Boutons de sélection */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectOnlyPassing}
              className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
            >
              Cocher les Admis uniquement
            </button>
            <button
              type="button"
              onClick={selectAll}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Tout cocher
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Tout décocher
            </button>
          </div>
        </div>
      </div>

      {/* ── LISTE DES ÉLÈVES AVEC CASES À COCHER INDIVIDUELLES ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Barre de recherche */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-[#006039]"
            />
          </div>

          <div className="text-xs font-bold text-slate-600 self-end sm:self-center">
            <span className="text-[#006039]">{stats.selectedCount}</span> sur {stats.total} élève(s) sélectionné(s)
          </div>
        </div>

        {/* Tableau */}
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            {sourceStudents.length === 0 
              ? `Aucun élève n'est inscrit dans la classe "${sourceClass?.name}".` 
              : 'Aucun élève ne correspond à votre recherche.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">
                    <span className="sr-only">Sélection</span>
                  </th>
                  <th className="p-4">Matricule</th>
                  <th className="p-4">Nom et Prénom</th>
                  <th className="p-4 text-center">Moyenne Annuelle</th>
                  <th className="p-4">Décision Recommandée</th>
                  <th className="p-4 text-right">Destination finale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(student => {
                  const isChecked = !!selectedIds[student.id]
                  const hasAverage = student.average !== null
                  const isPassing = hasAverage && student.average! >= 10

                  return (
                    <tr 
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                        isChecked ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStudent(student.id)}
                          className="w-4 h-4 rounded text-[#006039] focus:ring-[#006039] border-slate-300 cursor-pointer"
                        />
                      </td>

                      {/* Matricule */}
                      <td className="p-4 font-mono font-bold text-slate-600 text-xs">
                        {student.matricule}
                      </td>

                      {/* Nom & Prénom */}
                      <td className="p-4 font-bold text-slate-900">
                        {student.last_name} {student.first_name}
                      </td>

                      {/* Moyenne */}
                      <td className="p-4 text-center">
                        {hasAverage ? (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black tabular-nums ${
                            isPassing
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {student.average!.toFixed(2)} / 20
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            Non noté
                          </span>
                        )}
                      </td>

                      {/* Statut / Recommandation */}
                      <td className="p-4">
                        {hasAverage ? (
                          isPassing ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Admis en classe supérieure
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700">
                              <AlertTriangle className="w-4 h-4 text-amber-600" /> Redoublement conseillé
                            </span>
                          )
                        ) : (
                          <span className="text-slate-500 text-xs">
                            Passage au choix
                          </span>
                        )}
                      </td>

                      {/* Destination finale si coché */}
                      <td className="p-4 text-right">
                        {isChecked ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            Passe en {targetClass?.name || '...'} <ArrowRight className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                            Reste en {sourceClass?.name || '...'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── BARRE D'ACTION INFÉRIEURE STICKY ── */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Les élèves non cochés restent inscrits dans <strong>{sourceClass?.name}</strong> (redoublants).
          </div>

          <button
            type="button"
            disabled={isPending || stats.selectedCount === 0 || !targetClassId}
            onClick={handlePromote}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#006039] hover:bg-[#004d2e] text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
          >
            {isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Transfert en cours...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                Transférer {stats.selectedCount} élève(s) vers {targetClass?.name || 'la classe cible'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
