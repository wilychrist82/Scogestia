'use client'

import { useActionState, useState } from 'react'
import { registerSchool } from '@/app/actions/auth'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Building2, MapPin, UserCircle } from 'lucide-react'

export default function RegisterSchoolPage() {
  const [state, formAction, isPending] = useActionState(registerSchool, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="flex min-h-screen bg-gray-50 overflow-hidden">
      {/* Colonne de gauche - Image/Gradient (caché sur mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white p-12 flex-col justify-between items-start overflow-hidden">
        {/* Cercles décoratifs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="relative z-10">
          <Link href="/" className="inline-block">
            <img 
              alt="Scogestia Logo" 
              src="/logo.png" 
              className="h-16 object-contain drop-shadow-lg"
            />
          </Link>
        </div>

        <div className="relative z-10 max-w-lg mb-20">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-sm font-medium mb-6">
            <Building2 className="w-4 h-4 mr-2 text-emerald-400" />
            Création d'établissement
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Digitalisez votre école en <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              quelques minutes
            </span>.
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed">
            Rejoignez Scogestia et offrez à votre personnel, vos enseignants et vos parents un outil de gestion moderne, rapide et intuitif.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-slate-400">
          <p>© {new Date().getFullYear()} Scogestia. Tous droits réservés.</p>
        </div>
      </div>

      {/* Colonne de droite - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white relative overflow-y-auto">
        {/* Logo sur mobile uniquement */}
        <div className="absolute top-8 left-8 lg:hidden">
          <img 
            alt="Scogestia Logo" 
            src="/logo.png" 
            className="h-12 object-contain"
          />
        </div>

        <div className="w-full max-w-md space-y-8 my-auto pt-16 lg:pt-0">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Inscrire une école</h2>
            <p className="mt-2 text-sm text-gray-500">
              Créez votre établissement et votre compte super-administrateur.
            </p>
          </div>

          <form action={formAction} className="mt-8 space-y-6">
            {state?.error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-in fade-in slide-in-from-top-2">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-medium">
                      {state.error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="schoolName">
                  Nom de l'établissement
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors bg-gray-50 focus:bg-white" 
                    id="schoolName" 
                    name="schoolName" 
                    placeholder="Ex: Lycée d'Excellence" 
                    required 
                    type="text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="city">
                  Ville
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors bg-gray-50 focus:bg-white" 
                    id="city" 
                    name="city" 
                    placeholder="Ex: Lomé" 
                    required 
                    type="text"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 mt-5">
                <label className="block text-sm font-medium text-gray-700" htmlFor="adminName">
                  Nom complet de l'administrateur
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCircle className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors bg-gray-50 focus:bg-white" 
                    id="adminName" 
                    name="adminName" 
                    placeholder="Ex: Jean Dupont" 
                    required 
                    type="text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                  Email administrateur
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors bg-gray-50 focus:bg-white" 
                    id="email" 
                    name="email" 
                    placeholder="direction@lycee.edu" 
                    required 
                    type="email"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                  Mot de passe
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors bg-gray-50 focus:bg-white" 
                    id="password" 
                    name="password" 
                    placeholder="••••••••" 
                    required 
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    aria-label="Afficher le mot de passe"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button 
              disabled={isPending}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden" 
              type="submit"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out"></div>
              <span className="relative flex items-center gap-2">
                {isPending ? 'Création de l\'école en cours...' : 'Inscrire l\'école'}
                {!isPending && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </span>
            </button>
          </form>

          <div className="pt-6 mt-6 border-t border-gray-100 text-center pb-8 lg:pb-0">
            <p className="text-sm text-gray-600">
              Vous avez déjà un compte ?{' '}
              <Link className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors" href="/connexion">
                Connectez-vous ici
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
