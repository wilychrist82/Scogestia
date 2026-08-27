import Link from 'next/link'
import { ShieldCheck, Cloud, Zap, CheckCircle2, LayoutDashboard, CreditCard, Users, ArrowRight, BarChart, Smartphone, Globe, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#006039]/20 selection:text-[#006039]">
      {/* Navigation Sticky */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="#accueil" className="flex items-center gap-2">
              <img src="/logo.png" alt="Scogestia Logo" className="h-10 w-auto" />
              <span className="text-xl font-bold text-slate-800 hidden sm:block tracking-tight">Scogestia</span>
            </Link>
          </div>
          
          {/* Menu Principal */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="#accueil" className="text-sm font-medium text-slate-600 hover:text-[#006039] transition-colors">Accueil</Link>
            <Link href="#fonctionnalites" className="text-sm font-medium text-slate-600 hover:text-[#006039] transition-colors">Fonctionnalités</Link>
            <Link href="#tarifs" className="text-sm font-medium text-slate-600 hover:text-[#006039] transition-colors">Tarifs</Link>
            <Link href="#faq" className="text-sm font-medium text-slate-600 hover:text-[#006039] transition-colors">FAQ</Link>
            <Link href="#contact" className="text-sm font-medium text-slate-600 hover:text-[#006039] transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              href="/connexion" 
              className="hidden sm:inline-flex items-center justify-center h-10 px-4 sm:px-6 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-full transition-colors"
            >
              Se connecter
            </Link>
            <Link 
              href="/inscription-ecole"
              className="inline-flex items-center justify-center h-10 px-4 sm:px-6 text-sm font-medium text-white bg-[#006039] hover:bg-[#004d2e] rounded-full transition-all shadow-md hover:shadow-lg whitespace-nowrap"
            >
              Créer mon école
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Section Héro (#accueil) */}
        <section id="accueil" className="relative pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-slate-50 to-slate-50"></div>
          
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              <div className="w-full lg:w-5/12 flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/50 text-[#006039] text-sm font-semibold mb-8 border border-emerald-200">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Le logiciel de gestion scolaire tout-en-un</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
                  Gérez votre école <span className="text-[#006039]">simplement</span>, du paiement des frais aux bulletins.
                </h1>
                
                <p className="text-lg text-slate-600 mb-10 max-w-xl leading-relaxed">
                  Scogestia est la solution 100% web qui aide les directeurs, comptables et enseignants à gagner du temps, et renforce la confiance des parents grâce au suivi en temps réel.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <Link 
                    href="/inscription-ecole"
                    className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-8 text-base font-medium text-white bg-[#006039] hover:bg-[#004d2e] rounded-full transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                  >
                    Essai gratuit de 14 jours
                  </Link>
                  <Link 
                    href="#fonctionnalites"
                    className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-8 text-base font-medium text-slate-700 bg-white border-2 border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 rounded-full transition-all"
                  >
                    Voir les fonctionnalités
                  </Link>
                </div>
                
                <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#006039]" />
                    Aucune carte requise
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#006039]" />
                    Installation immédiate
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#006039]" />
                    Support 7j/7
                  </div>
                </div>
              </div>
              
              {/* Le Vrai Mockup */}
              <div className="w-full lg:w-7/12 relative">
                <div className="relative rounded-2xl p-2 shadow-2xl overflow-hidden border border-slate-200 bg-white/50 backdrop-blur-xl">
                   {/* 
                     NOTE POUR L'ADMINISTRATEUR (WILFRIED) : 
                     C'est ici que s'affichera ta vraie image.
                     Mets ton image dans le dossier "public" et nomme-la "mockup-scogestia.png".
                   */}
                   <img 
                     src="/mockup-scogestia.png" 
                     alt="Interface de Scogestia sur ordinateur et mobile" 
                     className="w-full h-auto rounded-xl shadow-inner border border-slate-100 object-cover bg-slate-100 min-h-[300px]"
                     onError={(e) => {
                       // Image de secours temporaire si mockup-scogestia.png n'existe pas encore
                       e.currentTarget.src = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070";
                       e.currentTarget.style.opacity = "0.5";
                     }}
                   />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section Réassurance (Remplacement des fausses écoles) */}
        <section className="py-16 bg-white border-y border-slate-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#006039] mb-6 shadow-sm">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Données 100% sécurisées</h3>
                <p className="text-slate-600">Chaque école dispose d'une base de données totalement isolée et cryptée. Vos informations ne fuient jamais.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 shadow-sm">
                  <Cloud className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Accessible partout</h3>
                <p className="text-slate-600">Entièrement basé sur le Cloud sécurisé. Accédez à la scolarité de vos élèves depuis n'importe quel appareil.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-6 shadow-sm">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Conçu pour la rapidité</h3>
                <p className="text-slate-600">Une interface ultra-légère et optimisée pour fonctionner parfaitement même avec une connexion internet limitée.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section Fonctionnalités (#fonctionnalites) */}
        <section id="fonctionnalites" className="py-24 bg-slate-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <span className="text-[#006039] font-semibold tracking-wider uppercase text-sm mb-2 block">Fonctionnalités Clés</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Tout ce dont vous avez besoin pour diriger</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">Scogestia remplace vos fichiers Excel, vos cahiers volants et vos longs calculs par un outil unique, automatisé et collaboratif.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Gestion Scolaire Complète</h3>
                <p className="text-slate-600 leading-relaxed">
                  Inscriptions, gestion des classes, liste des enseignants et emplois du temps. Retrouvez n'importe quel élève en un clic.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Suivi Financier & Impayés</h3>
                <p className="text-slate-600 leading-relaxed">
                  Suivez les paiements de scolarité (tranches), imprimez les reçus officiels, et identifiez immédiatement les élèves en retard de paiement.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <BarChart className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Notes & Bulletins Automatisés</h3>
                <p className="text-slate-600 leading-relaxed">
                  Les enseignants saisissent les notes, Scogestia calcule les moyennes, les rangs, et génère les bulletins trimestriels sans erreur humaine.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-[#006039]/10 text-[#006039] rounded-xl flex items-center justify-center mb-6">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Portail Parents Temps Réel</h3>
                <p className="text-slate-600 leading-relaxed">
                  Un espace dédié pour les parents afin qu'ils consultent les notes, l'assiduité et les paiements de leurs enfants depuis leur smartphone.
                </p>
              </div>
              
              {/* Feature 5 */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mb-6">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Tableaux de bord (Analytics)</h3>
                <p className="text-slate-600 leading-relaxed">
                  Visualisez la santé financière et académique de votre école d'un seul coup d'œil grâce à des graphiques dynamiques et détaillés.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center mb-6">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Multi-Rôles Sécurisé</h3>
                <p className="text-slate-600 leading-relaxed">
                  Directeur, Comptable, Enseignant, Parent. Chacun a un accès strictement limité aux informations dont il a besoin.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section Tarifs (#tarifs) */}
        <section id="tarifs" className="py-24 bg-white">
           <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-16">
              <span className="text-[#006039] font-semibold tracking-wider uppercase text-sm mb-2 block">Tarification</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Des tarifs simples, sans surprise</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">Commencez gratuitement, puis choisissez le plan qui correspond à la taille de votre établissement.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
               {/* Plan Gratuit */}
               <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col relative overflow-hidden">
                  <div className="mb-8">
                     <h3 className="text-2xl font-bold text-slate-900 mb-2">Essai Gratuit</h3>
                     <p className="text-slate-500">Pour découvrir la plateforme</p>
                  </div>
                  <div className="mb-8">
                     <span className="text-4xl font-extrabold text-slate-900">0 FCFA</span>
                     <span className="text-slate-500 font-medium"> / 14 jours</span>
                  </div>
                  <ul className="space-y-4 mb-10 flex-1">
                     <li className="flex items-center gap-3 text-slate-600"><CheckCircle2 className="w-5 h-5 text-slate-400" /> Accès complet aux fonctionnalités</li>
                     <li className="flex items-center gap-3 text-slate-600"><CheckCircle2 className="w-5 h-5 text-slate-400" /> Jusqu'à 50 élèves</li>
                     <li className="flex items-center gap-3 text-slate-600"><CheckCircle2 className="w-5 h-5 text-slate-400" /> Support par email</li>
                  </ul>
                  <Link href="/inscription-ecole" className="w-full py-4 rounded-xl border-2 border-slate-200 font-bold text-slate-700 hover:border-[#006039] hover:text-[#006039] transition-colors text-center">
                     Commencer l'essai
                  </Link>
               </div>

               {/* Plan Pro */}
               <div className="bg-[#006039] rounded-3xl shadow-2xl p-8 flex flex-col relative overflow-hidden transform md:-translate-y-4">
                  <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Populaire</div>
                  <div className="mb-8 relative z-10">
                     <h3 className="text-2xl font-bold text-white mb-2">Plan Pro</h3>
                     <p className="text-emerald-100/80">Pour les établissements en croissance</p>
                  </div>
                  <div className="mb-8 relative z-10">
                     <span className="text-4xl font-extrabold text-white">Sur devis</span>
                     <span className="text-emerald-200 font-medium"> / an</span>
                  </div>
                  <ul className="space-y-4 mb-10 flex-1 relative z-10">
                     <li className="flex items-center gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Élèves illimités</li>
                     <li className="flex items-center gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Gestion avancée (Comptabilité, Notes)</li>
                     <li className="flex items-center gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Accès portail Parents temps réel</li>
                     <li className="flex items-center gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Support prioritaire WhatsApp / Téléphone</li>
                  </ul>
                  <Link href="#contact" className="w-full py-4 rounded-xl bg-white font-bold text-[#006039] hover:bg-slate-50 transition-colors text-center relative z-10 shadow-lg">
                     Contacter le service commercial
                  </Link>
                  {/* Background decoration */}
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-600 rounded-full blur-3xl opacity-50"></div>
               </div>
            </div>
           </div>
        </section>

        {/* Section FAQ (#faq) */}
        <section id="faq" className="py-24 bg-slate-50 border-t border-slate-100">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Questions Fréquentes</h2>
              <p className="text-lg text-slate-600">Vous avez des questions ? Nous avons les réponses.</p>
            </div>

            <div className="space-y-4">
              {/* Question 1 */}
              <details className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer">
                 <summary className="flex items-center justify-between p-6 font-semibold text-slate-900 hover:text-[#006039] transition-colors select-none">
                    Faut-il installer un logiciel sur mon ordinateur ?
                    <span className="transition group-open:rotate-180">
                      <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                    </span>
                 </summary>
                 <div className="p-6 pt-0 text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    Absolument pas ! Scogestia est un logiciel 100% web (en nuage). Vous n'avez besoin que d'un navigateur internet (Chrome, Safari, Edge) et d'une connexion internet. Vous pouvez vous connecter depuis n'importe quel ordinateur ou téléphone.
                 </div>
              </details>

              {/* Question 2 */}
              <details className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer">
                 <summary className="flex items-center justify-between p-6 font-semibold text-slate-900 hover:text-[#006039] transition-colors select-none">
                    Mes données sont-elles en sécurité ?
                    <span className="transition group-open:rotate-180">
                      <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                    </span>
                 </summary>
                 <div className="p-6 pt-0 text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    Oui. La sécurité est notre priorité absolue. Nous utilisons une architecture appelée RLS (Row Level Security) qui garantit que vos données sont strictement isolées de celles des autres écoles. Les sauvegardes sont effectuées quotidiennement sur des serveurs sécurisés.
                 </div>
              </details>

              {/* Question 3 */}
              <details className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer">
                 <summary className="flex items-center justify-between p-6 font-semibold text-slate-900 hover:text-[#006039] transition-colors select-none">
                    Les parents doivent-ils payer pour utiliser l'application ?
                    <span className="transition group-open:rotate-180">
                      <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                    </span>
                 </summary>
                 <div className="p-6 pt-0 text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    Non. L'abonnement est payé uniquement par l'établissement scolaire. Les parents bénéficient d'un accès totalement gratuit à leur portail pour suivre l'évolution de leurs enfants.
                 </div>
              </details>
              
              {/* Question 4 */}
              <details className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer">
                 <summary className="flex items-center justify-between p-6 font-semibold text-slate-900 hover:text-[#006039] transition-colors select-none">
                    Comment se passe l'intégration de mes anciens élèves (Excel) ?
                    <span className="transition group-open:rotate-180">
                      <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                    </span>
                 </summary>
                 <div className="p-6 pt-0 text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    Nous vous fournissons un fichier modèle Excel. Il vous suffit de copier-coller vos listes actuelles dedans et de nous le transmettre, ou d'utiliser notre outil d'importation (selon votre plan). Notre équipe de support peut vous accompagner lors de la première rentrée.
                 </div>
              </details>
            </div>
          </div>
        </section>

      </main>

      {/* Footer & Contact (#contact) */}
      <footer id="contact" className="bg-slate-900 text-slate-300 pt-20 pb-10 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            
            {/* Colonne 1: A propos */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Scogestia Logo" className="h-8 w-auto brightness-0 invert" />
                <span className="text-white font-bold text-xl tracking-tight">Scogestia</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Le système d'information de gestion de l'éducation (SIGE) moderne qui connecte les directeurs, les enseignants et les parents.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#006039] hover:text-white transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#006039] hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#006039] hover:text-white transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#006039] hover:text-white transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Colonne 2: Liens Rapides */}
            <div>
              <h4 className="text-white font-semibold mb-6">Liens Rapides</h4>
              <ul className="space-y-4">
                <li><Link href="#accueil" className="hover:text-white transition-colors flex items-center gap-2"><ArrowRight className="w-4 h-4 text-[#006039]"/> Accueil</Link></li>
                <li><Link href="#fonctionnalites" className="hover:text-white transition-colors flex items-center gap-2"><ArrowRight className="w-4 h-4 text-[#006039]"/> Fonctionnalités</Link></li>
                <li><Link href="#tarifs" className="hover:text-white transition-colors flex items-center gap-2"><ArrowRight className="w-4 h-4 text-[#006039]"/> Tarifs</Link></li>
                <li><Link href="#faq" className="hover:text-white transition-colors flex items-center gap-2"><ArrowRight className="w-4 h-4 text-[#006039]"/> FAQ</Link></li>
              </ul>
            </div>

            {/* Colonne 3: Contact */}
            <div>
              <h4 className="text-white font-semibold mb-6">Nous contacter</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#006039] mt-0.5" />
                  <span className="text-slate-400">Lomé, Togo<br/>Quartier Agoè</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#006039]" />
                  <span className="text-slate-400">+228 90 00 00 00</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#006039]" />
                  <span className="text-slate-400">contact@scogestia.com</span>
                </li>
              </ul>
            </div>

            {/* Colonne 4: Newsletter / Inscription */}
            <div>
              <h4 className="text-white font-semibold mb-6">Prêt à digitaliser votre école ?</h4>
              <p className="text-slate-400 text-sm mb-4">Créez votre compte maintenant et profitez de 14 jours d'essai gratuit.</p>
              <Link href="/inscription-ecole" className="w-full inline-flex justify-center items-center px-4 py-3 bg-[#006039] text-white rounded-lg hover:bg-[#004d2e] transition-colors font-medium">
                Créer mon école
              </Link>
            </div>

          </div>

          {/* Copyrights */}
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <div>
              © {new Date().getFullYear()} Scogestia. Tous droits réservés.
            </div>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white transition-colors">Politique de confidentialité</Link>
              <Link href="#" className="hover:text-white transition-colors">Conditions d'utilisation</Link>
              <Link href="#" className="hover:text-white transition-colors">Mentions légales</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
