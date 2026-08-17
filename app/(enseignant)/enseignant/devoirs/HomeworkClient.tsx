'use client'

import { useActionState, useRef, useEffect } from 'react'
import { createHomework } from '@/app/actions/homework'
import { PlusCircle, History, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react'

type ClassSubject = {
  class_id: string;
  class_name: string;
  subject_name: string;
};

type Homework = {
  id: string;
  title: string;
  subject_name: string;
  due_date: string;
  attachment_url: string | null;
  class_name: string; // we will join this
};

export default function HomeworkClient({
  classes,
  homeworks
}: {
  classes: ClassSubject[],
  homeworks: Homework[]
}) {
  const [state, formAction, isPending] = useActionState(createHomework, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Publication de devoirs</h1>
        <p className="text-gray-600">Créez de nouveaux devoirs et gérez les publications existantes pour vos classes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: FORM */}
        <div className="lg:col-span-7">
          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              <PlusCircle className="text-emerald-600" />
              Nouveau Devoir
            </h2>
            
            <form action={formAction} ref={formRef} className="space-y-5">
              {state?.error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm font-medium">
                  {state.error}
                </div>
              )}
              {state?.success && (
                <div className="bg-emerald-50 text-emerald-700 p-3 rounded-md text-sm font-medium">
                  Devoir publié avec succès !
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="class_subject">Matière et Classe *</label>
                <select 
                  className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 focus:bg-white text-gray-900" 
                  id="class_subject" 
                  name="class_subject" 
                  required
                >
                  <option disabled value="">Sélectionnez une classe et matière</option>
                  {classes.map((c, i) => (
                    <option key={i} value={`${c.class_id}|${c.subject_name}`}>
                      {c.subject_name} ({c.class_name})
                    </option>
                  ))}
                </select>
                {/* Hidden inputs to split the value */}
                <input type="hidden" name="class_id" id="hidden_class_id" />
                <input type="hidden" name="subject_name" id="hidden_subject_name" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="titre">Titre du devoir *</label>
                <input 
                  className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 focus:bg-white text-gray-900" 
                  id="titre" 
                  name="titre" 
                  placeholder="Ex: Exercices d'algèbre linéaire" 
                  required 
                  type="text"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">Description et consignes</label>
                <textarea 
                  className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 focus:bg-white text-gray-900" 
                  id="description" 
                  name="description" 
                  placeholder="Détaillez les attentes, les chapitres concernés..." 
                  rows={4}
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="date_limite">Date limite de rendu *</label>
                  <input 
                    className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 focus:bg-white text-gray-900" 
                    id="date_limite" 
                    name="date_limite" 
                    required 
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="heure_limite">Heure limite (optionnel)</label>
                  <input 
                    className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 focus:bg-white text-gray-900" 
                    id="heure_limite" 
                    name="heure_limite" 
                    type="time"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Pièce jointe (optionnel)</label>
                <input 
                  type="file" 
                  name="attachment" 
                  id="attachment"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  accept=".pdf,.doc,.docx,.zip,.jpg,.jpeg,.png"
                />
                <p className="mt-1 text-xs text-gray-500">Formats acceptés : PDF, DOC, ZIP, Images (Max 10 Mo)</p>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button 
                  disabled={isPending}
                  className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors shadow-sm disabled:opacity-50" 
                  type="submit"
                  onClick={(e) => {
                    const select = document.getElementById('class_subject') as HTMLSelectElement;
                    const val = select.value;
                    if(val) {
                      const [cId, sName] = val.split('|');
                      (document.getElementById('hidden_class_id') as HTMLInputElement).value = cId;
                      (document.getElementById('hidden_subject_name') as HTMLInputElement).value = sName;
                    }
                  }}
                >
                  {isPending ? 'Publication en cours...' : 'Publier le devoir'}
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* RIGHT COLUMN: LIST */}
        <div className="lg:col-span-5">
          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <History className="text-emerald-600" />
                Récemment publiés
              </h2>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4">
              {homeworks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun devoir publié pour le moment.
                </div>
              ) : (
                homeworks.map((hw) => {
                  const expired = isExpired(hw.due_date);
                  const dateObj = new Date(hw.due_date);
                  
                  return (
                    <div key={hw.id} className={`border rounded-lg p-4 transition-all ${expired ? 'bg-gray-50 border-gray-200 opacity-80' : 'bg-white border-gray-200 hover:border-emerald-300 hover:shadow-sm'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mb-1 ${expired ? 'bg-gray-200 text-gray-700' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                            {hw.subject_name} ({hw.class_name})
                          </span>
                          <h3 className="text-base font-semibold text-gray-900">{hw.title}</h3>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${expired ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                          {expired ? 'Expiré' : 'Actif'}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500 mt-3 gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {expired ? 'Clos le ' : 'À rendre le '} 
                          {dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </div>
                        {hw.attachment_url && (
                          <div className="flex items-center gap-1">
                            <a href={hw.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-emerald-600 hover:underline">
                              <FileText className="w-4 h-4" />
                              Pièce jointe
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
