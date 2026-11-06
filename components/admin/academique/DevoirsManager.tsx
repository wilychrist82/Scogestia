'use client'

import { useState, useTransition, FormEvent } from 'react'
import { publishHomework, deleteHomework } from '@/app/actions/academique'
import Link from 'next/link'
import { ChevronRight, PlusCircle, CheckCircle2, Search, BookOpen, Paperclip, Trash2, X, Camera, FileText, Download } from 'lucide-react'

type ClassItem = { id: string; name: string; level: string }
type SubjectItem = { id: string; name: string; cycle: string }
type StudentItem = { id: string; first_name: string; last_name: string; class_id: string }
type HomeworkItem = {
  id: string
  title: string
  subject_name: string
  due_date: string
  created_at: string
  description?: string
  attachment_url?: string
  target_students?: string[]
  class: { name: string } | null
  creator: { full_name: string } | null
}

type Props = {
  homeworks: HomeworkItem[]
  classes: ClassItem[]
  subjects: SubjectItem[]
  students?: StudentItem[]
}

export function DevoirsManager({ homeworks, classes, subjects, students = [] }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [entryType, setEntryType] = useState<'homework' | 'lesson'>('homework')
  const [activeTab, setActiveTab] = useState<'all' | 'homework' | 'lesson'>('all')
  const [filterClass, setFilterClass] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [selectedHomework, setSelectedHomework] = useState<HomeworkItem | null>(null)

  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [assignmentMode, setAssignmentMode] = useState<'all' | 'selective'>('all')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  
  const availableSubjects = subjects;
  const availableStudents = students.filter(s => s.class_id === selectedClassId)

  const isLessonItem = (hw: HomeworkItem) => hw.title?.startsWith('[LEÇON]') || hw.title?.startsWith('[CAHIER]')
  const cleanTitle = (title?: string) => (title || '').replace(/^\[(LEÇON|CAHIER)\]\s*/i, '')

  const filteredHomeworks = homeworks.filter((hw) => {
    const isLesson = isLessonItem(hw)
    if (activeTab === 'homework' && isLesson) return false
    if (activeTab === 'lesson' && !isLesson) return false
    if (filterClass !== 'ALL' && hw.class?.name !== filterClass) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchTitle = (hw.title || '').toLowerCase().includes(q)
      const matchSub = (hw.subject_name || '').toLowerCase().includes(q)
      const matchDesc = (hw.description || '').toLowerCase().includes(q)
      const matchCreator = (hw.creator?.full_name || '').toLowerCase().includes(q)
      if (!matchTitle && !matchSub && !matchDesc && !matchCreator) return false
    }
    return true
  })

  const lessonsCount = homeworks.filter(isLessonItem).length
  const homeworksOnlyCount = homeworks.length - lessonsCount

  const openAddModal = (type: 'homework' | 'lesson' = 'homework') => {
    setError(null)
    setEntryType(type)
    setIsModalOpen(true)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const rawTitle = (formData.get('title') as string || '').trim()
    if (entryType === 'lesson') {
      const lessonTitle = rawTitle ? `[LEÇON] ${rawTitle.replace(/^\[LEÇON\]\s*/i, '')}` : '[LEÇON] Séance de cours'
      formData.set('title', lessonTitle)
    }
    
    if (assignmentMode === 'selective' && entryType === 'homework') {
      if (selectedStudents.length === 0) {
        setError("Veuillez sélectionner au moins un élève.");
        return;
      }
      formData.append('targetStudents', JSON.stringify(selectedStudents));
    }
    
    startTransition(async () => {
      const result = await publishHomework(null, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setIsModalOpen(false)
        setSuccessMsg(entryType === 'lesson' ? "Séance enregistrée dans le Cahier de Textes !" : "Devoir publié avec succès !")
        setTimeout(() => setSuccessMsg(null), 5000)
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce devoir ?")) return;
    
    startDeleteTransition(async () => {
      const result = await deleteHomework(id)
      if (result?.error) {
        alert(result.error)
      } else {
        setSuccessMsg("Devoir supprimé avec succès !")
        setTimeout(() => setSuccessMsg(null), 5000)
      }
    })
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[var(--color-surface)]">
      <div className="max-w-[1280px] mx-auto space-y-6">
        
        {/* En-tête Exécutif — Stripe Royal Indigo & Sapphire */}
        <div className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E293B] via-[#312E81] to-[#4338CA] px-6 py-5 text-white shadow-[0_14px_34px_-12px_rgba(67,56,202,0.45)] ring-1 ring-indigo-400/25 sm:px-7 sm:py-6 lg:flex-row lg:items-center">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-indigo-400/25 blur-3xl" />
            <div className="absolute -bottom-20 left-1/3 h-48 w-72 rounded-full bg-sky-400/15 blur-3xl" />
          </div>
          <div className="relative z-10">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-50 ring-1 ring-inset ring-white/25 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
              Académique · Devoirs & Cahier de Textes
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">Devoirs & Cahier de Textes Numérique</h2>
            <p className="mt-1 text-[13px] font-medium text-indigo-100/90 sm:text-sm">Publiez les devoirs de maison et renseignez le cahier de textes (leçons dispensées en classe).</p>
          </div>
          <div className="relative z-10 flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => openAddModal('lesson')}
              className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white ring-1 ring-white/25 backdrop-blur-md h-10 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all w-full sm:w-auto"
            >
              <BookOpen className="w-4 h-4 text-sky-300" />
              + Cahier de Textes (Leçon)
            </button>
            <button
              onClick={() => openAddModal('homework')}
              className="flex items-center justify-center gap-2 bg-white text-indigo-950 h-10 px-5 rounded-xl text-xs sm:text-sm font-extrabold hover:bg-indigo-50 transition-all shadow-md w-full sm:w-auto shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-indigo-700" />
              + Publier un devoir
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="bg-[#e0f7fa] text-[#006064] p-4 rounded-xl border border-[#b2ebf2] flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#006064] shrink-0" />
            <span className="font-medium text-sm">{successMsg}</span>
          </div>
        )}

        {/* Data Table Container */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl border border-[var(--color-outline-variant)] overflow-hidden shadow-sm flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-[var(--color-outline-variant)] flex flex-col lg:flex-row gap-4 bg-[var(--color-surface-bright)] justify-between items-stretch lg:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all ${
                  activeTab === 'all'
                    ? 'bg-indigo-950 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Tout ({homeworks.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('homework')}
                className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all ${
                  activeTab === 'homework'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Devoirs à la maison ({homeworksOnlyCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('lesson')}
                className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all ${
                  activeTab === 'lesson'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Cahier de Textes · Leçons ({lessonsCount})
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="h-10 px-3 bg-white border border-[var(--color-outline-variant)] rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-indigo-600"
              >
                <option value="ALL">Toutes les classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 h-10 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)] rounded-lg text-xs sm:text-sm focus:border-[var(--color-primary)] outline-none transition-all"
                  placeholder="Rechercher matière, chapitre, prof..."
                  type="text"
                />
              </div>
            </div>
          </div>

          {filteredHomeworks.length === 0 ? (
             <div className="p-12 flex flex-col items-center justify-center text-center text-[var(--color-on-surface-variant)] flex-1">
               <BookOpen className="w-10 h-10 mb-2 opacity-50" />
               <p className="text-lg font-medium">Aucune entrée trouvée</p>
               <p className="text-sm">Publiez un devoir ou renseignez une leçon dans le cahier de textes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredHomeworks.map((hw) => {
                const isLesson = isLessonItem(hw)
                return (
                <div key={hw.id} className="bg-white border border-[var(--color-outline-variant)] rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <span className="px-2.5 py-1 bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] rounded text-xs font-semibold uppercase tracking-wider">
                      {hw.subject_name}
                    </span>
                    {isLesson ? (
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded-full text-xs font-extrabold border border-indigo-200">
                        📘 Cahier de Textes · {new Date(hw.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-[#fff8e1] text-[#f57f17] rounded-full text-xs font-bold border border-[#ffe082]">
                        À rendre le {new Date(hw.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-[var(--color-on-surface)] text-lg mb-1 leading-tight">{cleanTitle(hw.title)}</h3>
                  <p className="text-sm text-[var(--color-on-surface-variant)] mb-4 flex-1">
                    Classe : {hw.class?.name || '-'} {hw.target_students ? <span className="text-xs bg-[#e0f7fa] text-[#006064] px-2 py-0.5 rounded-full ml-2">{hw.target_students.length} ciblés</span> : null}<br/>
                    Publié le : {new Date(hw.created_at).toLocaleDateString('fr-FR')} par {hw.creator?.full_name || 'Admin'}
                  </p>
                  <div className="flex gap-2 mt-auto">
                    {hw.attachment_url && (
                      <a href={hw.attachment_url.startsWith('http') ? hw.attachment_url : `https://mxttnddswkntrryshqzl.supabase.co/storage/v1/object/public/homework-attachments/${hw.attachment_url}`} target="_blank" rel="noreferrer" className="flex-1 bg-[#f0f4ff] text-[var(--color-primary)] border border-[#cce0ff] hover:bg-[#e0edff] py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1">
                        <Paperclip className="w-4 h-4" /> Pièce jointe
                      </a>
                    )}
                    <button 
                      onClick={() => setSelectedHomework(hw)}
                      className="flex-1 bg-[var(--color-surface-bright)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] py-2 rounded-lg text-sm font-semibold transition-colors">
                      Voir
                    </button>
                    <button 
                      onClick={() => handleDelete(hw.id)}
                      disabled={isDeleting}
                      className="px-3 bg-[var(--color-surface-bright)] text-[var(--color-status-retard-text)] border border-[var(--color-outline-variant)] hover:border-[var(--color-status-retard-text)] hover:bg-[#fff0f0] rounded-lg transition-colors flex items-center justify-center disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Ajouter un devoir ou une séance du cahier de textes */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b1c30]/40  transition-opacity">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-lg rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--color-outline-variant)] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-outline-variant)] flex justify-between items-center bg-[var(--color-surface-bright)]">
              <h2 className="text-xl font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                {entryType === 'lesson' ? (
                  <>
                    <BookOpen className="w-5 h-5 text-indigo-700" />
                    Cahier de Textes · Saisir une leçon
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5 text-[var(--color-primary)]" />
                    Publier un devoir
                  </>
                )}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] p-1 rounded-full hover:bg-[#dce9ff] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-4">
                
                {error && (
                  <div className="bg-[#fff0f0] text-[var(--color-status-retard-text)] p-3 rounded-lg text-sm font-medium border border-[var(--color-status-retard-text)]/20">
                    {error}
                  </div>
                )}
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="classId">
                    Classe <span className="text-[var(--color-status-retard-text)]">*</span>
                  </label>
                  <select 
                    className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]" 
                    id="classId" 
                    name="classId" 
                    required
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                  >
                    <option value="">Sélectionner une classe</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="subjectName">
                    Matière (Optionnel)
                  </label>
                  <select 
                    className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]" 
                    id="subjectName" 
                    name="subjectName" 
                    disabled={!selectedClassId}
                  >
                    <option value="">Sélectionner une matière</option>
                    {availableSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]">
                    Pièce jointe (Optionnel)
                  </label>
                  <div className="flex flex-wrap gap-3 mt-1">
                    <button 
                      type="button" 
                      onClick={() => {
                        const input = document.getElementById('attachment_input') as HTMLInputElement;
                        if (input) {
                          input.removeAttribute('capture');
                          input.setAttribute('accept', 'image/*');
                          input.setAttribute('capture', 'environment');
                          input.click();
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-[#eff4ff] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all"
                    >
                      <Camera className="w-5 h-5" />
                      Prendre une photo
                    </button>

                    <button 
                      type="button" 
                      onClick={() => {
                        const input = document.getElementById('attachment_input') as HTMLInputElement;
                        if (input) {
                          input.removeAttribute('capture');
                          input.setAttribute('accept', '.pdf,.doc,.docx,image/*');
                          input.click();
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-[#eff4ff] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all"
                    >
                      <Paperclip className="w-5 h-5" />
                      Joindre un document
                    </button>
                  </div>
                  
                  <input 
                    id="attachment_input" 
                    name="attachment" 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => {
                      const fileLabel = document.getElementById('attachment_label');
                      if (fileLabel && e.target.files && e.target.files.length > 0) {
                        fileLabel.textContent = e.target.files[0].name;
                        fileLabel.classList.remove('hidden');
                      } else if (fileLabel) {
                        fileLabel.textContent = '';
                        fileLabel.classList.add('hidden');
                      }
                    }}
                  />
                  <div id="attachment_label" className="hidden mt-2 text-sm text-[var(--color-primary)] font-medium flex items-center gap-2 bg-[#eff4ff] p-2 rounded-lg border border-[var(--color-primary)]/20">
                    <FileText className="w-4 h-4" />
                    Fichier sélectionné
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="title">
                    {entryType === 'lesson' ? 'Titre du chapitre / de la leçon dispensée *' : 'Titre du devoir (Optionnel)'}
                  </label>
                  <input
                    className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                    id="title"
                    name="title"
                    type="text"
                    required={entryType === 'lesson'}
                    placeholder={entryType === 'lesson' ? 'Ex: Chapitre 4 — Les équations du premier degré' : 'Ex: Exercices sur les fractions'}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="description">
                    {entryType === 'lesson' ? 'Résumé du cours dispensé & notions abordées' : 'Description / Consignes'}
                  </label>
                  <textarea
                    className="w-full p-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)] min-h-[100px]"
                    id="description"
                    name="description"
                    placeholder={entryType === 'lesson' ? 'Détaillez les points du programme traités pendant la séance...' : 'Détaillez le travail à faire...'}
                  ></textarea>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[var(--color-on-surface)]" htmlFor="dueDate">
                    {entryType === 'lesson' ? 'Date de la séance de cours' : 'Date limite de rendu (Optionnel)'}
                  </label>
                  <input
                    className="w-full h-12 px-4 border border-[var(--color-outline-variant)] rounded-lg text-base focus:border-[var(--color-primary)] outline-none bg-[var(--color-surface)]"
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {selectedClassId && (
                  <div className="flex flex-col gap-3 mt-2 border-t pt-4 border-[var(--color-outline-variant)]">
                    <label className="text-sm font-semibold text-[var(--color-on-surface)]">
                      Destinataires
                    </label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="radio" name="assignmentMode" checked={assignmentMode === 'all'} onChange={() => setAssignmentMode('all')} className="w-4 h-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                        Toute la classe
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="radio" name="assignmentMode" checked={assignmentMode === 'selective'} onChange={() => setAssignmentMode('selective')} className="w-4 h-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                        Élèves spécifiques
                      </label>
                    </div>

                    {assignmentMode === 'selective' && (
                      <div className="p-3 border border-[var(--color-outline-variant)] rounded-lg max-h-48 overflow-y-auto bg-[var(--color-surface-bright)]">
                        {availableStudents.length === 0 ? (
                          <p className="text-sm text-gray-500">Aucun élève trouvé dans cette classe.</p>
                        ) : (
                          availableStudents.map(student => (
                            <label key={student.id} className="flex items-center gap-3 p-2 hover:bg-[#f0f4ff] rounded cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={selectedStudents.includes(student.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedStudents([...selectedStudents, student.id])
                                  else setSelectedStudents(selectedStudents.filter(id => id !== student.id))
                                }}
                                className="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                              />
                              <span className="text-sm">{student.last_name} {student.first_name}</span>
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>
              
              <div className="px-6 py-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] flex justify-end gap-3 mt-auto">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-[var(--color-outline)] text-[var(--color-on-surface)] font-semibold text-sm hover:bg-[#eff4ff] transition-colors" disabled={isPending}>Annuler</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:opacity-90 transition-colors shadow-sm disabled:opacity-50" disabled={isPending}>
                  {isPending ? 'Enregistrement...' : entryType === 'lesson' ? 'Enregistrer dans le Cahier de Textes' : 'Publier le devoir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Voir un devoir */}
      {selectedHomework && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b1c30]/40 transition-opacity p-4">
          <div className="bg-[var(--color-surface-container-lowest)] w-full max-w-lg rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--color-outline-variant)] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-outline-variant)] flex justify-between items-center bg-[var(--color-surface-bright)]">
              <h2 className="text-xl font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[var(--color-primary)]" />
                Détails du devoir
              </h2>
              <button onClick={() => setSelectedHomework(null)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] p-1 rounded-full hover:bg-[#dce9ff] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-on-surface)]">{selectedHomework.title}</h3>
                <div className="flex gap-2 mt-2">
                  <span className="px-2.5 py-1 bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] rounded text-xs font-semibold uppercase tracking-wider">
                    {selectedHomework.subject_name}
                  </span>
                  <span className="px-2.5 py-1 bg-[#fff8e1] text-[#f57f17] rounded-full text-xs font-bold border border-[#ffe082]">
                    À rendre le {new Date(selectedHomework.due_date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              {selectedHomework.description && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-[var(--color-on-surface-variant)] mb-1">Description / Consignes</h4>
                  <div className="bg-[var(--color-surface-bright)] p-4 rounded-lg border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] text-sm whitespace-pre-wrap">
                    {selectedHomework.description}
                  </div>
                </div>
              )}

              <div className="mt-4 text-sm text-[var(--color-on-surface-variant)]">
                <p><strong>Classe :</strong> {selectedHomework.class?.name || '-'}</p>
                <p><strong>Ciblage :</strong> {selectedHomework.target_students ? `${selectedHomework.target_students.length} élève(s) spécifique(s)` : 'Toute la classe'}</p>
                <p><strong>Publié le :</strong> {new Date(selectedHomework.created_at).toLocaleDateString('fr-FR')} par {selectedHomework.creator?.full_name || 'Admin'}</p>
              </div>

              {selectedHomework.attachment_url && (
                <div className="mt-4 pt-4 border-t border-[var(--color-outline-variant)]">
                  <a href={selectedHomework.attachment_url.startsWith('http') ? selectedHomework.attachment_url : `https://mxttnddswkntrryshqzl.supabase.co/storage/v1/object/public/homework-attachments/${selectedHomework.attachment_url}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-[#f0f4ff] text-[var(--color-primary)] border border-[#cce0ff] hover:bg-[#e0edff] py-2.5 rounded-lg text-sm font-semibold transition-colors">
                    <Download className="w-4 h-4" /> Télécharger la pièce jointe
                  </a>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-bright)] flex justify-end">
              <button onClick={() => setSelectedHomework(null)} className="px-5 py-2.5 rounded-lg border border-[var(--color-outline)] text-[var(--color-on-surface)] font-semibold text-sm hover:bg-[#eff4ff] transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
