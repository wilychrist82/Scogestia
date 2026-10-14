'use client'

import { useState, useTransition, useMemo, useEffect, FormEvent } from 'react'
import { saveSchoolSubject, deleteSchoolSubject, ensurePhilosophieSubject, ensureEtudeDeTexteSubject } from '@/app/actions/academique'
import Link from 'next/link'
import { ChevronRight, Plus, BookOpen, Trash2, X, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import { 
  LYCEE_SERIES_CONFIG, 
  LyceeSeriesKey, 
  normalizeSubjectName, 
  getPrimarySubjectOrder,
  isLectureSubject,
  isEtudeDeTexteSubject
} from '@/lib/academic-curriculum'

export type SubjectItem = {
  id: string
  name: string
  cycle: string
  category: string | null
  coefficient: number
}

type Props = {
  subjects: SubjectItem[]
}

export function MatieresManager({ subjects }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  
  // Cycles: primaire | college | lycee
  const [selectedCycle, setSelectedCycle] = useState<'primaire' | 'college' | 'lycee'>('primaire')
  const [selectedLyceeSeries, setSelectedLyceeSeries] = useState<LyceeSeriesKey | 'all'>('all')
  const [formCycle, setFormCycle] = useState<string>('primaire')

  const openAddModal = () => {
    setError(null)
    setIsModalOpen(true)
    setFormCycle(selectedCycle)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await saveSchoolSubject(null, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setIsModalOpen(false)
        setSuccessMsg("Matière enregistrée avec succès !")
        setTimeout(() => setSuccessMsg(null), 3000)
      }
    })
  }

  const handleDelete = (subjectId: string, subjectName: string) => {
    if (!confirm(`Confirmez-vous la suppression de la matière "${subjectName}" ?`)) return
    setError(null)
    startTransition(async () => {
      const res = await deleteSchoolSubject(subjectId)
      if (res?.error) {
        setError(res.error)
      } else {
        setSuccessMsg(`Matière "${subjectName}" supprimée.`)
        setTimeout(() => setSuccessMsg(null), 3000)
      }
    })
  }

  const handleEnsurePhilosophie = () => {
    setError(null)
    startTransition(async () => {
      const res = await ensurePhilosophieSubject()
      if (res?.error) {
        setError(res.error)
      } else {
        setSuccessMsg("La matière Philosophie a été ajoutée avec succès au programme du Lycée !")
        setTimeout(() => setSuccessMsg(null), 3500)
      }
    })
  }

  const handleEnsureEtudeDeTexte = () => {
    setError(null)
    startTransition(async () => {
      const res = await ensureEtudeDeTexteSubject()
      if (res?.error) {
        setError(res.error)
      } else {
        setSuccessMsg("La discipline Étude de texte a été ajoutée avec succès après la Lecture au programme du Primaire !")
        setTimeout(() => setSuccessMsg(null), 3500)
      }
    })
  }

  // Vérifier si Philosophie est déjà présente dans les matières du secondaire
  const hasPhilosophie = subjects.some(s => s.cycle === 'secondaire' && s.name.toLowerCase().includes('philo'))

  // Vérifier si Étude de texte est présente dans les matières du primaire
  const hasEtudeDeTexte = subjects.some(s => {
    const n = (s.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
    return n === 'etude de texte' || n.includes('etude de texte') || n.includes('etude texte')
  })

  // Synchronisation automatique en arrière-plan d'Étude de texte si absente
  useEffect(() => {
    if (!hasEtudeDeTexte) {
      ensureEtudeDeTexteSubject()
    }
  }, [hasEtudeDeTexte])

  // Filtrage des matières
  const isPrimary = selectedCycle === 'primaire'
  const isCollege = selectedCycle === 'college'
  const isLycee = selectedCycle === 'lycee'

  const filteredSubjects = useMemo(() => {
    const list = subjects.filter(s => {
      if (isPrimary) return !s.cycle || s.cycle.toLowerCase() === 'primaire' || s.cycle.toLowerCase() === 'maternelle'
      return s.cycle === 'secondaire'
    })

    // Déduplication stricte par nom normalisé
    const seen = new Set<string>()
    const deduplicated: typeof list = []

    for (const sub of list) {
      const norm = (sub.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
      if (!seen.has(norm)) {
        seen.add(norm)
        deduplicated.push(sub)
      }
    }

    // Si on est au primaire et qu'Étude de texte n'est pas encore dans la liste DB
    const hasEtudeInList = deduplicated.some(s => {
      const n = (s.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
      return n === 'etude de texte' || n.includes('etude de texte') || n.includes('etude texte')
    })

    if (isPrimary && !hasEtudeInList) {
      deduplicated.push({
        id: 'virtual-etude-de-texte',
        name: 'Étude de texte',
        cycle: 'primaire',
        category: 'Français',
        coefficient: 1
      })
    }

    if (isPrimary) {
      return [...deduplicated].sort((a, b) => getPrimarySubjectOrder(a.name) - getPrimarySubjectOrder(b.name))
    }
    return deduplicated
  }, [subjects, isPrimary, hasEtudeDeTexte])

  // Primary categories
  const primaryCategories = [
    'Français',
    'Mathématiques',
    'Sciences et technologies',
    'Sciences humaines',
    'Education sociale',
    'EAC',
    'EPS'
  ]

  const lyceeSeriesKeys: LyceeSeriesKey[] = [
    '2nde_S', '2nde_A4', '1ere_A4', '1ere_D', '1ere_C', 'tle_A4', 'tle_D', 'tle_C'
  ]

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)] custom-scrollbar">
      <div className="max-w-[1280px] mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-surface-container-lowest)] p-6 rounded-xl border border-[var(--color-outline-variant)]">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] mb-2">
              <Link href="/admin/academique" className="hover:text-[var(--color-primary)] transition-colors text-sm font-semibold">
                Académique
              </Link>
              <ChevronRight className="w-4 h-4 text-sm" />
              <span className="text-sm font-semibold text-[var(--color-on-surface)]">Matières & Coefficients</span>
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-on-surface)]">Gestion des Matières</h2>
            <p className="text-base text-[var(--color-on-surface-variant)] mt-1">
              Configuration des matières et coefficients officiels par cycle et par série (Collège & Lycée).
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {isLycee && !hasPhilosophie && (
              <button 
                onClick={handleEnsurePhilosophie} 
                disabled={isPending}
                className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white h-12 px-5 rounded-full text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Ajouter Philosophie
              </button>
            )}
            {isPrimary && !hasEtudeDeTexte && (
              <button 
                onClick={handleEnsureEtudeDeTexte} 
                disabled={isPending}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-5 rounded-full text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Ajouter Étude de texte
              </button>
            )}
            <button 
              onClick={openAddModal} 
              className="flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white h-12 px-6 rounded-full text-sm font-semibold hover:opacity-90 transition-colors shadow-sm w-full sm:w-auto shrink-0"
            >
              <Plus className="w-5 h-5" />
              Nouvelle matière
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-[var(--color-status-retard-bg)] text-[var(--color-status-retard-text)] p-4 rounded-xl text-sm font-semibold border border-red-200">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-[var(--color-status-paye-bg)] text-[var(--color-status-paye-text)] p-4 rounded-xl text-sm font-semibold border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {successMsg}
          </div>
        )}

        {/* Info Lycée Philosophie Alert */}
        {isLycee && !hasPhilosophie && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="text-sm text-amber-900">
              <p className="font-bold">Matière Philosophie manquante pour le Lycée (Secondaire 2)</p>
              <p className="text-amber-800 text-xs mt-0.5">
                La Philosophie est obligatoire pour les séries littéraires (A4 coef 4) et enseignée en C et D (coef 2).
              </p>
            </div>
            <button
              onClick={handleEnsurePhilosophie}
              disabled={isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-xs font-bold shrink-0 transition-colors"
            >
              Ajouter en 1 clic
            </button>
          </div>
        )}

        {/* Data Table Container */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] overflow-hidden shadow-sm flex flex-col min-h-[500px]">
          {/* Cycle Tabs */}
          <div className="p-4 border-b border-[var(--color-outline-variant)] flex flex-col md:flex-row gap-4 bg-[var(--color-surface-bright)] justify-between items-start md:items-center">
            <div className="flex bg-[var(--color-surface-container-high)] p-1 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSelectedCycle('primaire')}
                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${selectedCycle === 'primaire' ? 'bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'}`}
              >
                Cycle Primaire
              </button>
              <button
                type="button"
                onClick={() => setSelectedCycle('college')}
                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${selectedCycle === 'college' ? 'bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'}`}
              >
                Secondaire 1 (Collège)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCycle('lycee')}
                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${selectedCycle === 'lycee' ? 'bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'}`}
              >
                Secondaire 2 (Lycée)
              </button>
            </div>
            
            <div className="text-sm font-medium text-[var(--color-on-surface-variant)]">
              {filteredSubjects.length} matière{filteredSubjects.length > 1 ? 's' : ''} configurée{filteredSubjects.length > 1 ? 's' : ''}
            </div>
          </div>

          {/* Sub-series Bar for Lycée */}
          {isLycee && (
            <div className="p-4 bg-slate-50 border-b border-[var(--color-outline-variant)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Filières & Séries du Lycée :
                </span>
                <span className="text-xs text-slate-500">
                  Les coefficients s'adaptent automatiquement sur les bulletins selon la série de l'élève.
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedLyceeSeries('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedLyceeSeries === 'all' ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                >
                  Vue d'ensemble (Toutes les séries)
                </button>
                {lyceeSeriesKeys.map((k) => {
                  const conf = LYCEE_SERIES_CONFIG[k]
                  const isActive = selectedLyceeSeries === k
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSelectedLyceeSeries(k)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                    >
                      {conf.shortLabel}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {filteredSubjects.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] flex-1">
              <BookOpen className="w-10 h-10 mb-2 opacity-50 text-[var(--color-primary)]" />
              <p className="text-lg font-medium">Aucune matière configurée pour ce cycle</p>
              <p className="text-sm">Ajoutez des matières pour commencer à saisir les notes.</p>
            </div>
          ) : isLycee && selectedLyceeSeries === 'all' ? (
            /* Matrix View: Toutes les séries */
            <div className="overflow-x-auto min-h-[300px] custom-scrollbar">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)]">
                    <th className="py-4 px-6 font-bold min-w-[200px]">Matière</th>
                    <th className="py-3 px-3 font-bold text-center bg-blue-50/70 border-x border-slate-200" title="Seconde S">2nde S</th>
                    <th className="py-3 px-3 font-bold text-center bg-purple-50/70 border-r border-slate-200" title="Seconde A4">2nde A4</th>
                    <th className="py-3 px-3 font-bold text-center bg-purple-50/70 border-r border-slate-200" title="Première A4">1ère A4</th>
                    <th className="py-3 px-3 font-bold text-center bg-emerald-50/70 border-r border-slate-200" title="Première D">1ère D</th>
                    <th className="py-3 px-3 font-bold text-center bg-blue-50/70 border-r border-slate-200" title="Première C">1ère C</th>
                    <th className="py-3 px-3 font-bold text-center bg-purple-50/70 border-r border-slate-200" title="Terminale A4">Tle A4</th>
                    <th className="py-3 px-3 font-bold text-center bg-emerald-50/70 border-r border-slate-200" title="Terminale D">Tle D</th>
                    <th className="py-3 px-3 font-bold text-center bg-blue-50/70 border-r border-slate-200" title="Terminale C">Tle C</th>
                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-outline-variant)]">
                  {filteredSubjects.map((sub) => {
                    const normName = normalizeSubjectName(sub.name)
                    const isPhilo = normName === 'Philosophie'
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-6 font-semibold text-[var(--color-on-surface)]">
                          <div className="flex items-center gap-2">
                            <span>{sub.name}</span>
                            {isPhilo && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                Lycée
                              </span>
                            )}
                          </div>
                        </td>
                        {lyceeSeriesKeys.map((key) => {
                          const conf = LYCEE_SERIES_CONFIG[key]
                          const coef = conf.coefficients[normName] ?? 2
                          const isHigh = coef >= 4
                          const isMid = coef === 3
                          return (
                            <td key={key} className="py-3 px-3 text-center border-r border-slate-100">
                              <span className={`inline-block min-w-7 py-0.5 px-1.5 rounded text-xs font-bold ${
                                isHigh ? 'bg-emerald-600 text-white' :
                                isMid ? 'bg-blue-600 text-white' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {coef}
                              </span>
                            </td>
                          )
                        })}
                        <td className="py-3 px-6 text-right">
                          <button 
                            onClick={() => handleDelete(sub.id, sub.name)}
                            disabled={isPending}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-full transition-colors disabled:opacity-50" 
                            title="Supprimer la matière"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : isLycee && selectedLyceeSeries !== 'all' ? (
            /* Single Lycée Series View */
            <div className="overflow-x-auto min-h-[300px] custom-scrollbar">
              <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-blue-950 text-base">
                    {LYCEE_SERIES_CONFIG[selectedLyceeSeries].label}
                  </h4>
                  <p className="text-xs text-blue-800 mt-0.5">
                    {LYCEE_SERIES_CONFIG[selectedLyceeSeries].description}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Filière {LYCEE_SERIES_CONFIG[selectedLyceeSeries].track}
                </span>
              </div>
              <table className="w-full text-left border-collapse text-base">
                <thead>
                  <tr className="bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] text-sm">
                    <th className="py-4 px-6 font-semibold">Matière</th>
                    <th className="py-4 px-6 font-semibold text-center w-36">Coefficient Officiel</th>
                    <th className="py-4 px-6 font-semibold text-center w-48">Importance</th>
                    <th className="py-4 px-6 font-semibold text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-outline-variant)]">
                  {filteredSubjects.map((sub) => {
                    const normName = normalizeSubjectName(sub.name)
                    const conf = LYCEE_SERIES_CONFIG[selectedLyceeSeries]
                    const coef = conf.coefficients[normName] ?? 2
                    const isHigh = coef >= 4
                    const isMid = coef === 3
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-6 font-medium text-[var(--color-on-surface)]">
                          {sub.name}
                        </td>
                        <td className="py-3 px-6 text-center">
                          <span className={`inline-flex items-center justify-center min-w-8 h-8 rounded-lg text-sm font-black px-2 ${
                            isHigh ? 'bg-emerald-600 text-white shadow-sm' :
                            isMid ? 'bg-blue-600 text-white' :
                            'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}>
                            {coef}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-center">
                          {coef >= 3 ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Matière Fondamentale
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                              Matière Complémentaire
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-right">
                          <button 
                            onClick={() => handleDelete(sub.id, sub.name)}
                            disabled={isPending}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-full transition-colors disabled:opacity-50" 
                            title="Supprimer la matière"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Primaire ou Collège View */
            <div className="overflow-x-auto min-h-[250px] custom-scrollbar">
              {isCollege && (
                <div className="px-6 py-2.5 bg-blue-50/70 border-b border-blue-100 text-xs font-semibold text-blue-900 flex items-center justify-between">
                  <span>Règle officielle du Secondaire 1 (Collège : 6ème, 5ème, 4ème, 3ème)</span>
                  <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold">
                    Toutes les matières sont à coefficient 2 partout
                  </span>
                </div>
              )}
              {isPrimary && (
                <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
                  Programme officiel du Primaire (CP1 au CM2)
                </div>
              )}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-container-low)] border-b border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] text-sm">
                    <th className="py-4 px-6 font-semibold">Matière</th>
                    {isPrimary && <th className="py-4 px-6 font-semibold">Catégorie</th>}
                    {isCollege && <th className="py-4 px-6 font-semibold text-center">Coefficient Officiel</th>}
                    <th className="py-4 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-outline-variant)] text-base">
                  {filteredSubjects.map((sub) => {
                    return (
                      <tr key={sub.id} className="hover:bg-[var(--color-surface-container-lowest)]/50 transition-colors bg-[var(--color-surface-container-lowest)]">
                        <td className="py-3 px-6 font-medium text-[var(--color-on-surface)]">
                          <span className="font-semibold">{sub.name}</span>
                        </td>
                      {isPrimary && (
                        <td className="py-3 px-6 text-[var(--color-on-surface-variant)]">
                          <span className="bg-[var(--color-surface-container-high)] px-3 py-1 rounded-full text-xs font-semibold">
                            {sub.category || 'Général'}
                          </span>
                        </td>
                      )}
                      {isCollege && (
                        <td className="py-3 px-6 text-center text-[var(--color-on-surface-variant)] font-semibold">
                          <span className="inline-block px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-sm font-bold">
                            2
                          </span>
                        </td>
                      )}
                      <td className="py-3 px-6 text-right">
                        <button 
                          onClick={() => handleDelete(sub.id, sub.name)}
                          disabled={isPending}
                          className="p-2 text-[var(--color-on-surface-variant)] hover:text-red-600 rounded-full transition-colors disabled:opacity-50" 
                          title="Supprimer la matière"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-[var(--color-outline-variant)]">
              <h3 className="text-xl font-bold text-[var(--color-on-surface)]">Ajouter une matière</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--color-on-surface)]">
                  Cycle d'enseignement <span className="text-[var(--color-status-retard-text)]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label className="cursor-pointer">
                    <input type="radio" name="cycle" value="primaire" className="peer sr-only" checked={formCycle === 'primaire'} onChange={() => setFormCycle('primaire')} />
                    <div className="py-2 text-center text-xs font-semibold rounded-lg border border-[var(--color-outline-variant)] peer-checked:bg-[var(--color-primary)] peer-checked:text-white peer-checked:border-[var(--color-primary)] transition-all">
                      Primaire
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <input type="radio" name="cycle" value="college" className="peer sr-only" checked={formCycle === 'college'} onChange={() => setFormCycle('college')} />
                    <div className="py-2 text-center text-xs font-semibold rounded-lg border border-[var(--color-outline-variant)] peer-checked:bg-[var(--color-primary)] peer-checked:text-white peer-checked:border-[var(--color-primary)] transition-all">
                      Collège
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <input type="radio" name="cycle" value="lycee" className="peer sr-only" checked={formCycle === 'lycee'} onChange={() => setFormCycle('lycee')} />
                    <div className="py-2 text-center text-xs font-semibold rounded-lg border border-[var(--color-outline-variant)] peer-checked:bg-[var(--color-primary)] peer-checked:text-white peer-checked:border-[var(--color-primary)] transition-all">
                      Lycée
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="name">
                  Nom de la matière <span className="text-[var(--color-status-retard-text)]">*</span>
                </label>
                <input 
                  className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface-container-lowest)]" 
                  id="name" 
                  name="name" 
                  type="text" 
                  placeholder={formCycle === 'primaire' ? "Ex: Calcul mental, Dictée..." : formCycle === 'lycee' ? "Ex: Philosophie, SVT, Mathématiques..." : "Ex: Mathématiques, Français..."}
                  required 
                />
              </div>

              {formCycle === 'primaire' && (
                <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="category">
                    Catégorie (Groupe) <span className="text-[var(--color-status-retard-text)]">*</span>
                  </label>
                  <select className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface-container-lowest)]" id="category" name="category" required>
                    <option value="">Sélectionner une catégorie...</option>
                    {primaryCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              )}

              {formCycle !== 'primaire' && (
                <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="coefficient">
                    Coefficient de base {formCycle === 'lycee' ? '(adapté selon chaque série)' : ''} <span className="text-[var(--color-status-retard-text)]">*</span>
                  </label>
                  <input className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface-container-lowest)]" id="coefficient" name="coefficient" type="number" step="0.5" min="1" defaultValue="2" required />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={isPending} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
