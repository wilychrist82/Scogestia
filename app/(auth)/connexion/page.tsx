'use client'

import { useActionState, useState } from 'react'
import { loginStaff } from '@/app/actions/auth'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Users, BarChart3, Smartphone } from 'lucide-react'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginStaff, null);
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
               {/* Simili-logo "Blason" */}
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
            La solution complète pour gérer votre école efficacement, de manière simple et sécurisée.
          </p>

          <div className="space-y-8 w-full">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-full bg-emerald-800/50 flex items-center justify-center shrink-0 border border-emerald-600/30">
                <Users className="w-6 h-6 text-emerald-100" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Gestion complète</h3>
                <p className="text-sm text-emerald-100/70">Élèves, classes, personnel, notes, présences et plus.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-full bg-emerald-800/50 flex items-center justify-center shrink-0 border border-emerald-600/30">
                <BarChart3 className="w-6 h-6 text-emerald-100" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Suivi financier clair</h3>
                <p className="text-sm text-emerald-100/70">Échéances, paiements, rapports et relances.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-full bg-emerald-800/50 flex items-center justify-center shrink-0 border border-emerald-600/30">
                <ShieldCheck className="w-6 h-6 text-emerald-100" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Sécurisé et fiable</h3>
                <p className="text-sm text-emerald-100/70">Vos données sont protégées 24h/24 et 7j/7.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-full bg-emerald-800/50 flex items-center justify-center shrink-0 border border-emerald-600/30">
                <Smartphone className="w-6 h-6 text-emerald-100" />
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">Accessible partout</h3>
                <p className="text-sm text-emerald-100/70">Utilisez Scogestia depuis votre ordinateur ou mobile.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-emerald-700/50 w-full text-center">
             <img src="/logo.png" alt="Ecole" className="h-20 opacity-30 mx-auto" />
          </div>
        </div>
      </div>

      {/* Colonne de droite - Formulaire */}
      <div className="w-full lg:w-7/12 flex flex-col justify-between p-6 sm:p-12 relative bg-slate-50">
        
        {/* En-tête Langue */}
        <div className="flex justify-end w-full mb-8">
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-600 font-medium hover:bg-slate-50 transition-colors">
              <span className="text-lg">🌐</span> Français
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
           </button>
        </div>

        {/* Logo sur mobile uniquement */}
        <div className="flex justify-center mb-8 lg:hidden">
          <Link href="/">
             <div className="flex items-center gap-2">
               <img alt="Scogestia Logo" src="/logo.png" className="h-10 object-contain" />
               <span className="text-xl font-bold text-slate-800">Scogestia</span>
             </div>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center mb-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Connexion à votre compte</h2>
            <p className="mt-4 text-slate-500">
              Veuillez saisir vos identifiants pour accéder<br/>à votre espace Scogestia.
            </p>
          </div>

          <form action={formAction} className="space-y-6">
            {state?.error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-md">
                <p className="text-sm text-red-600 font-medium text-center">
                  {state.error}
                </p>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="identifier">
                  Adresse email
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#006039] focus:border-[#006039] sm:text-sm transition-colors outline-none" 
                    id="identifier" 
                    name="identifier" 
                    placeholder="exemple@ecole.tg" 
                    required 
                    type="text"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">
                  Mot de passe
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    className="block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#006039] focus:border-[#006039] sm:text-sm transition-colors outline-none" 
                    id="password" 
                    name="password" 
                    placeholder="Votre mot de passe" 
                    required 
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
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
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#006039] focus:ring-[#006039] border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-sm">
                <Link href="#" className="font-medium text-[#006039] hover:text-[#004d2e]">
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <button 
              disabled={isPending}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#006039] hover:bg-[#004d2e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#006039] transition-colors disabled:opacity-70 disabled:cursor-not-allowed" 
              type="submit"
            >
              {isPending ? 'Connexion en cours...' : (
                 <span className="flex items-center gap-2">
                   <Lock className="w-4 h-4" /> Se connecter
                 </span>
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-50 text-slate-500">ou</span>
              </div>
            </div>

            <button 
              type="button"
              className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-slate-300 rounded-md shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Se connecter avec Google
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600">
              Vous n'avez pas de compte ?{' '}
              <Link className="font-semibold text-[#006039] hover:text-[#004d2e] transition-colors" href="/inscription-ecole">
                Inscrire une école
              </Link>
            </p>
          </div>
        </div>

        {/* Pied de page et Réassurance */}
        <div className="w-full max-w-lg mx-auto">
           <div className="text-center text-xs text-slate-500 mb-6">
              © {new Date().getFullYear()} Scogestia. Tous droits réservés.<br/>
              <div className="flex justify-center gap-3 mt-2">
                 <Link href="#" className="hover:text-[#006039]">Confidentialité</Link>
                 <span>•</span>
                 <Link href="#" className="hover:text-[#006039]">Conditions d'utilisation</Link>
                 <span>•</span>
                 <Link href="#" className="hover:text-[#006039]">Aide</Link>
              </div>
           </div>

           <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4 text-xs text-emerald-800">
              <div className="flex items-center gap-3 flex-1">
                 <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                 <p>Scogestia est conçu pour protéger les données de votre école et garantir la confidentialité de vos informations.</p>
              </div>
              <div className="flex items-center gap-2 sm:border-l border-emerald-200 sm:pl-4">
                 <Lock className="w-5 h-5 text-emerald-600 shrink-0" />
                 <div>
                    <p className="font-semibold">Connexion sécurisée</p>
                    <p className="opacity-80">SSL encrypté</p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </main>
  );
}
