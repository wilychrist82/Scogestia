'use client'

import { useActionState } from 'react'
import { updatePassword } from '@/app/actions/auth'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useState } from 'react'

export default function UpdatePasswordPage() {
  const [state, formAction, isPending] = useActionState(updatePassword, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <main className="flex min-h-screen bg-slate-50 overflow-hidden font-sans">
      <div className="w-full flex flex-col justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center mb-12">
          
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Nouveau mot de passe</h2>
            <p className="mt-3 text-slate-500 font-medium leading-relaxed">
              Veuillez définir votre nouveau mot de passe.
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            {state?.error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-600 shadow-sm animate-pulse">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">
                  {state.error}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5" htmlFor="password">
                  Nouveau mot de passe
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    className="block w-full pl-11 pr-11 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 sm:text-sm transition-all outline-none bg-white hover:border-slate-300 font-medium" 
                    id="password" 
                    name="password" 
                    placeholder="••••••••" 
                    required 
                    type={showPassword ? "text" : "password"}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-emerald-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5" htmlFor="confirmPassword">
                  Confirmez le mot de passe
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    className="block w-full pl-11 pr-11 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 sm:text-sm transition-all outline-none bg-white hover:border-slate-300 font-medium" 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    placeholder="••••••••" 
                    required 
                    type={showConfirmPassword ? "text" : "password"}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-emerald-600 focus:outline-none transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              disabled={isPending}
              className="w-full flex justify-center py-4 px-4 mt-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(5,150,105,0.2)] hover:shadow-[0_0_30px_rgba(5,150,105,0.3)] text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none" 
              type="submit"
            >
              {isPending ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
