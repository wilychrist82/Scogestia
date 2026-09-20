"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  ShieldCheck, Cloud, Zap, CheckCircle2, LayoutDashboard, CreditCard, Users,
  ArrowRight, BarChart3, Smartphone, Globe, Mail, Phone, MapPin, Star,
  PlayCircle, Lock, X, Play, Wallet, TrendingUp, Building2, Settings,
  MessageSquare, GraduationCap, BookOpen, Calendar, Bell, ChevronRight, Menu
} from 'lucide-react';

// ─── Animation variants ──────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Feature {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  school: string;
  city: string;
  stars: number;
}

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const FEATURES: Feature[] = [
  {
    icon: <Users className="w-6 h-6" />,
    title: "Gestion des élèves",
    desc: "Fiches complètes, matricules automatiques, historique scolaire centralisé.",
  },
  {
    icon: <Wallet className="w-6 h-6" />,
    title: "Finance & Paiements",
    desc: "Suivi FCFA en temps réel, relances SMS automatiques, taux de recouvrement.",
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "Bulletins scolaires",
    desc: "Génération automatique des bulletins trimestriels avec signature.",
  },
  {
    icon: <Calendar className="w-6 h-6" />,
    title: "Présences & Absences",
    desc: "Appel numérique quotidien, alertes parents, statistiques par classe.",
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Communication parents",
    desc: "SMS, email, WhatsApp. Envoyez à toute l'école en un clic.",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Rapports & Statistiques",
    desc: "Tableaux de bord, exports PDF, analyses de performance par période.",
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "La gestion des inscriptions était un vrai casse-tête avant Scogestia. Aujourd'hui tout est centralisé, fluide et nos parents reçoivent les informations instantanément.",
    name: "M. Koffi AMEGBOR",
    role: "Directeur",
    school: "École La Réussite",
    city: "Lomé, Togo",
    stars: 5,
  },
  {
    quote: "Nous avons gagné un temps précieux dans la communication avec les parents et le suivi des paiements. Un outil indispensable pour notre établissement.",
    name: "Mme. ADOBOE Séraphine",
    role: "Directrice",
    school: "Institut Sainte-Marie",
    city: "Abidjan, Côte d'Ivoire",
    stars: 5,
  },
  {
    quote: "Scogestia a transformé notre administration. La génération des bulletins et l'analyse des performances sont devenues extrêmement simples.",
    name: "M. AZONDEKON Romuald",
    role: "Directeur",
    school: "Lycée Privé HORIZON",
    city: "Cotonou, Bénin",
    stars: 5,
  },
];

const PRICING: PricingPlan[] = [
  {
    name: "Starter",
    price: "15 000",
    period: "FCFA / mois",
    desc: "Pour les petits établissements qui démarrent.",
    features: [
      "1 école",
      "Jusqu'à 200 élèves",
      "Gestion des élèves & classes",
      "Finance & paiements",
      "Support par email",
    ],
    cta: "Commencer gratuitement",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "35 000",
    period: "FCFA / mois",
    desc: "La solution complète pour gérer votre école efficacement.",
    features: [
      "Élèves illimités",
      "Notifications SMS incluses",
      "Bulletins automatiques",
      "Rapports avancés",
      "Espace parents & enseignants",
      "Support prioritaire",
    ],
    cta: "Démarrer l'essai Pro",
    highlighted: true,
  },
  {
    name: "Établissement",
    price: "Sur mesure",
    period: "",
    desc: "Pour les réseaux scolaires et groupes multi-établissements.",
    features: [
      "Multi-établissements",
      "Tableau de bord consolidé",
      "Accès API & intégrations",
      "Gestionnaire dédié",
      "Formation personnalisée",
    ],
    cta: "Contacter l'équipe",
    highlighted: false,
  },
];

const NAV_LINKS = [
  { href: "#accueil", label: "Accueil" },
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#temoignages", label: "Témoignages" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#0D1117', color: '#F0EDE8', fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>

      {/* ── GOOGLE FONTS ───────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        :root {
          --emerald: #006039;
          --emerald-light: #00875A;
          --emerald-glow: rgba(0,96,57,0.25);
          --surface: #1A1F2E;
          --surface-hover: #222838;
          --border: rgba(255,255,255,0.07);
          --cream: #F0EDE8;
          --muted: rgba(240,237,232,0.55);
          --gold: #C8A84B;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        html { scroll-behavior: smooth; }

        .sg-nav-link {
          position: relative;
          font-size: 14px;
          font-weight: 500;
          color: var(--muted);
          text-decoration: none;
          transition: color .2s;
          padding-bottom: 2px;
        }
        .sg-nav-link::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          height: 1.5px; width: 0;
          background: var(--emerald-light);
          transition: width .25s ease;
        }
        .sg-nav-link:hover { color: var(--cream); }
        .sg-nav-link:hover::after { width: 100%; }

        .sg-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 28px;
          background: var(--emerald);
          color: #fff;
          border-radius: 9999px;
          font-size: 15px; font-weight: 600;
          text-decoration: none;
          transition: background .2s, transform .2s, box-shadow .2s;
          white-space: nowrap;
        }
        .sg-btn-primary:hover {
          background: var(--emerald-light);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px var(--emerald-glow);
        }

        .sg-btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 28px;
          background: transparent;
          color: var(--cream);
          border: 1.5px solid rgba(240,237,232,0.2);
          border-radius: 9999px;
          font-size: 15px; font-weight: 500;
          text-decoration: none;
          transition: border-color .2s, background .2s;
          cursor: pointer;
        }
        .sg-btn-ghost:hover {
          border-color: rgba(240,237,232,0.45);
          background: rgba(240,237,232,0.05);
        }

        .sg-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          transition: border-color .25s, transform .25s;
        }
        .sg-card:hover {
          border-color: rgba(0,96,57,0.35);
          transform: translateY(-2px);
        }

        .sg-icon-wrap {
          width: 48px; height: 48px;
          border-radius: 12px;
          background: rgba(0,96,57,0.15);
          border: 1px solid rgba(0,96,57,0.3);
          display: flex; align-items: center; justify-content: center;
          color: #00875A;
          flex-shrink: 0;
        }

        .sg-badge {
          display: inline-block;
          padding: 4px 12px;
          background: rgba(0,96,57,0.15);
          border: 1px solid rgba(0,96,57,0.35);
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: #00C57A;
        }

        .sg-stat-num {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 700;
          color: #00875A;
          line-height: 1;
          letter-spacing: -0.02em;
        }

        .sg-hairline {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,96,57,0.4), transparent);
        }

        .sg-pricing-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 40px 36px;
          display: flex;
          flex-direction: column;
          gap: 0;
          transition: border-color .25s, transform .25s;
        }
        .sg-pricing-card:hover { transform: translateY(-3px); }
        .sg-pricing-card.highlighted {
          border-color: rgba(0,96,57,0.6);
          background: #0A1F15;
          box-shadow: 0 0 40px rgba(0,96,57,0.15);
        }

        .sg-check { color: #00875A; margin-top: 1px; flex-shrink: 0; }

        .footer-link {
          color: var(--muted);
          text-decoration: none;
          font-size: 14px;
          transition: color .2s;
          display: block;
          padding: 3px 0;
        }
        .footer-link:hover { color: var(--cream); }

        @media (max-width: 768px) {
          .sg-btn-primary, .sg-btn-ghost { padding: 11px 22px; font-size: 14px; }
        }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 w-full transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(13,17,23,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link href="#accueil" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/logo-scogestia-transparent.png" alt="Scogestia" style={{ height: 48, width: 'auto', objectFit: 'contain' }} />
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 36 }} className="hidden lg:flex">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} className="sg-nav-link">{l.label}</a>
            ))}
          </nav>

          {/* CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/connexion" className="sg-nav-link hidden sm:block" style={{ color: 'var(--muted)' }}>
              Se connecter
            </Link>
            <Link href="/inscription-ecole" className="sg-btn-primary hidden sm:inline-flex">
              Créer mon école
            </Link>
            <button
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: 'none', border: 'none', color: 'var(--cream)', cursor: 'pointer', padding: 8 }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ background: '#131920', borderTop: '1px solid var(--border)', overflow: 'hidden' }}
            >
              <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {NAV_LINKS.map(l => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ color: 'var(--muted)', textDecoration: 'none', padding: '10px 8px', fontSize: 15, fontWeight: 500, borderRadius: 8, transition: 'background .15s' }}
                  >
                    {l.label}
                  </a>
                ))}
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link href="/connexion" onClick={() => setMobileMenuOpen(false)}
                    style={{ padding: '11px 24px', textAlign: 'center', border: '1.5px solid var(--border)', borderRadius: 9999, color: 'var(--cream)', textDecoration: 'none', fontSize: 15 }}>
                    Se connecter
                  </Link>
                  <Link href="/inscription-ecole" onClick={() => setMobileMenuOpen(false)} className="sg-btn-primary" style={{ justifyContent: 'center' }}>
                    Créer mon école
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <section
          id="accueil"
          style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}
        >
          {/* Background image */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <img
              src="/images/gestion_scolaire_african.jpg"
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            />
            {/* Gradient overlay: deep emerald-to-charcoal */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(13,17,23,0.35) 0%, rgba(0,30,18,0.6) 45%, rgba(13,17,23,0.95) 80%, #0D1117 100%)',
            }} />
          </div>

          {/* Hero content – centered-low */}
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1200, margin: '0 auto', padding: '0 24px 96px' }}>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto' }}
            >
              <motion.div variants={fadeUp}>
                <span className="sg-badge" style={{ marginBottom: 24, display: 'inline-block' }}>
                  🎓 Conçu pour l'Afrique francophone
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                style={{
                  fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
                  fontWeight: 700,
                  lineHeight: 1.06,
                  letterSpacing: '-0.03em',
                  color: '#F0EDE8',
                  marginBottom: 24,
                }}
              >
                Gérez votre école.
                <br />
                <span style={{ color: '#00C57A' }}>Simplement.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'rgba(240,237,232,0.65)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}
              >
                La plateforme de gestion scolaire conçue pour les établissements
                d'Afrique francophone. Élèves, finance, notes, parents — tout en un.
              </motion.p>

              <motion.div variants={fadeUp} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                <Link href="/inscription-ecole" className="sg-btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>
                  Démarrer gratuitement
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setDemoOpen(true)}
                  className="sg-btn-ghost"
                  style={{ fontSize: 16, padding: '14px 36px' }}
                >
                  <PlayCircle className="w-5 h-5" />
                  Voir la démo
                </button>
              </motion.div>

              {/* Trust signals */}
              <motion.div
                variants={fadeUp}
                style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', marginTop: 48 }}
              >
                {[
                  { icon: <Lock className="w-4 h-4" />, text: "Données sécurisées" },
                  { icon: <Cloud className="w-4 h-4" />, text: "Hébergé en France" },
                  { icon: <Zap className="w-4 h-4" />, text: "Rapide sur mobile" },
                  { icon: <ShieldCheck className="w-4 h-4" />, text: "Sans engagement" },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(240,237,232,0.5)', fontSize: 13, fontWeight: 500 }}>
                    <span style={{ color: '#00875A' }}>{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── TRUST BAR ──────────────────────────────────────────────────── */}
        <section style={{ padding: '64px 24px', background: '#0D1117', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 40 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
                Ils font confiance à Scogestia
              </p>
              <p style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 700, color: 'var(--cream)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                150+ écoles gèrent leur<br />établissement avec nous.
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48 }}>
              {[
                { num: "12 000+", label: "Élèves gérés" },
                { num: "98%", label: "Satisfaction" },
                { num: "3 pays", label: "Togo · Bénin · Côte d'Ivoire" },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="sg-stat-num">{stat.num}</div>
                  <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ────────────────────────────────────────────────────── */}
        <section id="fonctionnalites" style={{ padding: 'clamp(64px,8vw,120px) 24px', background: '#0D1117' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp}
              style={{ marginBottom: 64 }}
            >
              <span className="sg-badge" style={{ marginBottom: 16, display: 'inline-block' }}>FONCTIONNALITÉS</span>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--cream)', maxWidth: 600, lineHeight: 1.15 }}>
                Tout ce dont votre école a besoin.
              </h2>
            </motion.div>

            {/* Bento grid */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={stagger}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}
            >
              {/* Wide card – Finance */}
              <motion.div
                variants={fadeUp}
                className="sg-card"
                style={{ gridColumn: 'span 2', padding: 40, display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap' }}
              >
                <div style={{ flex: '1 1 220px' }}>
                  <div className="sg-icon-wrap" style={{ marginBottom: 20 }}>
                    <Wallet className="w-6 h-6" />
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--cream)', marginBottom: 10 }}>Finance & Paiements</h3>
                  <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: 15 }}>
                    Suivi FCFA en temps réel, relances SMS automatiques, taux de recouvrement, échéances impayées.
                    Votre comptabilité scolaire sans tableaux croisés.
                  </p>
                  <a href="#tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#00C57A', textDecoration: 'none', fontSize: 14, fontWeight: 600, marginTop: 20 }}>
                    Voir les tarifs <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
                {/* Mini screenshot placeholder */}
                <div style={{ flex: '1 1 280px', background: '#131920', borderRadius: 12, border: '1px solid var(--border)', padding: '20px 24px', minHeight: 160 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Recouvrement — 2025-2026</span>
                    <span style={{ fontSize: 12, color: '#00C57A', fontWeight: 600 }}>82%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                    {[55, 78, 65, 90, 70, 82, 68, 74, 88, 60, 72, 82].map((h, i) => (
                      <div key={i} style={{ flex: 1, background: i % 3 === 0 ? '#006039' : 'rgba(0,96,57,0.3)', borderRadius: 3, height: `${h}%` }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>● Attendu</span>
                    <span style={{ fontSize: 11, color: '#00875A' }}>● Encaissé</span>
                  </div>
                </div>
              </motion.div>

              {/* Normal cards */}
              {FEATURES.filter(f => f.title !== "Finance & Paiements").map((feat, i) => (
                <motion.div key={i} variants={fadeUp} className="sg-card" style={{ padding: 32 }}>
                  <div className="sg-icon-wrap" style={{ marginBottom: 18 }}>
                    {feat.icon}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--cream)', marginBottom: 8 }}>{feat.title}</h3>
                  <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.65 }}>{feat.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
        <section id="comment-ca-marche" style={{ padding: 'clamp(64px,8vw,120px) 24px', background: '#0D1117' }}>
          <div className="sg-hairline" style={{ maxWidth: 1200, margin: '0 auto 80px' }} />
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 80, alignItems: 'center' }}>
            {/* Left: steps */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={stagger}
              style={{ flex: '1 1 360px' }}
            >
              <motion.div variants={fadeUp}>
                <span className="sg-badge" style={{ marginBottom: 16, display: 'inline-block' }}>COMMENT ÇA MARCHE</span>
                <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--cream)', marginBottom: 48, lineHeight: 1.15 }}>
                  3 étapes.<br />Votre école gérée.
                </h2>
              </motion.div>

              {[
                { num: "01", title: "Créez votre établissement", desc: "Configurez votre école en moins de 5 minutes. Nom, niveaux, année scolaire — c'est tout." },
                { num: "02", title: "Invitez votre équipe", desc: "Ajoutez vos administrateurs, enseignants et comptables avec les bonnes permissions." },
                { num: "03", title: "Gérez en temps réel", desc: "Élèves, notes, finances, présences et communication — tout est centralisé et automatisé." },
              ].map((step, i) => (
                <motion.div key={i} variants={fadeUp} style={{ display: 'flex', gap: 24, marginBottom: 40, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,96,57,0.15)',
                    border: '1.5px solid rgba(0,96,57,0.4)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#00C57A', flexShrink: 0
                  }}>
                    {step.num}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--cream)', marginBottom: 6 }}>{step.title}</h3>
                    <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.65 }}>{step.desc}</p>
                  </div>
                </motion.div>
              ))}

              <motion.div variants={fadeUp}>
                <Link href="/inscription-ecole" className="sg-btn-primary">
                  Commencer maintenant <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Right: dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              style={{ flex: '1 1 420px' }}
            >
              <div style={{ background: '#131920', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
                {/* Browser chrome */}
                <div style={{ padding: '12px 20px', background: '#0D1117', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28CA41' }} />
                  <div style={{ flex: 1, background: '#1A1F2E', borderRadius: 6, padding: '4px 12px', fontSize: 11, color: 'var(--muted)', marginLeft: 12 }}>
                    app.scogestia.com/admin/dashboard
                  </div>
                </div>
                {/* Dashboard preview */}
                <div style={{ padding: '24px 20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                    {[
                      { label: "Élèves", val: "512", color: '#00C57A' },
                      { label: "Classes", val: "18", color: '#00875A' },
                      { label: "Recouvrement", val: "82%", color: '#C8A84B' },
                    ].map((c, i) => (
                      <div key={i} style={{ background: '#0D1117', borderRadius: 10, padding: '16px 14px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.val}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{c.label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Chart bars */}
                  <div style={{ background: '#0D1117', borderRadius: 10, padding: '16px 14px', border: '1px solid var(--border)', marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>Recouvrement des paiements</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 56 }}>
                      {[60, 82, 72, 90, 68, 78, 85, 63, 74, 88, 70, 82].map((h, i) => (
                        <div key={i} style={{ flex: 1, background: i % 2 === 0 ? 'rgba(0,96,57,0.35)' : '#006039', borderRadius: 3, height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  {/* Table row preview */}
                  {['AGBODAN Komi', 'MENSAH Esther', 'KPONTON Jules'].map((name, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,96,57,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#00C57A' }}>
                          {name.charAt(0)}
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--cream)' }}>{name}</span>
                      </div>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 9999, background: 'rgba(0,135,90,0.15)', color: '#00C57A', fontWeight: 600 }}>Actif</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── PRICING ─────────────────────────────────────────────────────── */}
        <section id="tarifs" style={{ padding: 'clamp(64px,8vw,120px) 24px', background: '#0D1117' }}>
          <div className="sg-hairline" style={{ maxWidth: 1200, margin: '0 auto 80px' }} />
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp}
              style={{ textAlign: 'center', marginBottom: 56 }}
            >
              <span className="sg-badge" style={{ marginBottom: 16, display: 'inline-block' }}>TARIFS</span>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--cream)', marginBottom: 12, lineHeight: 1.15 }}>
                Un tarif clair. Aucune surprise.
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: 16 }}>Tous les plans incluent 30 jours d'essai gratuit.</p>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={stagger}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}
            >
              {PRICING.map((plan, i) => (
                <motion.div key={i} variants={fadeUp} className={`sg-pricing-card ${plan.highlighted ? 'highlighted' : ''}`}>
                  {plan.highlighted && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                      <span className="sg-badge">Recommandé</span>
                    </div>
                  )}
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
                    {plan.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                    <span style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 700, color: 'var(--cream)', letterSpacing: '-0.02em' }}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}>&nbsp;{plan.period}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.5 }}>{plan.desc}</p>

                  <div style={{ height: 1, background: 'var(--border)', marginBottom: 24 }} />

                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                    {plan.features.map((f, j) => (
                      <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <CheckCircle2 className="w-4 h-4 sg-check" style={{ marginTop: 2 }} />
                        <span style={{ fontSize: 14, color: 'rgba(240,237,232,0.8)' }}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/inscription-ecole"
                    className={plan.highlighted ? 'sg-btn-primary' : 'sg-btn-ghost'}
                    style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
                  >
                    {plan.cta}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
        <section id="temoignages" style={{ padding: 'clamp(64px,8vw,120px) 24px', background: '#0D1117' }}>
          <div className="sg-hairline" style={{ maxWidth: 1200, margin: '0 auto 80px' }} />
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'flex-start', marginBottom: 56 }}
            >
              <div style={{ flex: '0 0 auto' }}>
                <span className="sg-badge" style={{ marginBottom: 16, display: 'inline-block' }}>TÉMOIGNAGES</span>
                <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--cream)', lineHeight: 1.15 }}>
                  Ce que disent<br />les directeurs d'école.
                </h2>
              </div>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={stagger}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}
            >
              {TESTIMONIALS.map((t, i) => (
                <motion.div key={i} variants={fadeUp} className="sg-card" style={{ padding: 36 }}>
                  {/* Stars */}
                  <div style={{ display: 'flex', gap: 3, marginBottom: 20 }}>
                    {Array(t.stars).fill(null).map((_, s) => (
                      <Star key={s} className="w-4 h-4" style={{ color: '#C8A84B', fill: '#C8A84B' }} />
                    ))}
                  </div>
                  {/* Large quote mark */}
                  <div style={{ fontSize: 64, lineHeight: 0.7, color: 'rgba(0,96,57,0.4)', fontFamily: 'Georgia, serif', marginBottom: 20 }}>"</div>
                  <p style={{ fontSize: 15, color: 'rgba(240,237,232,0.85)', lineHeight: 1.75, marginBottom: 28 }}>{t.quote}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,96,57,0.2)', border: '1.5px solid rgba(0,96,57,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#00C57A' }}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cream)' }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t.role} — {t.school}, {t.city}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
        <section style={{ position: 'relative', overflow: 'hidden', minHeight: 480, display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <img
              src="/images/gestion_scolaire_african.jpg"
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.35) saturate(0.7)' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(13,17,23,0.4), rgba(0,30,18,0.85), rgba(13,17,23,0.9))' }} />
          </div>
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1200, margin: '0 auto', padding: '96px 24px', textAlign: 'center' }}>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              <motion.div variants={fadeUp}>
                <span className="sg-badge" style={{ marginBottom: 20, display: 'inline-block' }}>COMMENCEZ DÈS AUJOURD'HUI</span>
              </motion.div>
              <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--cream)', marginBottom: 20, lineHeight: 1.1 }}>
                Votre école mérite mieux.
              </motion.h2>
              <motion.p variants={fadeUp} style={{ fontSize: 17, color: 'rgba(240,237,232,0.65)', marginBottom: 40 }}>
                Rejoignez 150+ établissements qui font confiance à Scogestia.
              </motion.p>
              <motion.div variants={fadeUp} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                <Link href="/inscription-ecole" className="sg-btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>
                  Créer mon compte gratuitement
                </Link>
                <a href="mailto:contact@scogestia.com" className="sg-btn-ghost" style={{ fontSize: 16, padding: '14px 36px' }}>
                  Parler à un expert
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{ background: '#080C0F', padding: '80px 24px 40px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 48, marginBottom: 64 }}>
            {/* Brand col */}
            <div style={{ gridColumn: 'span 1' }}>
              <img src="/logo-scogestia-transparent.png" alt="Scogestia" style={{ height: 40, marginBottom: 16, objectFit: 'contain' }} />
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 20 }}>
                La gestion scolaire en Afrique francophone.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                {['f', 'in', 'x'].map((s, i) => (
                  <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--muted)', cursor: 'pointer' }}>
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              { title: "Produit", links: ["Fonctionnalités", "Tarifs", "Mises à jour", "Sécurité"] },
              { title: "Ressources", links: ["Guide d'utilisation", "Centre d'aide", "Contact", "Blog"] },
              {
                title: "Légal", links: [
                  { label: "Conditions d'utilisation", href: "/conditions-utilisation" },
                  { label: "Confidentialité", href: "/confidentialite" },
                  { label: "Mentions légales", href: "/mentions-legales" },
                ]
              },
            ].map((col, i) => (
              <div key={i}>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#00875A', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#006039', display: 'inline-block' }} />
                  {col.title}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {col.links.map((l, j) => {
                    const label = typeof l === 'string' ? l : l.label;
                    const href = typeof l === 'string' ? '#' : l.href;
                    return (
                      <Link key={j} href={href} className="footer-link">{label}</Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="sg-hairline" style={{ marginBottom: 28 }} />

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'rgba(240,237,232,0.3)' }}>© 2026 Scogestia · Tous droits réservés</p>
            <p style={{ fontSize: 13, color: 'rgba(240,237,232,0.3)' }}>Made with ❤️ in Togo</p>
          </div>
        </div>
      </footer>

      {/* ── DEMO MODAL ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {demoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDemoOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#131920', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', maxWidth: 760, width: '100%' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontWeight: 700, color: 'var(--cream)' }}>Démo Scogestia</h3>
                <button onClick={() => setDemoOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div style={{ aspectRatio: '16/9', background: '#0D1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <PlayCircle className="w-16 h-16" style={{ color: '#006039', margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--muted)', fontSize: 14 }}>Vidéo de démonstration à venir</p>
                  <Link href="/inscription-ecole" className="sg-btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>
                    Essayer gratuitement
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
