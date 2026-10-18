"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link'
import { motion, AnimatePresence, useMotionValue, useSpring, type Variants } from 'framer-motion'
import { 
  ShieldCheck, Cloud, Zap, CheckCircle2, LayoutDashboard, CreditCard, Users, 
  ArrowRight, BarChart, Smartphone, Globe, Mail, Phone, MapPin, Star, PlayCircle, 
  Lock, X, Play, Wallet, TrendingUp, Building2, Settings, MessageSquare, GraduationCap,
  School, UserCheck, HeartHandshake, Sparkles, ChevronRight, FileCheck, FileSpreadsheet
} from 'lucide-react'

// Animation Variants
const fadeIn: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

function MagneticArrowButton({ href, children }: { href: string; children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 16, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 260, damping: 16, mass: 0.4 });
  const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));

  const handleMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set(clamp((e.clientX - (r.left + r.width / 2)) * 0.1, 8));
    y.set(clamp((e.clientY - (r.top + r.height / 2)) * 0.35, 6));
  };
  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <Link
      href={href}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group inline-flex h-14 w-full items-center justify-between gap-5 rounded-full bg-white py-1.5 pl-8 pr-1.5 text-base font-bold tracking-tight text-[#050B18] shadow-[0_10px_40px_-8px_rgba(16,185,129,0.55),inset_0_-2px_4px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_-8px_rgba(16,185,129,0.7)] sm:w-auto"
    >
      <span>{children}</span>
      <motion.span
        style={{ x: springX, y: springY }}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-[#006039] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] transition-colors duration-300 group-hover:bg-emerald-500"
      >
        <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" />
      </motion.span>
    </Link>
  );
}

function BentoCard({ className = '', glow, children }: { className?: string; glow: string; children: React.ReactNode }) {
  return (
    <motion.div
      variants={fadeIn}
      className={`group relative rounded-[2rem] bg-white/[0.04] p-1.5 ring-1 ring-white/[0.08] transition-all duration-500 hover:-translate-y-1 hover:ring-white/[0.16] ${className}`}
    >
      <div className="relative h-full overflow-hidden rounded-[1.65rem] bg-gradient-to-b from-[#0b1628] to-[#070f1d] ring-1 ring-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
        <div aria-hidden className={`pointer-events-none absolute -top-24 left-1/2 h-48 w-3/4 -translate-x-1/2 rounded-full bg-gradient-to-b ${glow} to-transparent opacity-60 blur-3xl transition-opacity duration-500 group-hover:opacity-100`} />
        {children}
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeScreenTab, setActiveScreenTab] = useState<'dashboard' | 'finance' | 'bulletins'>('dashboard');
  const testimonialsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (testimonialsScrollRef.current && window.innerWidth < 768) {
        const { scrollLeft, scrollWidth, clientWidth } = testimonialsScrollRef.current;
        // If we reached the end (with a small margin of error)
        if (Math.ceil(scrollLeft + clientWidth) >= scrollWidth - 10) {
          testimonialsScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Scroll by one item's width plus gap
          const itemWidth = testimonialsScrollRef.current.children[0]?.clientWidth || 0;
          testimonialsScrollRef.current.scrollBy({ left: itemWidth + 32, behavior: 'smooth' });
        }
      }
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050B18] font-sans selection:bg-emerald-400/30 selection:text-white">
      {/* Navigation Sticky */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#050B18]/70 backdrop-blur-xl shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="#accueil" className="flex items-center gap-2">
              <img src="/logo-scogestia-transparent.png" alt="Scogestia Logo" className="h-14 w-auto object-contain drop-shadow-sm" />
            </Link>
          </div>
          
          {/* Menu Principal */}
          <nav className="hidden lg:flex items-center gap-7">
            <Link href="#accueil" className="relative text-sm font-medium text-slate-300 hover:text-white transition-colors group">
              Accueil
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-emerald-400 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#fonctionnalites" className="relative text-sm font-medium text-slate-300 hover:text-white transition-colors group">
              Fonctionnalités
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-emerald-400 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#apercu" className="relative text-sm font-medium text-slate-300 hover:text-white transition-colors group">
              Aperçu en action
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-emerald-400 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#espaces" className="relative text-sm font-medium text-slate-300 hover:text-white transition-colors group">
              Espaces
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-emerald-400 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#tarifs" className="relative text-sm font-medium text-slate-300 hover:text-white transition-colors group">
              Tarifs
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-emerald-400 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#temoignages" className="relative text-sm font-medium text-slate-300 hover:text-white transition-colors group">
              Témoignages
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-emerald-400 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#faq" className="relative text-sm font-medium text-slate-300 hover:text-white transition-colors group">
              FAQ
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-emerald-400 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#contact" className="relative text-sm font-medium text-slate-300 hover:text-white transition-colors group">
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-emerald-400 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              href="/connexion" 
              className="hidden sm:inline-flex items-center justify-center h-10 px-4 sm:px-6 text-sm font-medium text-slate-200 bg-white/[0.04] ring-1 ring-white/10 hover:bg-white/[0.08] hover:text-white rounded-full transition-colors"
            >
              Se connecter
            </Link>
            <Link 
              href="/inscription-ecole"
              className="inline-flex items-center justify-center h-10 px-4 sm:px-6 text-sm font-semibold text-white bg-[#006039] hover:bg-emerald-600 rounded-full transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_8px_24px_-6px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 whitespace-nowrap"
            >
              Créer mon école
            </Link>
            <button 
              className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
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
              className="lg:hidden bg-[#050B18]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-xl overflow-hidden"
            >
              <div className="flex flex-col p-4 gap-4">
                <Link href="#accueil" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-slate-200 p-2 hover:bg-white/[0.06] rounded-lg">Accueil</Link>
                <Link href="#fonctionnalites" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-slate-200 p-2 hover:bg-white/[0.06] rounded-lg">Fonctionnalités</Link>
                <Link href="#comment-ca-marche" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-slate-200 p-2 hover:bg-white/[0.06] rounded-lg">Comment ça marche</Link>
                <Link href="#tarifs" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-slate-200 p-2 hover:bg-white/[0.06] rounded-lg">Tarifs</Link>
                <Link href="#temoignages" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-slate-200 p-2 hover:bg-white/[0.06] rounded-lg">Témoignages</Link>
                <Link href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-slate-200 p-2 hover:bg-white/[0.06] rounded-lg">FAQ</Link>
                <Link href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-slate-200 p-2 hover:bg-white/[0.06] rounded-lg">Contact</Link>
                <hr className="border-white/[0.06] my-2" />
                <Link
                  href="/connexion"
                  onClick={() => setMobileMenuOpen(false)}
                  className="sm:hidden flex items-center justify-center h-12 text-base font-medium text-slate-100 bg-white/[0.04] ring-1 ring-white/10 rounded-xl"
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
        <section id="accueil" className="relative overflow-hidden bg-[#050B18] pt-16 pb-24 lg:pt-24 lg:pb-32">
          {/* Aurores émeraude & cyan */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <motion.div
              className="absolute -top-40 left-1/2 h-[640px] w-[820px] -translate-x-[75%] rounded-full bg-[#10b981]/20 blur-[140px]"
              animate={{ x: [0, 50, 0], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -top-24 left-1/2 h-[560px] w-[720px] translate-x-[5%] rounded-full bg-[#38bdf8]/15 blur-[150px]"
              animate={{ x: [0, -40, 0], opacity: [1, 0.65, 1] }}
              transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="absolute top-1/2 -left-32 h-[420px] w-[420px] rounded-full bg-[#043323]/70 blur-[120px]" />
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_72%)]" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#050B18]" />
          </div>

          <div className="container relative z-10 mx-auto px-4">
            <motion.div
              className="mx-auto flex max-w-5xl flex-col items-center text-center"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {/* Eyebrow flottant */}
              <motion.div variants={fadeIn}>
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="mb-8 inline-flex items-center gap-2.5 rounded-full bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200 ring-1 ring-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_30px_-8px_rgba(16,185,129,0.4)] backdrop-blur-xl sm:text-xs"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Plateforme N°1 de Gestion de l'École en Afrique
                </motion.div>
              </motion.div>

              <motion.h1
                variants={fadeIn}
                className="mb-8 font-sans text-[2.6rem] font-extrabold leading-[0.98] tracking-[-0.04em] text-white sm:text-7xl lg:text-[5.5rem] xl:text-[6.5rem]"
              >
                Plateforme de gestion
                <br />
                <span className="inline-block bg-gradient-to-r from-emerald-200 via-white to-cyan-200 bg-clip-text pb-2 pr-3 font-serif text-[1.18em] font-normal italic tracking-[-0.02em] text-transparent">
                  scolaire intelligente.
                </span>
              </motion.h1>

              <motion.p variants={fadeIn} className="mb-12 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                Le logiciel de gestion scolaire tout-en-un conçu pour le <span className="font-semibold text-white">préscolaire, l'école primaire, le collège et le lycée</span> : inscriptions, suivi des notes, bulletins automatiques, caisse certifiée et communication directe à travers la plateforme Scogestia (messages vocaux & audios, SMS et WhatsApp) entre l'établissement, les enseignants et les parents d'élèves.
              </motion.p>

              <motion.div variants={fadeIn} className="flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
                <MagneticArrowButton href="/inscription-ecole">Essai gratuit de 14 jours</MagneticArrowButton>
                <button
                  onClick={() => setDemoModalOpen(true)}
                  className="group inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-white/[0.04] px-8 text-base font-semibold text-white ring-1 ring-white/15 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] transition-all duration-300 hover:bg-white/[0.08] hover:ring-emerald-400/40 sm:w-auto"
                >
                  <PlayCircle className="h-5 w-5 text-emerald-400 transition-transform duration-300 group-hover:scale-110" />
                  Voir la démo
                </button>
              </motion.div>

              <motion.div variants={fadeIn} className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-medium text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Aucune carte requise
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Support WhatsApp 24/7
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Paiements en FCFA
                </div>
              </motion.div>
            </motion.div>

            {/* Mockup Double-Bezel */}
            <motion.div
              className="relative mx-auto mt-20 max-w-6xl lg:mt-24"
              initial={{ opacity: 0, y: 60, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div aria-hidden className="absolute -inset-x-10 -top-10 bottom-10 -z-10 rounded-full bg-gradient-to-r from-emerald-500/25 via-cyan-400/15 to-emerald-500/25 blur-[90px]" />
              <div className="rounded-[2.25rem] bg-white/[0.04] p-2 ring-1 ring-white/10 shadow-[0_50px_120px_-30px_rgba(16,185,129,0.3),0_30px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl md:p-3">
                <div className="overflow-hidden rounded-[1.7rem] bg-[#070d1c] ring-1 ring-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                  <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                    </div>
                    <div className="mx-auto flex max-w-xs flex-1 items-center justify-center gap-2 rounded-lg bg-black/30 px-3 py-1 text-[11px] text-slate-400 ring-1 ring-white/[0.06]">
                      <Lock className="h-3 w-3 text-emerald-400" />
                      scogestia.com/admin
                    </div>
                    <div className="w-10" />
                  </div>
                  <img
                    src="/image_landing_page1.png"
                    alt="Scogestia - Gestion scolaire intuitive"
                    className="block h-auto w-full object-contain"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section Fonctionnalités & Bento (#fonctionnalites) */}
        <section id="fonctionnalites" className="relative z-10 overflow-hidden bg-[#050B18] py-24 lg:py-32">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[#043323]/50 blur-[140px]" />
            <div className="absolute bottom-0 right-0 h-[420px] w-[520px] rounded-full bg-[#38bdf8]/[0.07] blur-[140px]" />
          </div>

          <div className="container relative mx-auto max-w-6xl px-4">
            {/* EN-TÊTE DE SECTION */}
            <motion.div
              className="mb-16 flex flex-col items-center text-center lg:mb-20"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300 ring-1 ring-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
                <Sparkles className="h-3.5 w-3.5" /> Les piliers de Scogestia
              </div>
              <h2 className="mb-6 max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
                Un contrôle total sur l'ensemble de{' '}
                <span className="inline-block bg-gradient-to-r from-emerald-200 via-white to-cyan-200 bg-clip-text pb-1 pr-2 font-serif text-[1.15em] font-normal italic tracking-[-0.01em] text-transparent">
                  votre établissement.
                </span>
              </h2>
              <p className="max-w-2xl text-lg leading-relaxed text-slate-300">
                Des outils financiers puissants aux carnets de notes automatisés, chaque module est conçu pour être invisible et efficace.
              </p>
            </motion.div>

            {/* BANDEAU DE RÉASSURANCE */}
            <motion.div
              className="mx-auto mb-6 grid max-w-5xl grid-cols-1 overflow-hidden rounded-3xl bg-white/[0.03] ring-1 ring-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] md:grid-cols-3 md:divide-x md:divide-white/[0.06]"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={staggerContainer}
            >
              {[
                { icon: ShieldCheck, tone: 'text-emerald-300 bg-emerald-400/10 ring-emerald-400/20', title: 'Données 100% sécurisées', desc: "Base de données isolée et cryptée pour chaque école. Vos informations ne fuient jamais." },
                { icon: Cloud, tone: 'text-cyan-300 bg-cyan-400/10 ring-cyan-400/20', title: 'Accessible partout', desc: "100% Cloud sécurisé : accédez à la scolarité de vos élèves depuis n'importe quel appareil." },
                { icon: Zap, tone: 'text-amber-200 bg-amber-300/10 ring-amber-300/20', title: 'Ultra-rapide', desc: "Interface ultra-légère, optimisée pour fonctionner même avec une connexion limitée." },
              ].map((item) => (
                <motion.div key={item.title} variants={fadeIn} className="flex items-start gap-4 p-6 lg:p-7">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${item.tone}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-[15px] font-bold tracking-tight text-white">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-400">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* BENTO GRID ASYMÉTRIQUE */}
            <motion.div
              className="grid grid-cols-1 gap-4 md:grid-cols-12 lg:gap-5"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerContainer}
            >
              {/* Finances & Recouvrement FCFA */}
              <BentoCard className="md:col-span-7" glow="from-amber-300/20">
                <img src="/images/finance.png" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-25 transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070f1d] via-[#070f1d]/80 to-[#070f1d]/30" />
                <div className="relative flex h-full min-h-[420px] flex-col justify-between p-8 lg:p-10">
                  <div>
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-200 ring-1 ring-inset ring-amber-300/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <h3 className="mb-3 text-3xl font-extrabold tracking-[-0.03em] text-white lg:text-4xl">
                      Finances & <span className="font-serif text-[1.12em] font-normal italic text-amber-200">Recouvrement</span> FCFA
                    </h3>
                    <p className="max-w-lg text-base leading-relaxed text-slate-300 lg:text-lg">
                      Visualisez instantanément les impayés, relancez les parents par SMS, et automatisez toute votre comptabilité sans tableaux croisés.
                    </p>
                  </div>
                  <div className="mt-8 rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md">
                    <div className="mb-3 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Encaissé ce trimestre</p>
                        <p className="mt-1 text-2xl font-extrabold tabular-nums tracking-tight text-white">
                          12 450 000 <span className="text-sm font-bold text-amber-200">FCFA</span>
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-bold tabular-nums text-emerald-300 ring-1 ring-inset ring-emerald-400/25">87 % recouvré</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-amber-300 via-emerald-400 to-emerald-300" />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-300">
                      {['Caisse certifiée', 'Reçus QR', 'Relances SMS', 'Mobile Money'].map((t) => (
                        <span key={t} className="rounded-full bg-white/[0.05] px-2.5 py-1 ring-1 ring-inset ring-white/[0.08]">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </BentoCard>

              {/* Bulletins & Carnets scolaires */}
              <BentoCard className="md:col-span-5" glow="from-emerald-400/20">
                <img src="/images/academie.png" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-20 transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070f1d] via-[#070f1d]/85 to-[#070f1d]/40" />
                <div className="relative flex h-full min-h-[420px] flex-col justify-between p-8 lg:p-10">
                  <div>
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                      <FileCheck className="h-6 w-6" />
                    </div>
                    <h3 className="mb-3 text-2xl font-extrabold tracking-[-0.03em] text-white lg:text-3xl">
                      Bulletins <span className="font-serif text-[1.12em] font-normal italic text-emerald-300">automatisés</span> & carnets officiels
                    </h3>
                    <p className="text-base leading-relaxed text-slate-300">
                      Saisie fluide des notes, moyennes pondérées, rangs et carnets scolaires officiels générés en un clic, prêts à imprimer en PDF.
                    </p>
                  </div>
                  <div className="mt-8 rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Moyenne générale</p>
                        <p className="mt-1 text-3xl font-extrabold tabular-nums tracking-tight text-white">14,82<span className="text-sm font-bold text-slate-400"> / 20</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Rang</p>
                        <p className="mt-1 text-2xl font-extrabold tabular-nums text-emerald-300">3<sup className="text-xs">e</sup><span className="text-sm font-bold text-slate-500"> / 42</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </BentoCard>

              {/* Portail Parents & Alertes */}
              <BentoCard className="md:col-span-5" glow="from-cyan-400/20">
                <img src="/images/parents.png" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-top opacity-20 transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070f1d] via-[#070f1d]/85 to-[#070f1d]/40" />
                <div className="relative flex h-full min-h-[420px] flex-col justify-between p-8 lg:p-10">
                  <div>
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-inset ring-cyan-400/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                      <Smartphone className="h-6 w-6" />
                    </div>
                    <h3 className="mb-3 text-2xl font-extrabold tracking-[-0.03em] text-white lg:text-3xl">
                      <span className="font-serif text-[1.12em] font-normal italic text-cyan-300">Portail</span> Parents & alertes WhatsApp/SMS
                    </h3>
                    <p className="text-base leading-relaxed text-slate-300">
                      Transparence totale sur le téléphone des parents : notes, absences, et paiements, avec des alertes directes.
                    </p>
                  </div>
                  <div className="mt-8 space-y-2.5">
                    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366] ring-1 ring-inset ring-[#25D366]/30"><MessageSquare className="h-4 w-4" /></span>
                      <p className="text-xs font-medium text-slate-200">Paiement reçu : <span className="font-bold tabular-nums text-white">25 000 FCFA</span></p>
                    </div>
                    <div className="ml-6 flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300 ring-1 ring-inset ring-cyan-400/30"><Smartphone className="h-4 w-4" /></span>
                      <p className="text-xs font-medium text-slate-200">SMS : absence signalée ce matin</p>
                    </div>
                  </div>
                </div>
              </BentoCard>

              {/* Emplois du temps & Registre d'appel */}
              <BentoCard className="md:col-span-7" glow="from-emerald-400/20">
                <img src="/images/gestion_scolaire_african.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-20 transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070f1d] via-[#070f1d]/85 to-[#070f1d]/40" />
                <div className="relative flex h-full min-h-[420px] flex-col justify-between p-8 lg:p-10">
                  <div>
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300 ring-1 ring-inset ring-emerald-400/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <h3 className="mb-3 text-3xl font-extrabold tracking-[-0.03em] text-white lg:text-4xl">
                      Emplois du temps & <span className="font-serif text-[1.12em] font-normal italic text-emerald-300">registre d'appel</span>
                    </h3>
                    <p className="max-w-lg text-base leading-relaxed text-slate-300 lg:text-lg">
                      Classes, enseignants, emplois du temps et appel numérique quotidien : une architecture claire pour gérer des milliers d'élèves.
                    </p>
                  </div>
                  <div className="mt-8 rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md">
                    <div className="grid grid-cols-5 gap-2">
                      {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'].map((d, i) => (
                        <div key={d} className="space-y-1.5">
                          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{d}</p>
                          <div className={`h-6 rounded-md ring-1 ring-inset ${i % 2 === 0 ? 'bg-emerald-400/15 ring-emerald-400/25' : 'bg-cyan-400/15 ring-cyan-400/25'}`} />
                          <div className={`h-6 rounded-md ring-1 ring-inset ${i % 2 === 0 ? 'bg-cyan-400/15 ring-cyan-400/25' : 'bg-amber-300/15 ring-amber-300/25'}`} />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs font-medium text-slate-300">
                      <span className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-emerald-300" /> Registre d'appel clôturé</span>
                      <span className="font-bold tabular-nums text-white">28 / 30 présents</span>
                    </div>
                  </div>
                </div>
              </BentoCard>
            </motion.div>
          </div>
        </section>

        {/* Section Aperçu Logiciel en Action (#apercu) */}
        <section id="apercu" className="py-24 lg:py-32 bg-[#050B18] text-white relative overflow-hidden border-t border-white/[0.04]">
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none"></div>

          <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <motion.div 
              className="text-center mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Interface Haute Fidélité
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Découvrez la puissance de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-emerald-200">Scogestia en action</span>
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Fini les tableaux confus. Visualisez vos données scolaires, vos encaissements et vos bulletins avec une clarté absolue.
              </p>
            </motion.div>

            {/* Onglets de navigation */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <button
                type="button"
                onClick={() => setActiveScreenTab('dashboard')}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all shadow-md cursor-pointer ${
                  activeScreenTab === 'dashboard'
                    ? 'bg-[#006039] text-white shadow-emerald-500/20 scale-105'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> Tableau de Bord Direction
              </button>
              <button
                type="button"
                onClick={() => setActiveScreenTab('finance')}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all shadow-md cursor-pointer ${
                  activeScreenTab === 'finance'
                    ? 'bg-[#006039] text-white shadow-emerald-500/20 scale-105'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Wallet className="w-4 h-4" /> Caisse & Reçus avec QR Code
              </button>
              <button
                type="button"
                onClick={() => setActiveScreenTab('bulletins')}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all shadow-md cursor-pointer ${
                  activeScreenTab === 'bulletins'
                    ? 'bg-[#006039] text-white shadow-emerald-500/20 scale-105'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <GraduationCap className="w-4 h-4" /> Bulletins Scolaires Automatiques
              </button>
            </div>

            {/* Cadre de navigateur Mac */}
            <motion.div 
              className="relative max-w-5xl mx-auto rounded-[2.25rem] p-2 md:p-3 bg-white/[0.04] ring-1 ring-white/10 shadow-[0_50px_120px_-30px_rgba(16,185,129,0.25),0_30px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="overflow-hidden rounded-[1.7rem] bg-slate-950 ring-1 ring-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
              {/* Barre de contrôle du navigateur */}
              <div className="flex items-center gap-3 px-5 py-3.5 bg-slate-900 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <div className="flex-1 max-w-md mx-auto bg-slate-950 rounded-lg px-4 py-1.5 text-xs text-slate-400 font-mono flex items-center justify-center gap-2 border border-slate-800">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>https://scogestia.com/admin/{activeScreenTab === 'dashboard' ? 'dashboard' : activeScreenTab === 'finance' ? 'finance/caisse' : 'academique/bulletins'}</span>
                </div>
              </div>

              {/* Contenu visuel selon l'onglet */}
              <div className="relative aspect-[16/9] w-full bg-slate-950 overflow-hidden">
                {activeScreenTab === 'dashboard' && (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img 
                      src="/hero-landing.png" 
                      alt="Tableau de bord Scogestia" 
                      className="w-full h-full object-cover object-top transition-opacity duration-300" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-40"></div>
                  </div>
                )}
                {activeScreenTab === 'finance' && (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img 
                      src="/images/finance.png" 
                      alt="Caisse et Finance Scogestia" 
                      className="w-full h-full object-cover object-top transition-opacity duration-300" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-40"></div>
                  </div>
                )}
                {activeScreenTab === 'bulletins' && (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img 
                      src="/images/academie.png" 
                      alt="Bulletins et Académique Scogestia" 
                      className="w-full h-full object-cover object-top transition-opacity duration-300" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-40"></div>
                  </div>
                )}
              </div>
              </div>
            </motion.div>

            {/* 4 Points forts sous l'aperçu */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 max-w-5xl mx-auto">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Statistiques en direct</p>
                  <p className="text-[11px] text-slate-400">Taux de recouvrement instantané</p>
                </div>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Bulletins officiels</p>
                  <p className="text-[11px] text-slate-400">Calculs pondérés et rangs</p>
                </div>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Reçus certifiés QR</p>
                  <p className="text-[11px] text-slate-400">Clôture journalière de caisse</p>
                </div>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Alertes WhatsApp</p>
                  <p className="text-[11px] text-slate-400">Relances et absences directes</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Section 3 Espaces Dédiés & Sécurisés (#espaces) */}
        <section id="espaces" className="py-24 bg-white relative overflow-hidden">
          <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <motion.div 
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-semibold text-xs uppercase tracking-wider">
                <Users className="w-4 h-4" /> Espaces Dédiés
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
                Une interface conçue sur mesure pour <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#006039] to-emerald-500">chaque rôle</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Chaque utilisateur n'accède qu'à ce qui le concerne, avec une sécurité totale et une simplicité d'utilisation maximale.
              </p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {/* Carte 1 : Direction & Administration */}
              <motion.div variants={fadeIn} className="flex flex-col bg-slate-50 rounded-3xl p-8 border border-slate-200/80 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                <div className="w-16 h-16 rounded-2xl bg-[#006039] text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-900/20 group-hover:scale-105 transition-transform">
                  <Building2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Espace Direction</h3>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed flex-1">
                  Pilotez votre établissement en toute sérénité : effectifs, inscriptions, comptabilité, caisse certifiée, édition et validation des bulletins scolaires automatiques et relances d'impayés.
                </p>
                <div className="space-y-2 mb-8 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Vision 360° en temps réel</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Bulletins automatiques & bilans officiels</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Journal de caisse et rapports financiers</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Export Excel et bilans comptables PDF</div>
                </div>
                <Link
                  href="/connexion"
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-[#006039] text-white font-bold text-sm text-center transition-colors flex items-center justify-center gap-2"
                >
                  <span>Connexion Direction</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>

              {/* Carte 2 : Enseignants & Professeurs */}
              <motion.div variants={fadeIn} className="flex flex-col bg-slate-50 rounded-3xl p-8 border border-slate-200/80 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Espace Professeur</h3>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed flex-1">
                  Consacrez-vous à la pédagogie : saisie rapide des devoirs, notes trimestrielles, appel numérique quotidien avec fermeture du registre d'appel et calcul automatique instantané des présences.
                </p>
                <div className="space-y-2 mb-8 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Saisie des notes sur mobile & PC</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Appel numérique quotidien</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Fermeture du registre & calcul automatique</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Cahier de textes et suivi des cours</div>
                </div>
                <Link
                  href="/connexion"
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-sm text-center transition-colors flex items-center justify-center gap-2"
                >
                  <span>Connexion Professeur</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>

              {/* Carte 3 : Parents & Familles */}
              <motion.div variants={fadeIn} className="flex flex-col bg-slate-50 rounded-3xl p-8 border border-slate-200/80 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                <div className="w-16 h-16 rounded-2xl bg-teal-700 text-white flex items-center justify-center mb-6 shadow-lg shadow-teal-700/20 group-hover:scale-105 transition-transform">
                  <Smartphone className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Espace Parent</h3>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed flex-1">
                  Suivez la scolarité de vos enfants 24h/24 : consultation des notes, bulletins en direct, retards et alertes par messages audios et SMS directement intégrés à la plateforme Scogestia.
                </p>
                <div className="space-y-2 mb-8 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Bulletins téléchargeables en direct</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Alertes messages audios & SMS via Scogestia</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Notifications WhatsApp directes</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Historique clair des paiements et solde</div>
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/connexion"
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-teal-700 text-white font-bold text-sm text-center transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Se connecter</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/activer-parent"
                    className="w-full py-2 text-center text-xs text-teal-700 hover:underline font-semibold"
                  >
                    Première connexion ? Activer mon compte parent
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Section Comment ça marche (#comment-ca-marche) */}
        <section id="comment-ca-marche" className="py-24 bg-white relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-emerald-50/60 rounded-full blur-[100px] -z-10"></div>
          
          <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <motion.div 
              className="text-center mb-24"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold text-sm tracking-wide uppercase shadow-sm">
                Déploiement Facile
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Prêt à l'emploi en <span className="font-serif italic font-normal text-[1.12em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500">3 étapes simples</span></h2>
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
                      blur: 'bg-emerald-400/20',
                      border: 'border-emerald-50',
                      text: 'text-emerald-700',
                      hoverBg: 'group-hover:bg-emerald-700',
                      hoverBorder: 'group-hover:border-emerald-100'
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
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Des tarifs simples, <span className="font-serif italic font-normal text-[1.12em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">sans surprise</span></h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">Commencez gratuitement, puis choisissez le plan qui correspond parfaitement à la taille de votre établissement.</p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
               {/* Plan Standard (Left) */}
               <motion.div variants={fadeIn} className="bg-slate-900 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] border border-slate-700 p-10 flex flex-col relative overflow-hidden z-10">
                  <div className="absolute top-0 right-0 bg-amber-400 text-amber-950 text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider z-20">Populaire</div>
                  <div className="mb-8 relative z-10 mt-2">
                     <h3 className="text-2xl font-bold text-white mb-2">Plan Standard</h3>
                     <p className="text-slate-400">Pour les petites écoles</p>
                  </div>
                  <div className="mb-8 flex items-baseline gap-2 relative z-10">
                     <span className="text-5xl font-extrabold text-white tracking-tight">7 000</span>
                     <span className="text-xl font-bold text-white">FCFA</span>
                     <span className="text-slate-400 font-medium">/ mois</span>
                  </div>
                  <ul className="space-y-5 mb-10 flex-1 relative z-10">
                     <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Jusqu'à 200 élèves</span></li>
                     <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Gestion des inscriptions et classes</span></li>
                     <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Suivi de la comptabilité et paiements</span></li>
                     <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Génération des reçus automatisée</span></li>
                     <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Saisie des notes et bulletins scolaires</span></li>
                     <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" /> <span>Portail Parents (Notes & Absences)</span></li>
                  </ul>
                  <Link href="/inscription-ecole" className="w-full py-4 rounded-2xl bg-emerald-600 font-bold text-white hover:bg-emerald-500 transition-colors text-center relative z-10 shadow-md block mt-auto">
                     S'abonner au Plan Standard
                  </Link>
                  <div className="absolute -bottom-24 -left-24 w-40 h-40 bg-emerald-900 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
               </motion.div>

               {/* Plan Pro (Center - Highlighted) */}
               <motion.div variants={fadeIn} className="bg-[#006039] rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.25)] p-10 flex flex-col relative overflow-hidden z-20">
                  <div className="absolute top-0 right-0 bg-emerald-100 text-[#006039] text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider z-20">Recommandé</div>
                  
                  <div className="mb-8 relative z-10 mt-2">
                     <h3 className="text-2xl font-bold text-white mb-2">Plan Pro</h3>
                     <p className="text-emerald-100/80">Pour les grands établissements</p>
                  </div>
                  <div className="mb-8 relative z-10 flex items-baseline gap-2">
                     <span className="text-5xl font-extrabold text-white tracking-tight">9 900</span>
                     <span className="text-xl font-bold text-white">FCFA</span>
                     <span className="text-emerald-200/80 font-medium">/ mois</span>
                  </div>
                  <ul className="space-y-5 mb-10 flex-1 relative z-10">
                     <li className="flex items-start gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" /> <span>Jusqu'à 400 élèves</span></li>
                     <li className="flex items-start gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" /> <span>Toutes les fonctionnalités Standard</span></li>
                     <li className="flex items-start gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" /> <span>Gestion multi-campus / multi-sites</span></li>
                     <li className="flex items-start gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" /> <span>Gestion des Ressources Humaines (Paie)</span></li>
                     <li className="flex items-start gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" /> <span>Envoi de SMS et Emails aux parents</span></li>
                     <li className="flex items-start gap-3 text-emerald-50"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" /> <span>Tableaux de bord et analytics poussés</span></li>
                  </ul>
                  <Link href="/inscription-ecole" className="w-full py-4 rounded-2xl bg-white font-bold text-[#006039] hover:bg-slate-50 transition-colors text-center relative z-10 shadow-lg block mt-auto">
                     S'abonner au Plan Pro
                  </Link>
                  <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-600 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                  <div className="absolute -top-24 -left-24 w-40 h-40 bg-emerald-500 rounded-full blur-3xl opacity-40 pointer-events-none"></div>
               </motion.div>

               {/* Plan Annuel (Right) */}
               <motion.div variants={fadeIn} className="bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.15)] border border-slate-700 p-10 flex flex-col relative overflow-hidden transition-all z-10 md:col-span-2 lg:col-span-1">
                  <div className="absolute top-0 right-0 bg-slate-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl z-20 uppercase tracking-wider shadow-sm">Annuel</div>
                  <div className="mb-8 mt-2 relative z-10">
                     <h3 className="text-2xl font-bold text-white mb-2">Plan Annuel</h3>
                     <p className="text-slate-400">Pour une tranquillité totale</p>
                  </div>
                  <div className="mb-8 flex items-baseline gap-2 relative z-10">
                     <span className="text-4xl font-extrabold text-white tracking-tight">80 900</span>
                     <span className="text-xl font-bold text-white">FCFA</span>
                     <span className="text-slate-500 font-medium">/ an</span>
                  </div>
                  <ul className="space-y-5 mb-10 flex-1 relative z-10">
                     <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" /> <span className="font-medium">Nombre d'élèves illimité</span></li>
                     <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" /> <span>Toutes les fonctionnalités Pro incluses</span></li>
                     <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" /> <span>Déploiement sécurisé sur serveur dédié</span></li>
                     <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" /> <span>Personnalisation avancée de l'interface</span></li>
                     <li className="flex items-start gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" /> <span>Support technique prioritaire 24/7</span></li>
                  </ul>
                  <Link href="/inscription-ecole" className="w-full py-4 rounded-2xl bg-blue-600 font-bold text-white hover:bg-blue-500 transition-colors text-center relative z-10 shadow-lg block mt-auto">
                     S'abonner au Plan Annuel
                  </Link>
               </motion.div>
            </motion.div>
           </div>
        </section>

        {/* Section Témoignages (#temoignages) */}
        <section id="temoignages" className="py-24 bg-[#0b0f19] relative overflow-hidden">
          {/* Decorative background gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <motion.div 
              className="text-center mb-20"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm tracking-wide uppercase shadow-sm backdrop-blur-sm">
                Témoignages
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Ils font confiance à <span className="font-serif italic font-normal text-[1.12em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">Scogestia</span></h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">Découvrez ce que les directeurs et comptables pensent de notre plateforme après avoir sauté le pas.</p>
            </motion.div>

            <motion.div 
              ref={testimonialsScrollRef}
              className="flex overflow-x-auto snap-x snap-mandatory pb-8 md:grid md:grid-cols-3 gap-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              {[
                { name: "Kodjo E.", role: "Directeur Fondateur", text: "Scogestia a totalement révolutionné la gestion de notre complexe scolaire. Fini les erreurs de calcul sur les bulletins et le suivi des impayés est devenu un jeu d'enfant absolu." },
                { name: "Amina T.", role: "Comptable Principale", text: "Avant, je passais des jours à pointer les reçus de scolarité. Maintenant, en quelques clics, j'ai la situation financière exacte de l'école. Un gain de temps monumental." },
                { name: "Jean-Paul M.", role: "Parent d'élève", text: "Pouvoir consulter les notes de mon fils directement sur mon téléphone me rassure au quotidien. L'école est beaucoup plus transparente grâce à ce portail interactif." }
              ].map((testimonial, i) => (
                <motion.div key={i} variants={fadeIn} className="bg-white/[0.03] backdrop-blur-xl p-10 rounded-[2rem] border border-white/[0.08] min-w-[85%] md:min-w-0 snap-center relative overflow-hidden group hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-300 flex flex-col justify-between">
                  {/* Subtle quote icon in background */}
                  <div className="absolute -top-6 -right-6 text-white/[0.03] group-hover:text-emerald-500/[0.05] transition-colors duration-500">
                    <svg width="140" height="140" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14.017 21L16.411 14.504C16.892 13.064 16.924 11.531 16.5 10C16.142 8.711 15.358 7.618 14.269 6.883C13.18 6.148 11.848 5.815 10.5 6L8.5 6L8.5 10L10.5 10C10.963 10 11.411 10.15 11.782 10.428C12.152 10.706 12.427 11.097 12.569 11.545C12.71 11.993 12.71 12.476 12.569 12.924C12.427 13.372 12.152 13.763 11.782 14.041L10.017 14.504L14.017 21ZM5.01697 21L7.41097 14.504C7.89197 13.064 7.92397 11.531 7.49997 10C7.14197 8.711 6.35797 7.618 5.26897 6.883C4.17997 6.148 2.84797 5.815 1.49997 6L-0.500031 6L-0.500031 10L1.49997 10C1.96297 10 2.41097 10.15 2.78197 10.428C3.15297 10.706 3.42797 11.097 3.56997 11.545C3.71197 11.993 3.71197 12.476 3.56997 12.924C3.42797 13.372 3.15297 13.763 2.78197 14.041L1.01697 14.504L5.01697 21Z" />
                    </svg>
                  </div>

                  <div>
                    <div className="flex gap-1 mb-6 text-amber-400 relative z-10">
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                    <p className="text-slate-300 mb-8 leading-relaxed relative z-10 text-[15px] sm:text-base">
                      "{testimonial.text}"
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 relative z-10 pt-6 border-t border-white/[0.05]">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white tracking-wide">{testimonial.name}</div>
                      <div className="text-sm text-emerald-400/80 font-medium mt-0.5">{testimonial.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Section FAQ (#faq) */}
        <section id="faq" className="py-24 bg-white relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-50 rounded-full blur-[100px] opacity-60 pointer-events-none"></div>
          
          <div className="container mx-auto px-4 max-w-4xl relative z-10">
            <motion.div 
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold text-sm tracking-wide uppercase shadow-sm">
                F.A.Q
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Questions <span className="font-serif italic font-normal text-[1.12em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">Fréquentes</span></h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">Tout ce que vous devez savoir sur le déploiement et l'utilisation de Scogestia dans votre établissement.</p>
            </motion.div>

            <motion.div 
              className="space-y-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {[
                { 
                  q: "Pourquoi choisir Scogestia comme logiciel de gestion d'école ?", 
                  a: "Scogestia (Sco-ges / Eco Gestia) est l'application moderne tout-en-un conçue pour les écoles primaires, collèges, lycées et universités. Elle regroupe la gestion complète des élèves, l'automatisation des bulletins de notes, la comptabilité et le suivi des frais de scolarité, ainsi que la communication directe avec les parents via WhatsApp et SMS." 
                },
                { 
                  q: "Comment fonctionne la gestion des notes et la génération des bulletins scolaires ?", 
                  a: "Les enseignants saisissent les notes par matière et période sur leur espace. Scogestia calcule automatiquement les moyennes pondérées, coefficients et rangs des élèves, et génère en un clic des bulletins scolaires conformes, téléchargeables en PDF prêts pour impression ou consultation en ligne par les parents." 
                },
                { 
                  q: "Comment l'application facilite-t-elle le recouvrement des frais de scolarité ?", 
                  a: "Fini les impayés oubliés ! Scogestia permet de définir les échéances de paiement, de suivre l'état financier élève par élève, d'émettre des reçus instantanés et d'accepter les paiements digitaux par Mobile Money (TMoney, Flooz) et carte bancaire avec réconciliation automatique." 
                },
                { 
                  q: "Les parents d'élèves ont-ils un accès dédié pour suivre leurs enfants ?", 
                  a: "Oui, chaque parent dispose d'un portail parent sécurisé pour consulter les notes, les bulletins trimestriels, les absences et retards, ainsi que le récapitulatif des paiements de scolarité, sans aucun frais supplémentaire pour les familles." 
                },
                { 
                  q: "Scogestia (Sco-ges / Eco Gestia) est-il adapté aux écoles d'Afrique de l'Ouest ?", 
                  a: "Parfaitement ! Scogestia a été développé spécifiquement pour répondre aux réalités des établissements scolaires francophones d'Afrique de l'Ouest (Togo, Bénin, Côte d'Ivoire, Sénégal, etc.) : support de la devise Franc CFA (XOF), bulletins conformes aux ministères de l'Éducation et paiements Mobile Money locaux." 
                },
                { 
                  q: "Faut-il installer un logiciel sur mon ordinateur ?", 
                  a: "Absolument pas ! Scogestia est une application 100% cloud sécurisée. Vous n'avez besoin que d'un navigateur internet (Chrome, Safari, Edge) sur ordinateur, tablette ou smartphone, avec une interface réactive et accessible 24h/24." 
                },
                { 
                  q: "Comment se passe l'intégration de mes listes d'élèves (depuis Excel) ?", 
                  a: "L'importation est immédiate. Vous téléchargez notre modèle Excel pré-rempli, vous y copiez vos listes existantes et Scogestia crée les classes, élèves et matières en quelques secondes grâce à notre importateur intelligent." 
                },
                { 
                  q: "Mes données scolaires sont-elles réellement en sécurité ?", 
                  a: "La sécurité est notre priorité absolue. Vos données sont isolées, chiffrées de bout en bout et sauvegardées quotidiennement sur des serveurs haute disponibilité sécurisés, protégés contre toute perte accidentelle." 
                }
              ].map((faq, i) => (
                <motion.details key={i} variants={fadeIn} className="group bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-emerald-200 transition-all duration-300">
                   <summary className="flex items-center justify-between p-6 md:p-8 font-bold text-lg text-slate-900 hover:text-emerald-700 transition-colors select-none">
                      <span className="pr-6">{faq.q}</span>
                      <span className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-50 border border-slate-100 text-emerald-600 flex items-center justify-center group-open:bg-emerald-600 group-open:border-emerald-600 group-open:text-white transition-all duration-300 shadow-sm">
                        <svg className="block group-open:hidden" fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="20"><path d="M12 5v14M5 12h14"></path></svg>
                        <svg className="hidden group-open:block" fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="20"><path d="M5 12h14"></path></svg>
                      </span>
                   </summary>
                   <div className="p-6 md:p-8 pt-0 text-slate-600 leading-relaxed border-t border-slate-100/50 bg-slate-50/50 text-base md:text-lg">
                      {faq.a}
                   </div>
                </motion.details>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Call to Action Pre-Footer */}
        <section className="py-24 lg:py-32 relative bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="bg-[#050B18] rounded-[2.5rem] relative overflow-hidden shadow-2xl max-w-5xl mx-auto p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10">
              
              {/* Effet lumineux de fond dans la carte CTA */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/15 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/15 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="relative z-10 flex-1"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-sans">
                  Prêt à <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-teal-100 to-emerald-400">simplifier</span> la gestion ?
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
                <MagneticArrowButton href="/inscription-ecole">Démarrer mon essai gratuit</MagneticArrowButton>
              </motion.div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer & Contact (#contact) */}
      <footer id="contact" className="bg-[#09090b] text-slate-300 pt-16 pb-10 relative overflow-hidden border-t border-emerald-950/60">

        {/* Filigrane Géant SCOGESTIA (iziSAAS style) */}
        <div className="absolute top-9 sm:top-10 md:top-6 lg:top-4 left-1/2 -translate-x-1/2 w-full flex justify-center pointer-events-none select-none z-0 overflow-hidden px-2 sm:px-4">
          <h2 className="text-[17.5vw] sm:text-[18vw] md:text-[170px] lg:text-[210px] font-black leading-none text-white/[0.08] sm:text-white/[0.04] tracking-tight whitespace-nowrap text-center">
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
                <li>
                  <a href="https://wa.me/22892102868" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                    <svg className="w-5 h-5 text-[#006039] group-hover:text-emerald-500 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span className="text-slate-400 group-hover:text-emerald-500 transition-colors flex items-center gap-1.5">👉 WhatsApp</span>
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#006039]" />
                  <a href="mailto:contact@scogestia.com" className="text-slate-400 hover:text-white transition-colors">
                    contact@scogestia.com
                  </a>
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
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/njLnsD5tGz0?autoplay=1"
                title="Présentation Scogestia"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
      {/* Bouton WhatsApp Flottant Pro */}
      <a
        href="https://wa.me/22892102868?text=Bonjour%20Scogestia,%20je%20souhaite%20d%C3%A9couvrir%20la%20plateforme%20de%20gestion%20scolaire%20pour%20mon%20%C3%A9tablissement."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacter Scogestia sur WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-3 rounded-full shadow-[0_10px_30px_rgba(37,211,102,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 group border-2 border-white/20"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="hidden sm:inline font-bold text-xs tracking-wide">
          Discuter sur WhatsApp
        </span>
      </a>
    </div>
  )
}
