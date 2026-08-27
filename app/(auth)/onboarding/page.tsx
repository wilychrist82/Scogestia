'use client'

import { useActionState, useEffect, useState } from 'react'
import { completeOnboarding } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'
import { Building, MapPin, User, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const [state, formAction, isPending] = useActionState(completeOnboarding, null)
  const supabase = createClient()
  const router = useRouter()
  
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/connexion')
        return
      }
      if (user.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name)
      } else if (user.user_metadata?.name) {
        setUserName(user.user_metadata.name)
      }
      setLoading(false)
    }
    fetchUser()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/connexion')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-[#006039] border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <main className="flex min-h-screen bg-slate-50 items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-[#006039] p-8 text-white text-center relative">
          <button 
            onClick={handleLogout}
            className="absolute top-4 right-4 text-emerald-200 hover:text-white transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold mb-2">Dernière étape !</h1>
          <p className="text-emerald-100">Complétez les informations de votre école pour finaliser votre inscription Google.</p>
        </div>
        
        <div className="p-8">
          <form action={formAction} className="space-y-5">
            {state?.error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-md text-sm text-red-600 font-medium text-center mb-6">
                {state.error}
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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="adminName">
                Votre nom (Directeur)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#006039] focus:border-[#006039] sm:text-sm transition-colors outline-none bg-slate-50" 
                  id="adminName" 
                  name="adminName" 
                  defaultValue={userName}
                  placeholder="Jean Dupont" 
                  required 
                  type="text"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Prérempli depuis votre compte Google.</p>
            </div>

            <button 
              disabled={isPending}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#006039] hover:bg-[#004d2e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#006039] transition-colors disabled:opacity-70 mt-8" 
              type="submit"
            >
              {isPending ? 'Finalisation...' : 'Terminer mon inscription'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
