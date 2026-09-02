'use client'

import { useActionState, useState } from 'react'
import { loginStaff } from '@/app/actions/auth'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ChevronDown, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginStaff, null);
  const [showPassword, setShowPassword] = useState(false);
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      }
    });
  };

  return (
    <main className="flex min-h-screen bg-white overflow-hidden font-sans">
      {/* Colonne de gauche - Premium SaaS Theme (caché sur mobile) */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-violet-950 via-slate-900 to-[#006039] text-white p-12 flex-col justify-center items-center relative overflow-hidden">
        {/* Abstract background glows */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[80%] h-[80%] bg-violet-600/20 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[10%] -left-[10%] w-[60%] h-[60%] bg-emerald-500/20 blur-[100px] rounded-full"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          <Link href="/" className="inline-flex flex-col items-center mb-10 group">
            <div className="mb-6 group-hover:scale-105 transition-transform duration-500">
              <img src="/logo-scogestia-transparent.png" alt="Scogestia Logo" className="h-20 sm:h-24 w-auto object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]" />
            </div>
            <p className="text-emerald-300/80 font-medium tracking-widest text-[10px] uppercase text-center pb-4">
              La gestion scolaire simplifiée
            </p>
          </Link>

          <p className="text-xl text-white/90 mb-12 leading-relaxed text-center font-medium">
            La solution complète pour gérer votre école efficacement, de manière simple et sécurisée.
          </p>

          <div className="w-full relative flex justify-center mt-4 group cursor-default">
             <img src="/image_landing_page1.png" alt="Scogestia Interface" className="w-full sm:w-[110%] h-auto object-contain rounded-b-2xl transform transition-transform duration-1000 ease-out group-hover:scale-105 group-hover:-translate-y-2 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />
          </div>
        </div>
      </div>

      {/* Colonne de droite - Formulaire Premium */}
      <div className="w-full lg:w-7/12 flex flex-col justify-between p-6 sm:p-12 relative bg-slate-50">
        
        {/* En-tête Langue */}
        <div className="flex justify-end w-full mb-8">
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-600 font-medium hover:bg-slate-50 transition-colors shadow-sm">
              <span className="text-lg">🌐</span> Français
              <ChevronDown className="w-4 h-4 ml-1" />
           </button>
        </div>

        {/* Logo sur mobile uniquement */}
        <div className="flex justify-center mb-10 lg:hidden">
          <Link href="/">
             <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100">
               <img alt="Scogestia Logo" src="/logo-scogestia-transparent.png" className="h-10 object-contain" />
             </div>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center mb-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Bon retour parmi nous</h2>
            <p className="mt-3 text-slate-500 font-medium">
              Saisissez vos identifiants pour accéder à votre espace Scogestia.
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
                <label className="block text-sm font-bold text-slate-700 mb-1.5" htmlFor="identifier">
                  Adresse email
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    className="block w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 sm:text-sm transition-all outline-none bg-white hover:border-slate-300 font-medium" 
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
                <label className="block text-sm font-bold text-slate-700 mb-1.5" htmlFor="password">
                  Mot de passe
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
                    autoComplete="current-password"
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
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center group cursor-pointer">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer transition-colors"
                />
                <label htmlFor="remember-me" className="ml-2.5 block text-sm font-medium text-slate-600 group-hover:text-slate-900 cursor-pointer transition-colors">
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-sm">
                <button 
                  type="button" 
                  onClick={() => alert("Veuillez contacter l'administrateur de votre établissement pour réinitialiser votre mot de passe.")} 
                  className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </div>

            <button 
              disabled={isPending}
              className="w-full flex justify-center py-4 px-4 mt-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(5,150,105,0.2)] hover:shadow-[0_0_30px_rgba(5,150,105,0.3)] text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none" 
              type="submit"
            >
              {isPending ? 'Connexion en cours...' : (
                 <span className="flex items-center gap-2">
                   Se connecter
                 </span>
              )}
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-50 text-slate-400 font-medium tracking-wide">OU</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex justify-center items-center gap-3 py-3.5 px-4 border border-slate-200 rounded-xl shadow-sm bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
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

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-600 font-medium">
              Vous n'avez pas de compte ?{' '}
              <Link className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors ml-1" href="/inscription-ecole">
                Inscrire une école
              </Link>
            </p>
          </div>
        </div>

        {/* Pied de page et Réassurance */}
        <div className="w-full max-w-lg mx-auto mt-auto pt-6 border-t border-slate-200/60">
           <div className="text-center text-xs font-medium text-slate-500 mb-6">
              © {new Date().getFullYear()} Scogestia. Tous droits réservés.<br/>
              <div className="flex justify-center gap-4 mt-3 flex-wrap px-4">
                 <Link href="/confidentialite" className="hover:text-emerald-600 transition-colors">Confidentialité</Link>
                 <Link href="/conditions-utilisation" className="hover:text-emerald-600 transition-colors">Conditions d'utilisation</Link>
                 <Link href="/mentions-legales" className="hover:text-emerald-600 transition-colors">Mentions légales</Link>
              </div>
           </div>

           <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4 text-xs text-emerald-800 shadow-sm">
              <div className="flex items-center gap-3 flex-1">
                 <div className="p-2 bg-emerald-100 rounded-full shrink-0">
                   <ShieldCheck className="w-5 h-5 text-emerald-600" />
                 </div>
                 <p className="font-medium leading-relaxed">Scogestia protège les données de votre école et garantit la confidentialité de vos informations.</p>
              </div>
              <div className="flex items-center gap-3 sm:border-l border-emerald-200 sm:pl-5">
                 <div className="p-2 bg-emerald-100 rounded-full shrink-0">
                   <Lock className="w-4 h-4 text-emerald-600" />
                 </div>
                 <div>
                    <p className="font-bold text-emerald-900">Connexion sécurisée</p>
                    <p className="text-emerald-700/80 mt-0.5">SSL encrypté</p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </main>
  );
}
