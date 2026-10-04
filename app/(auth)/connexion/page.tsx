'use client'

import { useActionState, useState } from 'react'
import { loginStaff } from '@/app/actions/auth'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Mail, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight, Loader2,
  GraduationCap, Wallet, BellRing, BarChart3,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const features = [
  { icon: GraduationCap, title: 'Notes & bulletins', text: 'Saisie rapide, bulletins PDF en un clic' },
  { icon: Wallet, title: 'Finance maîtrisée', text: 'Frais, échéances et Mobile Money' },
  { icon: BellRing, title: 'Parents connectés', text: 'Notifications et suivi en temps réel' },
  { icon: BarChart3, title: 'Pilotage clair', text: 'Tableaux de bord pour la direction' },
]

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginStaff, null)
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) setGoogleLoading(false)
  }

  return (
    <main className="flex min-h-screen bg-slate-50 font-sans">
      {/* ── Panneau de marque ── */}
      <aside className="relative hidden lg:flex lg:w-[46%] xl:w-5/12 flex-col justify-between overflow-hidden bg-[#070b14] p-12 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-32 h-[34rem] w-[34rem] rounded-full bg-emerald-500/25 blur-[130px]" />
          <div className="absolute bottom-0 -right-32 h-[32rem] w-[32rem] rounded-full bg-violet-600/25 blur-[130px]" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)',
              backgroundSize: '44px 44px',
              maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            }}
          />
        </div>

        <Link href="/" className="relative z-10 inline-flex items-center gap-3 w-fit group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-scogestia-transparent.png" alt="Scogestia" className="h-12 w-auto object-contain transition-transform duration-500 group-hover:scale-105" />
        </Link>

        <div className="relative z-10 max-w-lg">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Plateforme de gestion scolaire
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08 }}
            className="text-4xl xl:text-5xl font-bold leading-[1.1] tracking-tight"
          >
            Pilotez votre école,
            <span className="block bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
              sans friction.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-5 text-base leading-relaxed text-slate-300"
          >
            Élèves, notes, finances et communication réunis dans un seul espace, simple et sécurisé.
          </motion.p>

          <ul className="mt-10 grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, title, text }, i) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md transition-colors hover:bg-white/[0.08]"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs leading-snug text-slate-400">{text}</p>
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-slate-500">© {new Date().getFullYear()} Scogestia</p>
      </aside>

      {/* ── Formulaire ── */}
      <section className="relative flex w-full flex-col px-5 py-8 sm:px-12 lg:w-[54%] xl:w-7/12">
        <div className="mb-8 flex justify-center lg:hidden">
          <Link href="/" className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Scogestia" src="/logo-scogestia-transparent.png" className="h-10 object-contain" />
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Bon retour 👋</h2>
            <p className="mt-2 text-slate-500">Connectez-vous pour accéder à votre espace Scogestia.</p>
          </motion.div>

          <form action={formAction} className="mt-8 space-y-5 rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.18)] sm:p-8">
            {state?.error && (
              <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">{state.error}</p>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="identifier">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="exemple@ecole.tg"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3.5 pl-12 pr-4 text-sm font-medium outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
                  Mot de passe
                </label>
                <Link href="/mot-de-passe-oublie" className="text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-500">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3.5 pl-12 pr-12 text-sm font-medium outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3.5 text-sm font-bold text-white shadow-[0_10px_30px_-10px_rgba(5,150,105,0.7)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-10px_rgba(5,150,105,0.8)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Connexion en cours…
                </>
              ) : (
                <>
                  Se connecter <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">ou</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99] disabled:opacity-70"
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Continuer avec Google
            </button>
          </form>

          <div className="mt-8 space-y-2 text-center text-sm text-slate-600">
            <p>
              Pas encore de compte école ?{' '}
              <Link className="font-semibold text-emerald-600 hover:text-emerald-500" href="/inscription-ecole">
                Inscrire une école
              </Link>
            </p>
            <p>
              Parent avec un code d&apos;invitation ?{' '}
              <Link className="font-semibold text-emerald-600 hover:text-emerald-500" href="/activer-parent">
                Activer mon compte
              </Link>
            </p>
          </div>
        </div>

        <footer className="mx-auto mt-10 w-full max-w-md">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-emerald-900">
            <div className="shrink-0 rounded-full bg-emerald-100 p-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="leading-relaxed">
              <span className="font-bold">Connexion sécurisée.</span> Vos données et celles de votre école sont chiffrées et protégées.
            </p>
          </div>
          <nav className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-slate-500">
            <Link href="/confidentialite" className="hover:text-emerald-600">Confidentialité</Link>
            <Link href="/conditions-utilisation" className="hover:text-emerald-600">Conditions d&apos;utilisation</Link>
            <Link href="/mentions-legales" className="hover:text-emerald-600">Mentions légales</Link>
          </nav>
        </footer>
      </section>
    </main>
  )
}
