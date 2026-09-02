'use client'

import { useActionState } from 'react'
import { requestPasswordReset } from '@/app/actions/auth'
import Link from 'next/link'
import { Mail, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, null);

  return (
    <main className="flex min-h-screen bg-slate-50 overflow-hidden font-sans">
      <div className="w-full flex flex-col justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center mb-12">
          
          <Link href="/connexion" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors mb-8 w-fit">
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </Link>

          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Mot de passe oublié ?</h2>
            <p className="mt-3 text-slate-500 font-medium leading-relaxed">
              Saisissez votre adresse email d'administrateur. Nous vous enverrons un lien pour réinitialiser votre mot de passe. 
              <br /><br />
              <span className="text-sm">
                <strong>Note :</strong> Si vous êtes enseignant ou parent, veuillez contacter directement l'administration de votre école.
              </span>
            </p>
          </div>

          {state?.success ? (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-emerald-800 shadow-sm text-center">
              <div className="mx-auto bg-emerald-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">Lien envoyé !</h3>
              <p className="text-sm font-medium opacity-90">
                Si un compte correspond à cette adresse, vous recevrez un email contenant les instructions pour réinitialiser votre mot de passe.
              </p>
            </div>
          ) : (
            <form action={formAction} className="space-y-5">
              {state?.error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-600 shadow-sm animate-pulse">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">
                    {state.error}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5" htmlFor="email">
                  Adresse email
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    className="block w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 sm:text-sm transition-all outline-none bg-white hover:border-slate-300 font-medium" 
                    id="email" 
                    name="email" 
                    placeholder="admin@ecole.tg" 
                    required 
                    type="email"
                    autoComplete="email"
                  />
                </div>
              </div>

              <button 
                disabled={isPending}
                className="w-full flex justify-center py-4 px-4 mt-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(5,150,105,0.2)] hover:shadow-[0_0_30px_rgba(5,150,105,0.3)] text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none" 
                type="submit"
              >
                {isPending ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
