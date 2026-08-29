'use client'

import { PlusSquare, UserPlus, Users, CheckCircle2, ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

type OnboardingWizardProps = {
  classesCount: number
  staffCount: number
  studentCount: number
}

export function OnboardingWizard({ classesCount, staffCount, studentCount }: OnboardingWizardProps) {
  const [isVisible, setIsVisible] = useState(true)

  const steps = [
    {
      id: 1,
      title: "Créer votre première classe",
      description: "Commencez par configurer la structure de votre école.",
      isComplete: classesCount > 0,
      href: "/admin/classes",
      icon: <PlusSquare className="w-5 h-5" />
    },
    {
      id: 2,
      title: "Inviter du personnel",
      description: "Ajoutez un enseignant ou un comptable à votre équipe.",
      isComplete: staffCount > 1, // > 1 car l'admin compte déjà
      href: "/admin/personnel",
      icon: <UserPlus className="w-5 h-5" />
    },
    {
      id: 3,
      title: "Ajouter un élève",
      description: "Inscrivez votre premier élève dans une classe.",
      isComplete: studentCount > 0,
      href: "/admin/eleves/nouveau",
      icon: <Users className="w-5 h-5" />
    }
  ]

  const completedSteps = steps.filter(s => s.isComplete).length
  const progress = Math.round((completedSteps / steps.length) * 100)
  
  if (completedSteps === steps.length || !isVisible) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-[#006039] to-[#004d2e] rounded-xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden mb-6">
      {/* Decorative background circle */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute top-4 right-4 text-emerald-200 hover:text-white transition-colors"
        title="Masquer l'assistant"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="max-w-3xl relative z-10">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Bienvenue sur Scogestia ! 👋</h2>
        <p className="text-emerald-100 text-sm sm:text-base mb-6">
          Votre espace est prêt. Suivez ces 3 étapes rapides pour commencer à utiliser votre plateforme.
        </p>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center text-sm font-medium text-emerald-100 mb-2">
            <span>Progression</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-black/20 rounded-full h-2.5">
            <div 
              className="bg-emerald-400 h-2.5 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {steps.map((step) => (
            <Link 
              key={step.id} 
              href={step.href}
              className={`block bg-white/10 border border-white/20 rounded-lg p-4 hover:bg-white/20 transition-colors group relative overflow-hidden ${step.isComplete ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${step.isComplete ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/20 text-white'}`}>
                  {step.icon}
                </div>
                {step.isComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <span className="w-5 h-5 flex items-center justify-center rounded-full border-2 border-emerald-200/50 text-xs text-transparent group-hover:text-white transition-colors"></span>
                )}
              </div>
              <h3 className={`font-semibold mb-1 text-sm sm:text-base ${step.isComplete ? 'line-through text-emerald-200' : 'text-white'}`}>
                {step.title}
              </h3>
              <p className="text-xs text-emerald-100 line-clamp-2 mb-4">
                {step.description}
              </p>
              
              {!step.isComplete && (
                <div className="flex items-center text-xs font-semibold text-emerald-300 group-hover:text-white transition-colors mt-auto">
                  Commencer <ChevronRight className="w-3 h-3 ml-1" />
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
