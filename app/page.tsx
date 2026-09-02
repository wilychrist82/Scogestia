"use client";

import { useState } from 'react';
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Cloud, Zap, CheckCircle2, LayoutDashboard, CreditCard, Users, ArrowRight, BarChart, Smartphone, Globe, Mail, Phone, MapPin, Star, PlayCircle, Lock, X, Play, Wallet, TrendingUp, Building2, Settings, MessageSquare, GraduationCap } from 'lucide-react'

// Animation Variants
const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#006039]/20 selection:text-[#006039]">
      {/* Navigation Sticky */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="#accueil" className="flex items-center gap-2">
              <img src="/logo-scogestia-transparent.png" alt="Scogestia Logo" className="h-14 w-auto object-contain drop-shadow-sm" />
            </Link>
          </div>
          
          {/* Menu Principal */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="#accueil" className="relative text-sm font-medium text-slate-600 hover:text-[#006039] transition-colors group">
              Accueil
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#006039] transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#fonctionnalites" className="relative text-sm font-medium text-slate-600 hover:text-[#006039] transition-colors group">
              Fonctionnalités
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#006039] transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#comment-ca-marche" className="relative text-sm font-medium text-slate-600 hover:text-[#006039] transition-colors group">
              Comment ça marche
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#006039] transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#tarifs" className="relative text-sm font-medium text-slate-600 hover:text-[#006039] transition-colors group">
              Tarifs
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#006039] transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#temoignages" className="relative text-sm font-medium text-slate-600 hover:text-[#006039] transition-colors group">
              Témoignages
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#006039] transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#contact" className="relative text-sm font-medium text-slate-600 hover:text-[#006039] transition-colors group">
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#006039] transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              href="/connexion" 
              className="hidden sm:inline-flex items-center justify-center h-10 px-4 sm:px-6 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-[#006039] rounded-full transition-colors"
            >
              Se connecter
            </Link>
            <Link 
              href="/inscription-ecole"
              className="inline-flex items-center justify-center h-10 px-4 sm:px-6 text-sm font-medium text-white bg-[#006039] hover:bg-[#004d2e] rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap"
            >
              Créer mon école
            </Link>
            <button 
              className="lg:hidden p-2 text-slate-600 hover:text-[#006039] hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-b border-slate-200 shadow-xl overflow-hidden"
            >
              <div className="flex flex-col p-4 gap-4">
                <Link href="#accueil" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-slate-700 p-2 hover:bg-slate-50 rounded-lg">Accueil</Link>
                <Link href="#fonctionnalites" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-slate-700 p-2 hover:bg-slate-50 rounded-lg">Fonctionnalités</Link>
                <Link href="#comment-ca-marche" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-slate-700 p-2 hover:bg-slate-50 rounded-lg">Comment ça marche</Link>
                <Link href="#tarifs" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-slate-700 p-2 hover:bg-slate-50 rounded-lg">Tarifs</Link>
                <Link href="#temoignages" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-slate-700 p-2 hover:bg-slate-50 rounded-lg">Témoignages</Link>
                <Link href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-slate-700 p-2 hover:bg-slate-50 rounded-lg">Contact</Link>
                <hr className="border-slate-100 my-2" />
                <Link 
                  href="/connexion" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="sm:hidden flex items-center justify-center h-12 text-base font-medium text-slate-700 bg-white border border-slate-300 rounded-xl"
                >
                  Se connecter
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* Section Héro (#accueil) */}
        <section id="accueil" className="relative pt-20 pb-20 lg:pt-32 lg:pb-24 overflow-hidden bg-floating-waves">
          
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              <motion.div 
                className="w-full lg:w-5/12 flex flex-col items-center lg:items-start text-center lg:text-left"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                <motion.h1 variants={fadeIn} className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-6 font-sans">
                  Gérez votre école
                  <br />
                  <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-emerald-200 to-emerald-400">
                    en toute simplicité.
                  </span>
                </motion.h1>
                
                <motion.p variants={fadeIn} className="text-lg text-slate-400 mb-10 max-w-xl leading-relaxed">
                  Le premier ERP scolaire nouvelle génération en Afrique. Gagnez du temps, maîtrisez vos finances et rassurez les parents.
                </motion.p>
                
                <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <Link 
                    href="/inscription-ecole"
                    className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-8 text-base font-medium text-slate-900 bg-white hover:bg-slate-100 rounded-full transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                  >
                    Essai gratuit de 14 jours
                  </Link>
                  <button 
                    onClick={() => setDemoModalOpen(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-8 text-base font-medium text-white bg-white/5 border-2 border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-900/20 rounded-full transition-all"
                  >
                    <PlayCircle className="w-5 h-5 mr-2 text-emerald-400" />
                    Voir la démo
                  </button>
                </motion.div>
                
                <motion.div variants={fadeIn} className="mt-10 flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-slate-300 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Aucune carte requise
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Installation immédiate
                  </div>
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="w-full lg:w-7/12 relative"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="relative overflow-visible group flex justify-center lg:justify-end perspective-1000">
                    <div className="relative w-full lg:max-w-[110%] transform transition-all duration-700 group-hover:-translate-y-4 group-hover:scale-[1.02] hover-3d">
                      <img 
                        src="/image_landing_page1.png" 
                        alt="Scogestia - Gestion scolaire intuitive" 
                        className="w-full h-auto object-contain relative z-10 rounded-b-[4rem]"
                      />
                    </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Vagues dynamiques animées (iziSAAS style) - Forme de 8 restaurée avec overshoot */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-0 h-[80px] md:h-[120px]">
            {/* Vague Violet Clair (descend en premier) */}
            <svg className="block absolute bottom-0 w-[200%] h-full animate-wave-continuous-left" viewBox="0 0 2400 120" preserveAspectRatio="none">
              <path d="M0,60 C300,280 300,-160 600,60 C900,280 900,-160 1200,60 C1500,280 1500,-160 1800,60 C2100,280 2100,-160 2400,60 L2400,120 L0,120 Z" className="fill-violet-600/90" />
            </svg>
            {/* Vague Violet Foncé (monte en premier) */}
            <svg className="block absolute bottom-0 w-[200%] h-full animate-wave-continuous-right" viewBox="0 0 2400 120" preserveAspectRatio="none">
              <path d="M0,60 C300,-160 300,280 600,60 C900,-160 900,280 1200,60 C1500,-160 1500,280 1800,60 C2100,-160 2100,280 2400,60 L2400,120 L0,120 Z" className="fill-violet-800" />
            </svg>
          </div>
        </section>

        {/* Section Fonctionnalités & Réassurance (#fonctionnalites) */}
        <section id="fonctionnalites" className="py-20 lg:py-32 bg-slate-50 relative z-10">
          <div className="container mx-auto px-4 max-w-6xl">
            {/* EN-TÊTE DE SECTION */}
            <motion.div 
              className="mb-16 lg:mb-20 flex flex-col items-center text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight max-w-4xl leading-tight">
                Un contrôle total sur l'ensemble de <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-[#006039]">votre établissement.</span>
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
                Des outils financiers puissants aux carnets de notes automatisés, chaque module est conçu pour être invisible et efficace.
              </p>
            </motion.div>

            {/* CARTES DE RÉASSURANCE (BENTO) */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 max-w-5xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeIn} className="flex flex-col items-start p-8 rounded-[2rem] bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#006039] mb-6">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Données 100% sécurisées</h3>
                <p className="text-slate-600 leading-relaxed text-sm">Chaque école dispose d'une base de données totalement isolée et cryptée. Vos informations ne fuient jamais.</p>
              </motion.div>

              <motion.div variants={fadeIn} className="flex flex-col items-start p-8 rounded-[2rem] bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6">
                  <Cloud className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Accessible partout</h3>
                <p className="text-slate-600 leading-relaxed text-sm">Entièrement basé sur le Cloud sécurisé. Accédez à la scolarité de vos élèves depuis n'importe quel appareil.</p>
              </motion.div>

              <motion.div variants={fadeIn} className="flex flex-col items-start p-8 rounded-[2rem] bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-6">
                  <Zap className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Ultra-rapide</h3>
                <p className="text-slate-600 leading-relaxed text-sm">Une interface ultra-légère et optimisée pour fonctionner parfaitement même avec une connexion internet limitée.</p>
              </motion.div>
            </motion.div>

            {/* GRANDES CARTES FONCTIONNALITÉS */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-12 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              {/* Carte 1 : Finance (Image Background) */}
              <motion.div variants={fadeIn} className="md:col-span-8 h-[400px] rounded-[2rem] p-10 relative overflow-hidden group">
                <img src="/images/finance.png" alt="Admin Finance" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
                
                <div className="relative z-10 h-full flex flex-col justify-end">
                  <div className="bg-white/10 backdrop-blur-md w-fit p-3 rounded-2xl border border-white/10 mb-4 shadow-xl">
                    <Wallet className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2 font-sans tracking-tight">Suivi Financier & <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-emerald-200 to-emerald-400">Recouvrement</span></h3>
                  <p className="text-slate-300 text-lg max-w-lg leading-relaxed">
                    Visualisez instantanément les impayés, relancez les parents par SMS, et automatisez toute votre comptabilité sans tableaux croisés.
                  </p>
                </div>
              </motion.div>

              {/* Carte 2 : Parents (Image Background) */}
              <motion.div variants={fadeIn} className="md:col-span-4 h-[400px] rounded-[2rem] p-10 relative overflow-hidden group">
                <img src="/images/parents.png" alt="Portail Parent" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-slate-900/20"></div>
                
                <div className="relative z-10 h-full flex flex-col justify-end">
                  <div className="bg-white/10 backdrop-blur-md w-fit p-3 rounded-2xl border border-white/10 mb-4 shadow-xl">
                    <Smartphone className="w-6 h-6 text-violet-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 font-sans tracking-tight"><span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-emerald-200 to-emerald-400">Portail</span> Parents</h3>
                  <p className="text-slate-300">
                    Transparence totale sur le téléphone des parents : notes, absences, et paiements.
                  </p>
                </div>
              </motion.div>

              {/* Carte 3 : Administration (Image Background) */}
              <motion.div variants={fadeIn} className="md:col-span-4 h-[350px] rounded-[2rem] p-10 relative overflow-hidden group">
                <img src="/images/gestion_scolaire_african.jpg" alt="Gestion Scolaire" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
                
                <div className="relative z-10 h-full flex flex-col justify-end">
                  <div className="bg-white/10 backdrop-blur-md w-fit p-3 rounded-2xl border border-white/10 mb-4 shadow-xl">
                    <Building2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 font-sans tracking-tight">Gestion <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-emerald-200 to-emerald-400">Scolaire</span></h3>
                  <p className="text-slate-300">
                    Classes, enseignants, emplois du temps. Une architecture claire pour gérer des milliers d'élèves.
                  </p>
                </div>
              </motion.div>

              {/* Carte 4 : Académique / Enseignant (Image Background) */}
              <motion.div variants={fadeIn} className="md:col-span-4 h-[350px] rounded-[2rem] p-10 relative overflow-hidden group">
                <img src="/images/academie.png" alt="Enseignant" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
                
                <div className="relative z-10 h-full flex flex-col justify-end">
                  <div className="bg-white/10 backdrop-blur-md w-fit p-3 rounded-2xl border border-white/10 mb-4 shadow-xl">
                    <GraduationCap className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 font-sans tracking-tight"><span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-emerald-200 to-emerald-400">Académique</span></h3>
                  <p className="text-slate-300">
                    Saisie fluide des notes, bulletins automatisés et statistiques en temps réel.
                  </p>
                </div>
              </motion.div>

              {/* Carte 5 : Espace Élève / Sécurité (Image Background) */}
              <motion.div variants={fadeIn} className="md:col-span-4 h-[350px] rounded-[2rem] p-10 relative overflow-hidden group">
                <img src="/images/securite.png" alt="Sécurité et Contrôle" className="absolute inset-0 w-full h-full object-cover object-right transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
                
                <div className="relative z-10 h-full flex flex-col justify-end">
                  <div className="bg-white/10 backdrop-blur-md w-fit p-3 rounded-2xl border border-white/10 mb-4 shadow-xl">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 font-sans tracking-tight">Sécurité & <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-emerald-200 to-emerald-400">Contrôle</span></h3>
                  <p className="text-slate-300">
                    Vos données sensibles sont cryptées. Personne d'autre que vous n'y a accès. Fiabilité 99.9%.
                  </p>
                </div>
              </motion.div>

            </motion.div>
          </div>
        </section>

        {/* Section Comment ça marche (#comment-ca-marche) */}
        <section id="comment-ca-marche" className="py-24 bg-white relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-violet-50/50 rounded-full blur-[100px] -z-10"></div>
          
          <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <motion.div 
              className="text-center mb-24"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-violet-50 border border-violet-100 text-violet-600 font-semibold text-sm tracking-wide uppercase shadow-sm">
                Déploiement Facile
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Prêt à l'emploi en <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-emerald-500">3 étapes simples</span></h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">Pas besoin de connaissances techniques. Notre processus d'installation est conçu pour être aussi rapide que possible.</p>
            </motion.div>

            <div className="relative">
              {/* Ligne connectrice (Desktop) avec un beau dégradé */}
              <div className="hidden md:block absolute top-[2.5rem] left-[15%] right-[15%] h-[3px] bg-gradient-to-r from-transparent via-slate-200 to-transparent z-0"></div>
              
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16 relative z-10"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
              >
                {[
                  { 
                    step: '1', 
                    title: 'Créez votre compte', 
                    desc: 'Inscrivez votre établissement en 2 minutes. Aucune carte bancaire requise pour commencer l\'essai gratuit.',
                    styles: {
                      blur: 'bg-violet-400/20',
                      border: 'border-violet-50',
                      text: 'text-violet-600',
                      hoverBg: 'group-hover:bg-violet-600',
                      hoverBorder: 'group-hover:border-violet-100'
                    }
                  },
                  { 
                    step: '2', 
                    title: 'Importez vos élèves', 
                    desc: 'Utilisez notre modèle Excel ultra-simple pour importer toute votre liste d\'élèves et de classes en un seul clic.',
                    styles: {
                      blur: 'bg-emerald-400/20',
                      border: 'border-emerald-50',
                      text: 'text-emerald-600',
                      hoverBg: 'group-hover:bg-emerald-600',
                      hoverBorder: 'group-hover:border-emerald-100'
                    }
                  },
                  { 
                    step: '3', 
                    title: 'Invitez votre équipe', 
                    desc: 'Ajoutez vos enseignants et comptables, et laissez la plateforme automatiser toutes vos tâches quotidiennes.',
                    styles: {
                      blur: 'bg-blue-400/20',
                      border: 'border-blue-50',
                      text: 'text-blue-600',
                      hoverBg: 'group-hover:bg-blue-600',
                      hoverBorder: 'group-hover:border-blue-100'
                    }
                  }
                ].map((item, index) => (
                  <motion.div key={index} variants={fadeIn} className="flex flex-col items-center text-center group">
                    <div className="relative mb-8">
                      <div className={`absolute inset-0 ${item.styles.blur} rounded-full blur-xl transform group-hover:scale-110 transition-transform duration-500`}></div>
                      <div className={`relative w-20 h-20 rounded-full bg-white border-4 ${item.styles.border} ${item.styles.text} flex items-center justify-center text-2xl font-black shadow-[0_8px_30px_rgb(0,0,0,0.08)] ${item.styles.hoverBg} group-hover:text-white ${item.styles.hoverBorder} transition-all duration-300 z-10`}>
                        {item.step}
                      </div>
                    </div>
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 w-full h-full">
                      <h3 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">{item.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section Tarifs (#tarifs) */}
        <section id="tarifs" className="py-24 bg-slate-50 relative overflow-hidden">
          {/* Subtle background blur */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-100/40 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

          <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <motion.div 
              className="text-center mb-20"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold text-sm tracking-wide uppercase shadow-sm">
                Tarification
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Des tarifs simples, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">sans surprise</span></h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">Commencez gratuitement, puis choisissez le plan qui correspond parfaitement à la taille de votre établissement.</p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-0 max-w-6xl mx-auto items-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
               {/* Plan Gratuit (Left) */}
               <motion.div variants={fadeIn} className="bg-white rounded-3xl lg:rounded-r-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 p-10 flex flex-col relative overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all z-10 lg:z-10">
                  <div className="mb-8">
                     <h3 className="text-2xl font-bold text-slate-900 mb-2">Essai Gratuit</h3>
                     <p className="text-slate-500">Pour découvrir la plateforme</p>
                  </div>
                  <div className="mb-8 flex items-baseline gap-2">
                     <span className="text-5xl font-extrabold text-slate-900 tracking-tight">0</span>
                     <span className="text-xl font-bold text-slate-900">FCFA</span>
                     <span className="text-slate-500 font-medium">/ 14 jrs</span>
                  </div>
                  <ul className="space-y-5 mb-10 flex-1">
                     <li className="flex items-start gap-3 text-slate-600"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" /> <span>Accès complet aux modules de base</span></li>
                     <li className="flex items-start gap-3 text-slate-600"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" /> <span>Jusqu'à 50 élèves gérés</span></li>
                     <li className="flex items-start gap-3 text-slate-600"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" /> <span>Support par email (48h)</span></li>
                  </ul>
                  <Link href="/inscription-ecole" className="w-full py-4 rounded-2xl border-2 border-slate-200 font-bold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-all text-center block mt-auto">
                     Commencer l'essai
                  </Link>
               </motion.div>

               {/* Plan Standard (Center - Highlighted) */}
               <motion.div variants={fadeIn} className="bg-slate-900 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] border border-slate-700 p-10 flex flex-col relative overflow-hidden transform lg:scale-105 z-20">
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                  <div className="absolute top-6 right-6">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider backdrop-blur-md">Populaire</span>
                  </div>
                  
                  <div className="mb-8 relative z-10 mt-2">
                     <h3 className="text-2xl font-bold text-white mb-2">Plan Standard</h3>
                     <p className="text-slate-400">L'idéal pour les petites écoles</p>
                  </div>
                  <div className="mb-8 relative z-10 flex items-baseline gap-2">
                     <span className="text-5xl font-extrabold text-white tracking-tight">7 000</span>
                     <span className="text-xl font-bold text-white">FCFA</span>
                     <span className="text-slate-400 font-medium">/ mois</span>
                  </div>
                  <ul className="space-y-5 mb-10 flex-1 relative z-10">
                     <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Jusqu'à 500 élèves</span></li>
                     <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Inscriptions et classes illimitées</span></li>
                     <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Suivi financier et paiements</span></li>
                     <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Reçus et bulletins automatisés</span></li>
                     <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Portail Parents interactif</span></li>
                     <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Support prioritaire (Chat/Email)</span></li>
                  </ul>
                  <Link href="/inscription-ecole" className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-white hover:from-emerald-400 hover:to-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all text-center relative z-10 mt-auto transform hover:-translate-y-1">
                     S'abonner maintenant
                  </Link>
                  {/* Subtle Background glow inside card */}
                  <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>
               </motion.div>

               {/* Plan Pro (Right) */}
               <motion.div variants={fadeIn} className="bg-[#006039] rounded-3xl lg:rounded-l-none shadow-[0_8px_30px_rgb(0,0,0,0.15)] border border-[#004d2e] p-10 flex flex-col relative overflow-hidden transition-all z-10 lg:z-10">
                  <div className="absolute top-6 right-6">
                    <span className="bg-emerald-100 text-[#006039] border border-emerald-200 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">Recommandé</span>
                  </div>
                  <div className="mb-8 mt-2 relative z-10">
                     <h3 className="text-2xl font-bold text-white mb-2">Plan Pro</h3>
                     <p className="text-emerald-100/80">Pour les grands établissements</p>
                  </div>
                  <div className="mb-8 flex items-baseline gap-2 relative z-10">
                     <span className="text-5xl font-extrabold text-white tracking-tight">9 900</span>
                     <span className="text-xl font-bold text-white">FCFA</span>
                     <span className="text-emerald-200/80 font-medium">/ mois</span>
                  </div>
                  <ul className="space-y-5 mb-10 flex-1 relative z-10">
                     <li className="flex items-start gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" /> <span className="font-medium">Élèves illimités</span></li>
                     <li className="flex items-start gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Toutes les fonctions Standard</span></li>
                     <li className="flex items-start gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Gestion multi-campus</span></li>
                     <li className="flex items-start gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Ressources Humaines (Paie)</span></li>
                     <li className="flex items-start gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Envoi de SMS aux parents</span></li>
                     <li className="flex items-start gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Support VIP 24/7 (Appel/WhatsApp)</span></li>
                  </ul>
                  <Link href="/inscription-ecole" className="w-full py-4 rounded-2xl bg-white font-bold text-[#006039] hover:bg-slate-100 transition-all text-center block mt-auto relative z-10 shadow-lg">
                     Passer à Pro
                  </Link>
                  {/* Subtle Background glow inside card */}
                  <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute -top-24 -left-24 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>
               </motion.div>
            </motion.div>
           </div>
        </section>

        {/* Section Témoignages (#temoignages) */}
        <section id="temoignages" className="py-24 bg-white border-y border-slate-100">
          <div className="container mx-auto px-4 max-w-6xl">
            <motion.div 
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Ils font confiance à Scogestia</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">Découvrez ce que les directeurs et comptables pensent de notre plateforme.</p>
            </motion.div>

            <motion.div 
              className="flex overflow-x-auto snap-x snap-mandatory pb-4 md:grid md:grid-cols-3 gap-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              {[
                { name: "Kodjo E.", role: "Directeur Fondateur", text: "Scogestia a révolutionné la gestion de notre complexe scolaire. Fini les erreurs de calcul sur les bulletins et le suivi des impayés est devenu un jeu d'enfant." },
                { name: "Amina T.", role: "Comptable", text: "Avant, je passais des jours à pointer les reçus de scolarité. Maintenant, en quelques clics, j'ai la situation financière exacte de l'école. Un gain de temps énorme." },
                { name: "Jean-Paul M.", role: "Parent d'élève", text: "Pouvoir consulter les notes de mon fils directement sur mon téléphone me rassure. L'école est beaucoup plus transparente grâce à ce portail." }
              ].map((testimonial, i) => (
                <motion.div key={i} variants={fadeIn} className="bg-slate-50 p-8 rounded-2xl border border-slate-200 min-w-[85%] md:min-w-0 snap-center">
                  <div className="flex gap-1 mb-4 text-amber-400">
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                  <p className="text-slate-700 mb-6 italic leading-relaxed">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-[#006039] font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{testimonial.name}</div>
                      <div className="text-sm text-slate-500">{testimonial.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Section FAQ (#faq) */}
        <section id="faq" className="py-24 bg-slate-50">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div 
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Questions Fréquentes</h2>
              <p className="text-lg text-slate-600">Vous avez des questions ? Nous avons les réponses.</p>
            </motion.div>

            <motion.div 
              className="space-y-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {[
                { q: "Faut-il installer un logiciel sur mon ordinateur ?", a: "Absolument pas ! Scogestia est un logiciel 100% web (en nuage). Vous n'avez besoin que d'un navigateur internet (Chrome, Safari, Edge) et d'une connexion internet. Vous pouvez vous connecter depuis n'importe quel ordinateur ou téléphone." },
                { q: "Mes données sont-elles en sécurité ?", a: "Oui. La sécurité est notre priorité absolue. Nous utilisons une architecture qui garantit que vos données sont strictement isolées de celles des autres écoles. Les sauvegardes sont effectuées quotidiennement sur des serveurs sécurisés." },
                { q: "Les parents doivent-ils payer pour utiliser l'application ?", a: "Non. L'abonnement est payé uniquement par l'établissement scolaire. Les parents bénéficient d'un accès totalement gratuit à leur portail pour suivre l'évolution de leurs enfants." },
                { q: "Comment se passe l'intégration de mes anciens élèves (Excel) ?", a: "Nous vous fournissons un fichier modèle Excel. Il vous suffit de copier-coller vos listes actuelles dedans et de nous le transmettre, ou d'utiliser notre outil d'importation. Notre équipe de support peut vous accompagner." }
              ].map((faq, i) => (
                <motion.details key={i} variants={fadeIn} className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer">
                   <summary className="flex items-center justify-between p-6 font-semibold text-slate-900 hover:text-violet-600 transition-colors select-none">
                      {faq.q}
                      <span className="text-violet-400">
                        <svg className="block group-open:hidden" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M12 5v14M5 12h14"></path></svg>
                        <svg className="hidden group-open:block" fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M5 12h14"></path></svg>
                      </span>
                   </summary>
                   <div className="p-6 pt-0 text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                      {faq.a}
                   </div>
                </motion.details>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Call to Action Pre-Footer */}
        <section className="py-20 relative bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="bg-slate-900 rounded-[2.5rem] relative overflow-hidden shadow-2xl max-w-5xl mx-auto p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10">
              
              {/* Effet lumineux de fond dans la carte CTA */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="relative z-10 flex-1"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-sans">
                  Prêt à <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-emerald-300">simplifier</span> la gestion ?
                </h2>
                <p className="text-slate-400 text-lg md:text-xl">
                  Rejoignez les établissements qui utilisent déjà Scogestia.
                </p>
              </motion.div>
              
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="relative z-10"
              >
                <Link 
                  href="/inscription-ecole"
                  className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-8 text-lg font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-full transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  Démarrer mon essai gratuit
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer & Contact (#contact) */}
      <footer id="contact" className="bg-[#09090b] text-slate-300 pt-16 pb-10 relative overflow-hidden border-t-2 border-violet-900/30">

        {/* Filigrane Géant SCOGESTIA (iziSAAS style) */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full flex justify-center pointer-events-none select-none z-0">
          <h2 className="text-[12vw] sm:text-[180px] font-black leading-none text-white/[0.03] tracking-tighter mix-blend-overlay">
            SCOGESTIA
          </h2>
        </div>

        <div className="container mx-auto px-4 relative z-10 pt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            
            {/* Colonne 1: A propos */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <img src="/logo-scogestia-transparent.png" alt="Scogestia Logo" className="h-12 w-auto object-contain" />
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                La gestion scolaire simplifiée. Le système d'information de gestion de l'éducation (SIGE) moderne qui connecte les directeurs, les enseignants et les parents.
              </p>
            </div>

            {/* Colonne 2: Liens Rapides */}
            <div>
              <h4 className="text-white font-semibold mb-6">Liens Rapides</h4>
              <ul className="space-y-4">
                <li><Link href="#accueil" className="hover:text-white transition-colors flex items-center gap-2">Accueil</Link></li>
                <li><Link href="#fonctionnalites" className="hover:text-white transition-colors flex items-center gap-2">Fonctionnalités</Link></li>
                <li><Link href="#tarifs" className="hover:text-white transition-colors flex items-center gap-2">Tarifs</Link></li>
                <li><Link href="#temoignages" className="hover:text-white transition-colors flex items-center gap-2">Témoignages</Link></li>
              </ul>
            </div>

            {/* Colonne 3: Contact */}
            <div>
              <h4 className="text-white font-semibold mb-6">Nous contacter</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#006039] mt-0.5" />
                  <span className="text-slate-400">Lomé - Togo</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#006039]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="text-slate-400">92 10 28 68</span>
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
            <div className="flex flex-wrap justify-center md:justify-end gap-6 mt-4 md:mt-0">
              <Link href="/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
              <Link href="/conditions-utilisation" className="hover:text-white transition-colors">Conditions d'utilisation</Link>
              <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
            </div>
          </div>
        </div>
      </footer>
      {/* Modal de Démo Vidéo */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setDemoModalOpen(false)}></div>
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl animate-[fadeIn_0.3s_ease-out]">
            {/* Bouton Fermer */}
            <button 
              onClick={() => setDemoModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black text-white rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Conteneur Vidéo */}
            <div className="relative pt-[56.25%] w-full bg-slate-800">
              {/* Remplacer cette div par une vraie iframe YouTube/Vimeo plus tard */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-[#006039]/20 flex items-center justify-center mb-6">
                  <Play className="w-10 h-10 text-[#006039] ml-1" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Vidéo de présentation</h3>
                <p className="text-slate-300 max-w-md">
                  Ici, vous pourrez insérer votre vidéo de présentation (Youtube ou Loom) montrant les fonctionnalités principales de Scogestia.
                </p>
                <div className="mt-8 px-4 py-2 bg-slate-900 rounded-lg font-mono text-sm text-slate-400 border border-slate-700">
                  {`<iframe src="https://www.youtube.com/embed/VOTRE_VIDEO" ...></iframe>`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
