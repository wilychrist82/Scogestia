'use client'

import { useActionState, useState } from 'react'
import { registerSchool } from '@/app/actions/auth'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Users, BarChart3, Smartphone, Building, User, MapPin } from 'lucide-react'

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerSchool, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="flex min-h-screen bg-white overflow-hidden font-sans">
      {/* Colonne de gauche - Vert Émeraude (caché sur mobile) */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#006039] text-white p-12 flex-col justify-center items-center relative overflow-hidden">
        {/* Motif de fond subtil */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        
        <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          <Link href="/" className="inline-flex flex-col items-center mb-12">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-4 p-4 border border-white/20">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 text-white">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L3 7l9 5 9-5-9-5zM3 14l9 5 9-5M3 19l9 5 9-5" />
               </svg>
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Scogestia</h1>
            <p className="text-emerald-300 font-medium tracking-widest text-xs uppercase text-center border-b border-emerald-500/30 pb-4">
              La gestion scolaire simplifiée
            </p>
          </Link>

          <p className="text-lg text-emerald-50 mb-10 leading-relaxed text-center sm:text-left">
            Rejoignez des centaines d'écoles qui gèrent déjà leur établissement plus efficacement.
          </p>

          <div className="space-y-8 w-full">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-full bg-emerald-800/50 flex items-center justify-center shrink-0 border border-emerald-600/30">
                <Users className="w-6 h-6 text-emerald-100" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Mise en place en 2 minutes</h3>
                <p className="text-sm text-emerald-100/70">Aucune installation requise, commencez immédiatement.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-full bg-emerald-800/50 flex items-center justify-center shrink-0 border border-emerald-600/30">
                <BarChart3 className="w-6 h-6 text-emerald-100" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">14 Jours Gratuits</h3>
                <p className="text-sm text-emerald-100/70">Testez toutes les fonctionnalités sans engagement ni carte.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-full bg-emerald-800/50 flex items-center justify-center shrink-0 border border-emerald-600/30">
                <ShieldCheck className="w-6 h-6 text-emerald-100" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Sécurité garantie</h3>
                <p className="text-sm text-emerald-100/70">Données isolées et sauvegardes automatiques quotidiennes.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Colonne de droite - Formulaire */}
      <div className="w-full lg:w-7/12 flex flex-col justify-between p-6 sm:p-12 relative bg-slate-50 overflow-y-auto">
        
        {/* En-tête Langue */}
        <div className="flex justify-end w-full mb-8 shrink-0">
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-600 font-medium hover:bg-slate-50 transition-colors">
              <span className="text-lg">🌐</span> Français
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
           </button>
        </div>

        {/* Logo sur mobile uniquement */}
        <div className="flex justify-center mb-8 lg:hidden shrink-0">
          <Link href="/">
             <div className="flex items-center gap-2">
               <img alt="Scogestia Logo" src="/logo.png" className="h-10 object-contain" />
               <span className="text-xl font-bold text-slate-800">Scogestia</span>
             </div>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center mb-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Créer votre école</h2>
            <p className="mt-4 text-slate-500">
              Démarrez votre essai gratuit de 14 jours.<br/>Aucune carte bancaire requise.
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            {state?.error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-md">
                <p className="text-sm text-red-600 font-medium text-center">
                  {state.error}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="schoolName">
                Nom de l'établissement
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#006039] focus:border-[#006039] sm:text-sm transition-colors outline-none" 
                  id="schoolName" 
                  name="schoolName" 
                  placeholder="Ex: Complexe Scolaire La Réussite" 
                  required 
                  type="text"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="adminName">
                  Votre nom (Directeur)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#006039] focus:border-[#006039] sm:text-sm transition-colors outline-none" 
                    id="adminName" 
                    name="adminName" 
                    placeholder="Jean Dupont" 
                    required 
                    type="text"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="city">
                  Ville / Quartier
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#006039] focus:border-[#006039] sm:text-sm transition-colors outline-none" 
                    id="city" 
                    name="city" 
                    placeholder="Lomé, Agoè" 
                    required 
                    type="text"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
                Adresse email
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#006039] focus:border-[#006039] sm:text-sm transition-colors outline-none" 
                  id="email" 
                  name="email" 
                  placeholder="direction@ecole.com" 
                  required 
                  type="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">
                Mot de passe sécurisé
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  className="block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#006039] focus:border-[#006039] sm:text-sm transition-colors outline-none" 
                  id="password" 
                  name="password" 
                  placeholder="Min. 8 caractères" 
                  required 
                  type={showPassword ? "text" : "password"}
                  minLength={8}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button 
              disabled={isPending}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#006039] hover:bg-[#004d2e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#006039] transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-8" 
              type="submit"
            >
              {isPending ? 'Création de votre école...' : (
                 <span className="flex items-center gap-2">
                   Lancer mon essai gratuit
                 </span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600">
              Vous avez déjà un compte ?{' '}
              <Link className="font-semibold text-[#006039] hover:text-[#004d2e] transition-colors" href="/connexion">
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        {/* Pied de page et Réassurance */}
        <div className="w-full max-w-lg mx-auto shrink-0 mt-8">
           <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4 flex items-center justify-center gap-4 text-xs text-emerald-800">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <p>En vous inscrivant, vous acceptez nos <Link href="#" className="underline">Conditions d'utilisation</Link> et notre <Link href="#" className="underline">Politique de confidentialité</Link>.</p>
           </div>
        </div>

      </div>
    </main>
  );
}
