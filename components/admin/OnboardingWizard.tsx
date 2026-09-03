'use client'

import { PlusSquare, UserPlus, Users, CheckCircle2, ChevronRight, X, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type OnboardingWizardProps = {
  classesCount: number
  staffCount: number
  studentCount: number
}

export function OnboardingWizard({ classesCount, staffCount, studentCount }: OnboardingWizardProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
  
  if (completedSteps === steps.length || !isVisible || !mounted) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden bg-[#0a101f] rounded-3xl p-6 sm:p-8 text-white shadow-2xl mb-8 border border-white/10"
      >
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[50%] -right-[10%] w-[70%] h-[200%] bg-[var(--color-primary)]/20 blur-[120px] rounded-full mix-blend-screen"></div>
          <div className="absolute bottom-[0%] -left-[20%] w-[50%] h-[150%] bg-emerald-500/20 blur-[120px] rounded-full mix-blend-screen"></div>
        </div>
        
        {/* Glass Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>

        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white backdrop-blur-sm transition-all z-20"
          title="Masquer l'assistant"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          
          {/* Left Side: Welcome Text & Progress */}
          <div className="max-w-md w-full shrink-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-emerald-300 tracking-wide uppercase mb-4 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              Démarrage rapide
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black mb-3 tracking-tight leading-tight">
              Bienvenue sur <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Scogestia</span>
            </h2>
            
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8 max-w-sm">
              Votre espace est prêt. Suivez ces 3 étapes simples pour propulser la gestion de votre établissement.
            </p>

            <div className="space-y-3">
              <div className="flex justify-between items-end text-sm font-medium">
                <span className="text-slate-300">Progression globale</span>
                <span className="text-xl font-bold text-white">{progress}%</span>
              </div>
              <div className="w-full bg-white/5 border border-white/5 rounded-full h-3 overflow-hidden backdrop-blur-sm relative p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full relative overflow-hidden" 
                >
                   {/* Shimmer effect inside progress bar */}
                   <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Right Side: Interactive Steps */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map((step, idx) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + (idx * 0.1) }}
              >
                <Link 
                  href={step.href}
                  className={`block h-full bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/[0.06] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden ${step.isComplete ? 'opacity-50 grayscale hover:grayscale-0' : 'shadow-[0_0_30px_-15px_rgba(52,211,153,0.3)] hover:shadow-[0_0_40px_-10px_rgba(52,211,153,0.4)] hover:border-emerald-500/30'}`}
                >
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${step.isComplete ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white group-hover:bg-[var(--color-primary)] group-hover:text-white'}`}>
                      {step.icon}
                    </div>
                    {step.isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-white/20 group-hover:border-white/50 transition-colors"></div>
                    )}
                  </div>
                  
                  <h3 className={`font-bold mb-2 text-sm sm:text-base leading-tight relative z-10 ${step.isComplete ? 'line-through text-slate-400' : 'text-white'}`}>
                    {step.title}
                  </h3>
                  
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 relative z-10">
                    {step.description}
                  </p>
                  
                  {!step.isComplete && (
                    <div className="flex items-center text-xs font-bold text-cyan-400 group-hover:text-emerald-300 transition-colors mt-auto relative z-10">
                      Commencer 
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}

                  {/* Hover gradient effect inside card */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </Link>
              </motion.div>
            ))}
          </div>
          
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
