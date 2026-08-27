"use client";

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ShieldCheck, Cloud, Zap, CheckCircle2, LayoutDashboard, CreditCard, Users, ArrowRight, BarChart, Smartphone, Globe, Mail, Phone, MapPin, Star, PlayCircle, Lock, ChevronDown } from 'lucide-react'

// Animation Variants
const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const FaqItem = ({ q, a }: { q: string, a: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <motion.div variants={fadeIn} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsOpen(!isOpen)}>
      <div className="flex items-center justify-between p-6 font-semibold text-slate-900 select-none">
        <span className={isOpen ? "text-[#006039]" : ""}>{q}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} className="text-[#006039]">
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-6 pt-0 text-slate-600 leading-relaxed bg-slate-50/30">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Home() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#006039]/20 selection:text-[#006039]">
      {/* Navigation Sticky - Glassmorphism */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/70 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="#accueil" className="flex items-center gap-2 group">
              <div className="relative overflow-hidden rounded-lg p-1 transition-transform group-hover:scale-105">
                 <img src="/logo.png" alt="Scogestia Logo" className="h-14 w-auto object-contain drop-shadow-md" />
              </div>
            </Link>
          </div>
          
          {/* Menu Principal */}
          <nav className="hidden lg:flex items-center gap-8">
            {['Accueil', 'Fonctionnalités', 'Comment ça marche', 'Tarifs', 'Témoignages', 'Contact'].map((item) => (
              <Link key={item} href={`#${item.toLowerCase().replace(/ /g, '-').replace('ç', 'c')}`} className="text-sm font-medium text-slate-600 hover:text-[#006039] transition-colors relative group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#006039] transition-all group-hover:w-full rounded-full"></span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              href="/connexion" 
              className="hidden sm:inline-flex items-center justify-center h-10 px-6 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-[#006039] rounded-full transition-all shadow-sm hover:shadow"
            >
              Se connecter
            </Link>
            <Link 
              href="/inscription-ecole"
              className="inline-flex items-center justify-center h-10 px-6 text-sm font-medium text-white bg-gradient-to-r from-[#006039] to-emerald-600 hover:from-[#004d2e] hover:to-[#006039] rounded-full transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 whitespace-nowrap"
            >
              Créer mon école
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Section Héro (#accueil) */}
        <section id="accueil" className="relative pt-24 pb-32 lg:pt-36 lg:pb-48 overflow-hidden">
          {/* Background Elements Premium */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-300/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-200/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] -z-10"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
              <motion.div 
                className="w-full lg:w-5/12 flex flex-col items-center lg:items-start text-center lg:text-left"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#006039] text-sm font-bold mb-8 shadow-sm border border-emerald-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Le SIGE Premium N°1</span>
                </motion.div>
                
                <motion.h1 variants={fadeIn} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
                  Dirigez votre école <span className="relative whitespace-nowrap"><span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[#006039] to-emerald-500">avec excellence</span><span className="absolute bottom-0 left-0 w-full h-3 bg-emerald-200/50 -rotate-2 -z-10"></span></span>
                </motion.h1>
                
                <motion.p variants={fadeIn} className="text-lg text-slate-600 mb-10 max-w-xl leading-relaxed">
                  Scogestia est la plateforme Cloud nouvelle génération. Gérez les finances, les bulletins, et la communication avec les parents en une seule interface élégante.
                </motion.p>
                
                <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <Link 
                    href="/inscription-ecole"
                    className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-8 text-base font-medium text-white bg-gradient-to-r from-[#006039] to-emerald-600 hover:from-[#004d2e] hover:to-[#006039] rounded-full transition-all shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 hover:-translate-y-1"
                  >
                    Essai gratuit de 14 jours
                  </Link>
                  <button 
                    onClick={() => setIsVideoOpen(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-8 text-base font-medium text-slate-700 bg-white border-2 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 rounded-full transition-all shadow-sm hover:shadow-md group"
                  >
                    <PlayCircle className="w-5 h-5 mr-2 text-[#006039] group-hover:scale-110 transition-transform" />
                    Voir la démo
                  </button>
                </motion.div>
                
                <motion.div variants={fadeIn} className="mt-10 flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-slate-500 font-medium">
                  {[
                    "Aucune carte requise",
                    "Installation immédiate",
                    "Support VIP 7j/7"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#006039]" />
                      </div>
                      {text}
                    </div>
                  ))}
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="w-full lg:w-7/12 relative perspective-1000"
                initial={{ opacity: 0, y: 50, rotateX: 10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 1, delay: 0.2, type: "spring", stiffness: 50 }}
              >
                <div className="relative overflow-visible group flex justify-center lg:justify-end">
                    {/* Glow effect behind image */}
                   <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
                   <img 
                     src="/mockup-scogestia.png" 
                     alt="Interface de Scogestia sur ordinateur et mobile" 
                     className="w-full max-w-[120%] lg:max-w-[130%] h-auto object-contain relative z-10 drop-shadow-2xl rounded-2xl"
                   />
                </div>
                {/* Decorative floating elements (Premium feel) */}
                <motion.div 
                  className="absolute top-1/4 -right-12 bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/50 hidden lg:flex items-center gap-4 z-20"
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-3 rounded-xl text-white shadow-inner"><BarChart className="w-6 h-6"/></div>
                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Recouvrement</div>
                    <div className="text-2xl font-black text-slate-900">98.5%</div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Modal Vidéo Interactive */}
        <AnimatePresence>
          {isVideoOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-md"
              onClick={() => setIsVideoOpen(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-5xl aspect-video bg-black rounded-3xl shadow-2xl overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setIsVideoOpen(false)}
                  className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
                >
                  ✕
                </button>
                {/* Placeholder Video - In a real app, use an iframe or video tag */}
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-400">
                  <PlayCircle className="w-20 h-20 mb-4 text-slate-500" />
                  <p className="text-lg font-medium">Vidéo de présentation Scogestia</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section Réassurance */}
        <section className="py-16 bg-white relative z-10">
          <div className="container mx-auto px-4">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {[
                { icon: ShieldCheck, color: "emerald", title: "Sécurité Bancaire", desc: "Données chiffrées de bout en bout et isolées." },
                { icon: Cloud, color: "blue", title: "Cloud Performant", desc: "Accessibilité 24/7 depuis tout appareil." },
                { icon: Zap, color: "amber", title: "Vitesse Optimisée", desc: "Fluide même avec une connexion internet faible." }
              ].map((item, i) => (
                <motion.div key={i} variants={fadeIn} className="flex flex-col items-center text-center p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:bg-white transition-all duration-300">
                  <div className={`w-16 h-16 rounded-2xl bg-${item.color}-100 flex items-center justify-center text-${item.color}-600 mb-6 shadow-inner`}>
                    <item.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Section Fonctionnalités (#fonctionnalites) */}
        <section id="fonctionnalites" className="py-24 bg-slate-50/50">
          <div className="container mx-auto px-4 max-w-7xl">
            <motion.div 
              className="text-center mb-20"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <span className="inline-block py-1 px-3 rounded-full bg-emerald-100 text-[#006039] font-bold tracking-wider uppercase text-xs mb-4">Fonctionnalités Premium</span>
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Tout ce dont vous avez besoin, <br className="hidden md:block"/>sans la complexité</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">Une suite d'outils interconnectés conçue pour propulser votre établissement vers l'excellence administrative.</p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              {[
                { icon: Users, color: "blue", title: "Gestion Complète", desc: "Inscriptions fluides, dossiers élèves centralisés et emplois du temps dynamiques." },
                { icon: CreditCard, color: "amber", title: "Suivi Financier", desc: "Tranches de scolarité, reçus officiels automatiques et alertes d'impayés." },
                { icon: BarChart, color: "purple", title: "Bulletins Automatisés", desc: "Calcul instantané des moyennes et rangs. Édition des bulletins sans erreur." },
                { icon: Smartphone, color: "emerald", title: "Portail Parents", desc: "Application web dédiée pour suivre notes, absences et paiements en temps réel." },
                { icon: LayoutDashboard, color: "red", title: "Analytics Avancés", desc: "Tableaux de bord visuels pour la direction (santé financière et académique)." },
                { icon: Globe, color: "indigo", title: "Multi-Rôles", desc: "Espaces sécurisés pour la Direction, la Comptabilité, et le Corps Enseignant." }
              ].map((feature, i) => (
                <motion.div key={i} variants={fadeIn} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-${feature.color}-500/5 rounded-bl-full -z-10 transition-transform group-hover:scale-150`}></div>
                  <div className={`w-16 h-16 bg-${feature.color}-50 text-${feature.color}-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm`}>
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Section Tarifs (#tarifs) */}
        <section id="tarifs" className="py-24 bg-white relative overflow-hidden">
           <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
           <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <motion.div 
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <span className="inline-block py-1 px-3 rounded-full bg-emerald-100 text-[#006039] font-bold tracking-wider uppercase text-xs mb-4">Investissement</span>
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Des tarifs clairs, pour chaque taille d'école</h2>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
               {/* Essai */}
               <motion.div variants={fadeIn} className="bg-slate-50 rounded-3xl shadow-sm border border-slate-200 p-10 flex flex-col hover:bg-white hover:shadow-xl transition-all">
                  <div className="mb-6">
                     <h3 className="text-2xl font-bold text-slate-900">Essai Gratuit</h3>
                     <p className="text-slate-500 mt-2">14 jours pour tout tester</p>
                  </div>
                  <div className="mb-8">
                     <span className="text-4xl font-extrabold text-slate-900">0 FCFA</span>
                  </div>
                  <ul className="space-y-4 mb-10 flex-1">
                     <li className="flex items-center gap-3 text-slate-600"><CheckCircle2 className="w-5 h-5 text-slate-400" /> Jusqu'à 50 élèves</li>
                     <li className="flex items-center gap-3 text-slate-600"><CheckCircle2 className="w-5 h-5 text-slate-400" /> Toutes les fonctions de base</li>
                  </ul>
                  <Link href="/inscription-ecole" className="w-full py-4 rounded-xl border-2 border-slate-200 font-bold text-slate-700 hover:border-[#006039] hover:text-[#006039] text-center block transition-colors">
                     Commencer
                  </Link>
               </motion.div>

               {/* Standard */}
               <motion.div variants={fadeIn} className="bg-white rounded-3xl shadow-2xl border border-[#006039]/20 p-10 flex flex-col relative transform md:-translate-y-4 ring-4 ring-[#006039]/10">
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#006039] to-emerald-400"></div>
                  <div className="absolute top-4 right-4 bg-emerald-100 text-[#006039] text-xs font-bold px-3 py-1 rounded-full uppercase">Recommandé</div>
                  <div className="mb-6">
                     <h3 className="text-2xl font-bold text-slate-900">Standard</h3>
                     <p className="text-slate-500 mt-2">Pour la majorité des écoles</p>
                  </div>
                  <div className="mb-8">
                     <span className="text-4xl font-extrabold text-slate-900">7 000 FCFA</span>
                     <span className="text-slate-500 font-medium">/mois</span>
                  </div>
                  <ul className="space-y-4 mb-10 flex-1">
                     <li className="flex items-center gap-3 text-slate-800 font-medium"><CheckCircle2 className="w-5 h-5 text-[#006039]" /> Jusqu'à 500 élèves</li>
                     <li className="flex items-center gap-3 text-slate-600"><CheckCircle2 className="w-5 h-5 text-[#006039]" /> Gestion complète + Bulletins</li>
                     <li className="flex items-center gap-3 text-slate-600"><CheckCircle2 className="w-5 h-5 text-[#006039]" /> Comptabilité & Reçus</li>
                     <li className="flex items-center gap-3 text-slate-600"><CheckCircle2 className="w-5 h-5 text-[#006039]" /> Portail Parents</li>
                  </ul>
                  <Link href="/inscription-ecole" className="w-full py-4 rounded-xl bg-gradient-to-r from-[#006039] to-emerald-600 font-bold text-white hover:shadow-lg hover:shadow-emerald-500/30 text-center block transition-all hover:-translate-y-1">
                     S'abonner
                  </Link>
               </motion.div>

               {/* Pro */}
               <motion.div variants={fadeIn} className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-10 flex flex-col relative overflow-hidden text-white">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="mb-6 relative z-10">
                     <h3 className="text-2xl font-bold text-white">Premium</h3>
                     <p className="text-slate-400 mt-2">Complexes scolaires</p>
                  </div>
                  <div className="mb-8 relative z-10">
                     <span className="text-4xl font-extrabold text-white">9 900 FCFA</span>
                     <span className="text-slate-400 font-medium">/mois</span>
                  </div>
                  <ul className="space-y-4 mb-10 flex-1 relative z-10">
                     <li className="flex items-center gap-3 text-white font-medium"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Élèves illimités</li>
                     <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> SMS & Emails inclus</li>
                     <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Multi-campus & RH</li>
                     <li className="flex items-center gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Support VIP 24/7</li>
                  </ul>
                  <Link href="/inscription-ecole" className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 font-bold text-white text-center block transition-all relative z-10">
                     S'abonner
                  </Link>
               </motion.div>
            </motion.div>
           </div>
        </section>

        {/* Section FAQ Interactive (#faq) */}
        <section id="faq" className="py-24 bg-slate-50/50">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div 
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Questions Fréquentes</h2>
            </motion.div>

            <motion.div 
              className="space-y-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {[
                { q: "Faut-il installer un logiciel sur mon ordinateur ?", a: "Absolument pas ! Scogestia est un logiciel 100% web (en nuage). Vous n'avez besoin que d'un navigateur internet et d'une connexion internet." },
                { q: "Mes données sont-elles en sécurité ?", a: "Oui. La sécurité est notre priorité absolue. Nous utilisons une architecture qui garantit que vos données sont strictement isolées avec un cryptage de haut niveau." },
                { q: "Les parents doivent-ils payer pour utiliser l'application ?", a: "Non. L'abonnement est payé uniquement par l'établissement scolaire. L'accès parent est 100% gratuit." },
                { q: "Comment se passe l'intégration de mes anciens élèves ?", a: "Nous vous fournissons un fichier modèle Excel. Importez-le en un clic dans notre système. C'est instantané !" }
              ].map((faq, i) => (
                <FaqItem key={i} q={faq.q} a={faq.a} />
              ))}
            </motion.div>
          </div>
        </section>

        {/* Call to Action Pre-Footer */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-slate-900"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#006039] rounded-full blur-[120px] opacity-40"></div>
          
          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl md:text-6xl font-black text-white mb-6 tracking-tight">Passez à la vitesse supérieure.</h2>
              <p className="text-slate-300 text-lg md:text-xl mb-12 max-w-2xl mx-auto">Rejoignez l'élite des établissements scolaires modernes.</p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  href="/inscription-ecole"
                  className="w-full sm:w-auto inline-flex items-center justify-center h-16 px-10 text-lg font-bold text-white bg-gradient-to-r from-[#006039] to-emerald-500 rounded-full transition-all shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:-translate-y-1"
                >
                  Démarrer gratuitement
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer Minimalist & Premium */}
      <footer id="contact" className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
        <div className="container mx-auto px-4 text-center">
           <img src="/logo.png" alt="Scogestia Logo" className="h-10 w-auto mx-auto mb-6 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
           <p className="text-sm mb-6 max-w-md mx-auto">Le SIGE qui simplifie la gestion de votre école et connecte la communauté éducative.</p>
           <div className="flex justify-center gap-8 mb-8 text-sm">
             <Link href="#" className="hover:text-white transition-colors">Contact</Link>
             <Link href="#" className="hover:text-white transition-colors">Confidentialité</Link>
             <Link href="#" className="hover:text-white transition-colors">Mentions légales</Link>
           </div>
           <p className="text-xs text-slate-600">© {new Date().getFullYear()} Scogestia. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
