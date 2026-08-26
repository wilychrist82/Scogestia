import { AlertTriangle, ShieldX } from 'lucide-react'
import Link from 'next/link'

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
          <ShieldX className="w-10 h-10 text-red-600" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Accès Suspendu</h1>
          <p className="text-gray-500">
            L'abonnement de votre établissement à la plateforme Scogestia a été suspendu ou est arrivé à expiration.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 text-left flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>
            Veuillez contacter la direction de votre établissement scolaire pour régulariser la situation avec Scogestia.
          </p>
        </div>

        <div className="pt-4">
          <Link 
            href="/connexion" 
            className="text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            Retourner à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
