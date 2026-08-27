import Link from 'next/link'
import { ShieldCheck, Cloud, Zap, ArrowRight, CheckCircle2, ChevronRight, BarChart3, Users, LayoutDashboard, CreditCard } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Scogestia Logo" className="h-10 w-auto" />
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#" className="text-sm font-medium text-emerald-700 border-b-2 border-emerald-600 pb-1">Accueil</Link>
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Fonctionnalités</Link>
            <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Tarifs</Link>
            <Link href="#faq" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">FAQ</Link>
            <Link href="#contact" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/connexion" 
              className="hidden sm:inline-flex items-center justify-center h-10 px-6 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-full transition-colors"
            >
              Se connecter
            </Link>
            <Link 
              href="/inscription-ecole"
              className="inline-flex items-center justify-center h-10 px-6 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-full transition-all shadow-md hover:shadow-lg"
            >
              Créer mon école
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-slate-50 to-slate-50"></div>
          
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-6">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Le logiciel de gestion scolaire tout-en-un</span>
                </div>
                
                <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
                  Gérez votre école <span className="text-emerald-700">simplement</span>, du paiement des frais aux bulletins.
                </h1>
                
                <p className="text-lg text-slate-600 mb-10 max-w-xl leading-relaxed">
                  Scogestia est la solution 100% web qui aide les écoles à gagner du temps, à mieux organiser leur travail et à renforcer la confiance des parents.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <Link 
                    href="/inscription-ecole"
                    className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-8 text-base font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-full transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                  >
                    Essai gratuit de 14 jours
                  </Link>
                  <Link 
                    href="#features"
                    className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-8 text-base font-medium text-slate-700 bg-white border-2 border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 rounded-full transition-all"
                  >
                    Voir les fonctionnalités
                  </Link>
                </div>
                
                <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Aucune carte requise
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Installation immédiate
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Support 7j/7
                  </div>
                </div>
              </div>
              
              <div className="w-full lg:w-1/2 relative">
                <div className="relative rounded-2xl bg-slate-900/5 p-2 sm:p-4 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-2xl"></div>
                  {/* Dashboard Mockup - Abstract representation */}
                  <div className="relative bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden aspect-[4/3] flex flex-col">
                    {/* Header */}
                    <div className="h-12 border-b border-slate-100 flex items-center px-4 justify-between bg-slate-50/50">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                      </div>
                      <div className="h-6 w-32 bg-slate-200 rounded-md"></div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 flex p-4 gap-4 bg-slate-50/50">
                      {/* Sidebar */}
                      <div className="w-1/4 flex flex-col gap-3">
                        <div className="h-8 w-full bg-emerald-100 rounded-lg"></div>
                        <div className="h-8 w-full bg-slate-200 rounded-lg opacity-50"></div>
                        <div className="h-8 w-full bg-slate-200 rounded-lg opacity-50"></div>
                        <div className="h-8 w-full bg-slate-200 rounded-lg opacity-50"></div>
                      </div>
                      {/* Main */}
                      <div className="flex-1 flex flex-col gap-4">
                        <div className="flex gap-4">
                          <div className="flex-1 h-24 bg-white border border-slate-100 shadow-sm rounded-xl p-4 flex flex-col justify-between">
                            <div className="h-4 w-16 bg-slate-200 rounded"></div>
                            <div className="h-8 w-24 bg-emerald-600/20 rounded"></div>
                          </div>
                          <div className="flex-1 h-24 bg-white border border-slate-100 shadow-sm rounded-xl p-4 flex flex-col justify-between">
                            <div className="h-4 w-16 bg-slate-200 rounded"></div>
                            <div className="h-8 w-24 bg-amber-600/20 rounded"></div>
                          </div>
                          <div className="flex-1 h-24 bg-white border border-slate-100 shadow-sm rounded-xl p-4 flex flex-col justify-between">
                            <div className="h-4 w-16 bg-slate-200 rounded"></div>
                            <div className="h-8 w-24 bg-blue-600/20 rounded"></div>
                          </div>
                        </div>
                        <div className="flex-1 bg-white border border-slate-100 shadow-sm rounded-xl flex items-end p-4 gap-2">
                           {/* Chart bars */}
                           {[40, 70, 45, 90, 65, 80, 55, 95, 60].map((h, i) => (
                             <div key={i} className="flex-1 bg-emerald-500 rounded-t-sm" style={{ height: `${h}%` }}></div>
                           ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Mobile mockup overlay */}
                <div className="absolute -bottom-6 -right-6 w-1/3 rounded-[2rem] bg-slate-900 p-2 shadow-2xl border-4 border-slate-800 rotate-[-5deg]">
                  <div className="bg-white rounded-[1.5rem] overflow-hidden aspect-[9/19] flex flex-col">
                     <div className="h-10 bg-emerald-700 flex items-center justify-center">
                        <div className="w-12 h-1.5 bg-black/20 rounded-full"></div>
                     </div>
                     <div className="p-3 flex flex-col gap-3 flex-1 bg-slate-50">
                        <div className="h-16 bg-white rounded-lg border border-slate-100 shadow-sm"></div>
                        <div className="h-16 bg-white rounded-lg border border-slate-100 shadow-sm"></div>
                        <div className="h-16 bg-white rounded-lg border border-slate-100 shadow-sm"></div>
                        <div className="h-16 bg-white rounded-lg border border-slate-100 shadow-sm"></div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Trust Section */}
        <section className="py-20 bg-white border-y border-slate-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Données 100% sécurisées</h3>
                <p className="text-slate-600">Chaque école dispose d'une base de données totalement isolée (Architecture RLS). Vos informations ne fuient jamais.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6">
                  <Cloud className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Accessible partout</h3>
                <p className="text-slate-600">Entièrement basé sur le Cloud. Accédez à la scolarité de vos élèves depuis n'importe quel ordinateur, tablette ou smartphone.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-6">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Conçu pour l'Afrique</h3>
                <p className="text-slate-600">Une interface ultra-légère et rapide, optimisée pour fonctionner parfaitement même avec une connexion internet limitée.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Problems & Solutions */}
        <section id="features" className="py-24 bg-slate-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Vos défis quotidiens, notre solution simple</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">Scogestia remplace vos fichiers Excel, vos cahiers volants et vos longs calculs par un outil unique et automatisé.</p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 justify-center relative">
              {/* Problem 1 */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 w-full md:w-1/3 flex flex-col items-center text-center z-10 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-2">Cahiers de notes égarés</h4>
                <p className="text-sm text-slate-500">Perte de temps pour calculer les moyennes et rédiger les bulletins à la main.</p>
              </div>

              <div className="hidden md:block text-slate-300">
                <ArrowRight className="w-8 h-8" />
              </div>

              {/* Problem 2 */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 w-full md:w-1/3 flex flex-col items-center text-center z-10 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-2">Impayés invisibles</h4>
                <p className="text-sm text-slate-500">Difficulté à suivre les retards de paiement de scolarité au jour le jour.</p>
              </div>

              <div className="hidden md:block text-slate-300">
                <ArrowRight className="w-8 h-8" />
              </div>

              {/* Problem 3 */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 w-full md:w-1/3 flex flex-col items-center text-center z-10 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-2">Parents isolés</h4>
                <p className="text-sm text-slate-500">Informations dispersées et manque de communication avec les familles.</p>
              </div>
            </div>

            <div className="mt-16 bg-emerald-700 rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
               <div className="relative z-10">
                 <div className="w-16 h-16 bg-white text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <CheckCircle2 className="w-8 h-8" />
                 </div>
                 <h3 className="text-2xl md:text-3xl font-bold mb-4">Scogestia centralise tout dans un seul outil fiable.</h3>
                 <p className="text-emerald-100 text-lg max-w-3xl mx-auto">
                   Gagnez du temps, améliorez votre trésorerie et renforcez la confiance des parents grâce à des alertes automatiques et des tableaux de bord clairs.
                 </p>
               </div>
            </div>
          </div>
        </section>

      </main>

      {/* Simple Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Scogestia Logo" className="h-8 w-auto brightness-0 invert opacity-50" />
            <span className="text-slate-300 font-semibold tracking-wide">Scogestia</span>
          </div>
          <div className="text-sm">
            © {new Date().getFullYear()} Scogestia. Tous droits réservés.
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="#" className="hover:text-white transition-colors">Confidentialité</Link>
            <Link href="#" className="hover:text-white transition-colors">Conditions</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
