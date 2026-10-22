'use client'

import { useState, useTransition, FormEvent } from 'react'
import Link from 'next/link'
import { createClass, updateClass, deleteClass } from '@/app/actions/classes'
import { EmptyState } from '@/components/ui/EmptyState'
import { Presentation, Plus, Users, MoreVertical, Eye, Edit2, Trash2, X, AlertTriangle, GraduationCap, Baby, School } from 'lucide-react'
import { sortClasses } from '@/lib/classes'
import { KpiCard } from './KpiCard'

export type ClassItem = {
  id: string
  name: string
  level: string
  capacity: number
  academic_year: string
  main_teacher_id: string | null
  student_count?: number
}

type Props = {
  classes: ClassItem[]
}

const labelCls = 'text-xs font-bold uppercase tracking-wider text-slate-700'
const fieldCls =
  'w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-base font-medium text-slate-900 placeholder:text-slate-500 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20'

export function ClassesManager({ classes }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [classToEdit, setClassToEdit] = useState<ClassItem | null>(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null)
  const [openActionId, setOpenActionId] = useState<string | null>(null)

  const [levelFilter, setLevelFilter] = useState('Toutes')

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const counts = {
    maternelle: classes.filter(cls => ['s1', 's2', 'section1', 'section2', 'maternelle', 'ps', 'ms', 'gs'].some(k => ((cls.level || '') + ' ' + cls.name).toLowerCase().includes(k))).length,
    primaire: classes.filter(cls => ['cp1', 'cp2', 'cp', 'ce1', 'ce2', 'ce', 'cm1', 'cm2', 'cm', 'ci', 'primaire'].some(k => ((cls.level || '') + ' ' + cls.name).toLowerCase().includes(k))).length,
    college: classes.filter(cls => ['6eme', '6ème', '5eme', '5ème', '4eme', '4ème', '3eme', '3ème', 'college', 'collège', '6e', '5e', '4e', '3e'].some(k => ((cls.level || '') + ' ' + cls.name).toLowerCase().includes(k))).length,
    lycee: classes.filter(cls => ['2nde', 'seconde', '1ere', '1ère', 'premiere', 'tle', 'terminale', 'lycee', 'lycée'].some(k => ((cls.level || '') + ' ' + cls.name).toLowerCase().includes(k))).length,
  };

  const filteredClasses = sortClasses(classes.filter(cls => {
    if (levelFilter === 'Toutes') return true;
    const full = ((cls.level || '') + ' ' + cls.name).toLowerCase();
    if (levelFilter === 'Maternelle') return ['s1', 's2', 'section1', 'section2', 'maternelle', 'ps', 'ms', 'gs'].some(k => full.includes(k));
    if (levelFilter === 'Primaire') return ['cp1', 'cp2', 'cp', 'ce1', 'ce2', 'ce', 'cm1', 'cm2', 'cm', 'ci', 'primaire'].some(k => full.includes(k));
    if (levelFilter === 'Collège') return ['6eme', '6ème', '5eme', '5ème', '4eme', '4ème', '3eme', '3ème', 'college', 'collège', '6e', '5e', '4e', '3e'].some(k => full.includes(k));
    if (levelFilter === 'Lycée') return ['2nde', 'seconde', '1ere', '1ère', 'premiere', 'tle', 'terminale', 'lycee', 'lycée'].some(k => full.includes(k));
    return true;
  }))

  const totalStudents = classes.reduce((acc, cls) => acc + (cls.student_count ?? 0), 0)

  const openAddModal = () => {
    setClassToEdit(null)
    setError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (cls: ClassItem) => {
    setClassToEdit(cls)
    setError(null)
    setIsModalOpen(true)
  }

  const openDeleteModal = (cls: ClassItem) => {
    setClassToDelete(cls)
    setError(null)
    setIsDeleteModalOpen(true)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      let result;
      if (classToEdit) {
        formData.append('classId', classToEdit.id)
        result = await updateClass(null, formData)
      } else {
        result = await createClass(null, formData)
      }

      if (result?.error) {
        setError(result.error)
      } else {
        setIsModalOpen(false)
      }
    })
  }

  const handleDelete = () => {
    if (!classToDelete) return
    setError(null)

    startTransition(async () => {
      const result = await deleteClass(classToDelete.id)
      if (result?.error) {
        setError(result.error)
      } else {
        setIsDeleteModalOpen(false)
      }
    })
  }

  return (
    <div className="relative flex w-full flex-col space-y-6">
      {/* En-tête de page */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Classes</h1>
          <p className="mt-1 text-sm font-medium text-slate-600">Gérez les classes, les niveaux et les affectations des enseignants.</p>
        </div>
        <button
          onClick={openAddModal}
          className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#006039] to-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:from-[#004d2e] hover:to-emerald-700 hover:shadow-lg active:scale-95"
        >
          <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
          Ajouter une classe
        </button>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Classes" value={classes.length} icon={Presentation} tone="emerald" hint="Total de l'établissement" />
        <KpiCard label="Élèves inscrits" value={totalStudents} icon={Users} tone="blue" hint="Toutes classes confondues" />
        <KpiCard label="Maternelle & Primaire" value={counts.maternelle + counts.primaire} icon={Baby} tone="amber" hint={`${counts.maternelle} mat. · ${counts.primaire} prim.`} />
        <KpiCard label="Collège & Lycée" value={counts.college + counts.lycee} icon={GraduationCap} tone="violet" hint={`${counts.college} col. · ${counts.lycee} lyc.`} />
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-sm font-semibold text-rose-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Conteneur du tableau */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
        {/* Pills de niveau */}
        <div className="flex flex-col items-start justify-between gap-3 border-b border-slate-200/80 p-4 md:flex-row md:items-center">
          <div className="hide-scrollbar flex w-full items-center gap-2 overflow-x-auto pb-1 md:w-auto md:pb-0">
            {[
              { id: 'Toutes', label: 'Toutes', count: classes.length },
              { id: 'Maternelle', label: 'Maternelle', count: counts.maternelle },
              { id: 'Primaire', label: 'Primaire', count: counts.primaire },
              { id: 'Collège', label: 'Collège', count: counts.college },
              { id: 'Lycée', label: 'Lycée', count: counts.lycee },
            ].map(tab => {
              const active = levelFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setLevelFilter(tab.id)}
                  className={`flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-bold transition-all ${
                    active
                      ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300'
                      : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-extrabold tabular-nums ${
                    active ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
          <span className="whitespace-nowrap text-sm font-semibold text-slate-700">
            {filteredClasses.length} classe{filteredClasses.length > 1 ? 's' : ''} affichée{filteredClasses.length > 1 ? 's' : ''}
          </span>
        </div>

        {filteredClasses.length === 0 ? (
          <EmptyState
            title="Aucune classe trouvée"
            description="Cliquez sur 'Ajouter une classe' pour commencer à structurer votre école."
            icon={Presentation}
            actionLabel="+ Ajouter une classe"
            onAction={openAddModal}
          />
        ) : (
          <div className="min-h-[300px] overflow-x-auto pb-32">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70">
                  <th className="whitespace-nowrap px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">Nom de la classe</th>
                  <th className="whitespace-nowrap px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">Niveau</th>
                  <th className="whitespace-nowrap px-6 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-600">Effectif</th>
                  <th className="whitespace-nowrap px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">Capacité</th>
                  <th className="whitespace-nowrap px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredClasses.map(cls => {
                  const students = cls.student_count ?? 0
                  const fill = cls.capacity ? Math.min(100, Math.round((students / cls.capacity) * 100)) : 0
                  return (
                    <tr key={cls.id} className="border-b border-slate-100 transition-colors last:border-b-0 hover:bg-emerald-50/30">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200">
                            <School className="h-4 w-4" />
                          </span>
                          <span className="font-extrabold text-slate-900">{cls.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        {['2nde', 'seconde', '1ere', '1ère', 'premiere', 'tle', 'terminale', 'lycee', 'lycée'].some(k => ((cls.level || '') + ' ' + cls.name).toLowerCase().includes(k)) ? (
                          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-800 ring-1 ring-inset ring-violet-200">LYCÉE</span>
                        ) : ['6eme', '5eme', '4eme', '3eme', 'secondaire', 'college', 'collège'].some(k => ((cls.level || '') + ' ' + cls.name).toLowerCase().includes(k)) ? (
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800 ring-1 ring-inset ring-blue-200">COLLÈGE</span>
                        ) : ['cp1', 'cp2', 'ce1', 'ce2', 'cm1', 'cm2', 'primaire'].some(k => ((cls.level || '') + ' ' + cls.name).toLowerCase().includes(k)) ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 ring-1 ring-inset ring-emerald-200">PRIMAIRE</span>
                        ) : ['s1', 's2', 'section1', 'section2', 'maternelle', 'ps', 'ms', 'gs'].some(k => ((cls.level || '') + ' ' + cls.name).toLowerCase().includes(k)) ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 ring-1 ring-inset ring-amber-200">MATERNELLE</span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-800 ring-1 ring-inset ring-slate-200">{cls.level?.toUpperCase() || 'AUTRE'}</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold tabular-nums text-blue-800 ring-1 ring-inset ring-blue-200">
                          <Users className="h-3.5 w-3.5" />
                          {students} élève{students > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className="font-bold tabular-nums text-slate-900">{cls.capacity || 'Illimitée'}</span>
                        {cls.capacity > 0 && (
                          <div className="ml-auto mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${fill >= 95 ? 'bg-rose-500' : fill >= 75 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                              style={{ width: `${fill}%` }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="relative px-6 py-3.5 text-right">
                        <button
                          onClick={() => setOpenActionId(openActionId === cls.id ? null : cls.id)}
                          aria-label="Actions"
                          className="inline-block rounded-xl p-2 text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>

                        {openActionId === cls.id && (
                          <div className="absolute right-6 top-12 z-20 flex w-44 animate-[fadeIn_0.1s_ease-out] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-left shadow-xl">
                            <Link
                              href={`/admin/classes/${cls.id}`}
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-800 transition-colors hover:bg-emerald-50 hover:text-emerald-900"
                              onClick={() => setOpenActionId(null)}
                            >
                              <Eye className="h-4 w-4" />
                              Voir
                            </Link>
                            <button
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-800 transition-colors hover:bg-emerald-50 hover:text-emerald-900"
                              onClick={() => {
                                setOpenActionId(null);
                                openEditModal(cls);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                              Modifier
                            </button>
                            <button
                              onClick={() => {
                                setOpenActionId(null);
                                openDeleteModal(cls);
                              }}
                              disabled={isPending}
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Supprimer
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Overlay: Ajouter / Modifier une classe */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-opacity">
          <div className="flex w-full max-w-lg animate-[fadeIn_0.2s_ease-out] flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
                {classToEdit ? 'Modifier la classe' : 'Ajouter une nouvelle classe'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} aria-label="Fermer" className="rounded-full p-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Modal Body (Form) */}
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="custom-scrollbar max-h-[70vh] space-y-5 overflow-y-auto p-6">
                {/* Input: Nom de la classe */}
                <div className="flex flex-col gap-2">
                  <label className={labelCls} htmlFor="className">
                    Nom de la classe <span className="text-rose-600">*</span>
                  </label>
                  <input
                    className={fieldCls}
                    id="className" name="className"
                    placeholder="ex: 2nde S, 1ère D, 6ème A..."
                    required
                    defaultValue={classToEdit?.name || ''}
                    type="text"
                  />
                  {!classToEdit && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="mr-1 text-[11px] font-bold text-slate-700">Séries du Lycée :</span>
                      {['2nde S', '2nde A4', '1ère A4', '1ère D', '1ère C', 'Terminale A4', 'Terminale D', 'Terminale C'].map(name => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('className') as HTMLInputElement;
                            const select = document.getElementById('classLevel') as HTMLSelectElement;
                            if (input) input.value = name;
                            if (select) {
                              if (name.startsWith('2')) select.value = 'Seconde';
                              else if (name.startsWith('1')) select.value = 'Première';
                              else if (name.startsWith('T')) select.value = 'Terminale';
                            }
                          }}
                          className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-800 ring-1 ring-inset ring-violet-200 transition-colors hover:bg-violet-100"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Input: Niveau */}
                <div className="flex flex-col gap-2">
                  <label className={labelCls} htmlFor="classLevel">
                    Niveau <span className="text-rose-600">*</span>
                  </label>
                  <select
                    className={`${fieldCls} appearance-none`}
                    id="classLevel" name="classLevel"
                    required
                    defaultValue={classToEdit?.level || ''}
                  >
                    <option disabled value="">Sélectionner un niveau</option>
                    <optgroup label="Maternelle">
                      <option value="ps">Petite Section (PS)</option>
                      <option value="ms">Moyenne Section (MS)</option>
                      <option value="gs">Grande Section (GS)</option>
                      <option value="s1">Section 1 (S1)</option>
                      <option value="s2">Section 2 (S2)</option>
                    </optgroup>
                    <optgroup label="Primaire">
                      <option value="ci">CI</option>
                      <option value="cp1">CP1</option>
                      <option value="cp2">CP2</option>
                      <option value="ce1">CE1</option>
                      <option value="ce2">CE2</option>
                      <option value="cm1">CM1</option>
                      <option value="cm2">CM2</option>
                    </optgroup>
                    <optgroup label="Secondaire - Collège">
                      <option value="6eme">6ème</option>
                      <option value="5eme">5ème</option>
                      <option value="4eme">4ème</option>
                      <option value="3eme">3ème</option>
                    </optgroup>
                    <optgroup label="Secondaire - Lycée">
                      <option value="Seconde">Seconde</option>
                      <option value="Première">Première</option>
                      <option value="Terminale">Terminale</option>
                    </optgroup>
                  </select>
                </div>
                {/* Input: Capacité */}
                <div className="flex flex-col gap-2">
                  <label className={labelCls} htmlFor="capacity">
                    Capacité d&apos;élèves
                  </label>
                  <input
                    className={fieldCls}
                    id="capacity" name="capacity"
                    placeholder="ex: 80 (laisser vide si illimité)"
                    type="number"
                    min="1"
                    defaultValue={classToEdit?.capacity || 80}
                  />
                </div>
              </div>
              {/* Modal Footer (Actions) */}
              <div className="mt-auto flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 transition-all hover:bg-slate-50 hover:text-slate-900"
                  type="button"
                  disabled={isPending}
                >
                  Annuler
                </button>
                <button
                  className="h-11 rounded-xl bg-gradient-to-r from-[#006039] to-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:from-[#004d2e] hover:to-emerald-700 hover:shadow-md active:scale-95 disabled:opacity-50"
                  type="submit"
                  disabled={isPending}
                >
                  {isPending ? 'Enregistrement...' : classToEdit ? 'Mettre à jour' : 'Créer la classe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-opacity">
          <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-xl font-extrabold tracking-tight text-slate-900">Supprimer la classe</h2>
              <p className="text-sm font-medium leading-relaxed text-slate-700">
                Êtes-vous sûr de vouloir supprimer la classe <strong className="text-slate-900">{classToDelete?.name}</strong> ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-50"
                type="button"
                disabled={isPending}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="h-10 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:opacity-50"
                type="button"
                disabled={isPending}
              >
                {isPending ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
