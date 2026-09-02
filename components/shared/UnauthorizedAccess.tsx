import Link from 'next/link'
import { Lock } from 'lucide-react'

type Props = {
  role: 'parent' | 'enseignant'
}

export function UnauthorizedAccess({ role }: Props) {
  const roleName = role === 'parent' ? 'parents d\'élèves' : 'enseignants'
  const title = role === 'parent' ? 'Espace Parent' : 'Espace Enseignant'

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center border border-slate-100">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Lock size={32} strokeWidth={2.5} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-3">Accès Restreint</h2>
        <p className="text-slate-600 mb-8 leading-relaxed text-lg">
          Cet espace est exclusivement réservé aux <strong>{roleName}</strong>. 
          <br /><br />
          Votre compte actuel ne possède pas ce rôle. Si vous souhaitez tester cet espace, veuillez vous connecter avec un compte approprié.
        </p>
        <Link href="/admin" className="inline-flex items-center justify-center w-full py-4 px-6 rounded-xl bg-[#006039] font-bold text-white hover:bg-[#004d2e] transition-colors shadow-md">
          Retourner au tableau de bord
        </Link>
      </div>
    </div>
  )
}
