'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { activateStaffAccount } from '@/app/actions/staff'

export default function ActiverPersonnelForm({ initialCode }: { initialCode: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [identifier, setIdentifier] = useState('')
  const [code, setCode] = useState(initialCode)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    const formData = new FormData()
    formData.append('identifier', identifier)
    formData.append('code', code)
    formData.append('password', password)

    startTransition(async () => {
      const result = await activateStaffAccount(null, formData)
      
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        // Rediriger vers l'accueil (qui redirigera vers l'espace approprié selon le rôle)
        router.push('/')
        router.refresh()
      }
    })
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-[#fce8e6] text-[#c5221f] p-4 rounded-lg text-sm font-medium border border-[#fad2cf]">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
            Code d'invitation (6 caractères)
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:z-10 sm:text-sm uppercase font-mono tracking-widest mt-1"
            placeholder="EX: A1B2C3"
            maxLength={6}
          />
        </div>
        <div>
          <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
            Email ou Téléphone (fourni par l'administration)
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:z-10 sm:text-sm mt-1"
            placeholder="jean@ecole.com ou +22890000000"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Choisissez un mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:z-10 sm:text-sm mt-1"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-[#1a73e8] focus:border-[#1a73e8] focus:z-10 sm:text-sm mt-1"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-[#1a73e8] hover:bg-[#1557b0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a73e8] transition-colors disabled:opacity-50"
        >
          {isPending ? 'Activation en cours...' : 'Activer mon compte'}
        </button>
      </div>
    </form>
  )
}
