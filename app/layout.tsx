import type { Metadata, Viewport } from "next";
import { Work_Sans, Public_Sans } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { Toaster } from "react-hot-toast";

const workSans = Work_Sans({ subsets: ["latin"], variable: "--font-work-sans", display: "swap" });
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap" });

export const viewport: Viewport = {
  themeColor: '#005841',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://www.scogestia.com'),
  title: {
    default: 'Scogestia - Plateforme de Gestion de l\'École & Logiciel Scolaire Tout-en-Un',
    template: '%s | Scogestia',
  },
  description:
    'Plateforme moderne de gestion scolaire pour écoles, collèges et lycées en Afrique : gestion des élèves, notes, bulletins trimestriels automatiques, caisse et communication parents via WhatsApp et SMS.',
  keywords: [
    'plateforme de gestion de l\'école',
    'plateforme de gestion scolaire',
    'logiciel de gestion scolaire',
    'logiciel de gestion d\'école',
    'application gestion école afrique',
    'ERP scolaire',
    'gestion des élèves et notes',
    'bulletin scolaire automatique',
    'recouvrement frais de scolarité',
    'gestion école Sénégal Côte d\'Ivoire Togo Bénin',
    'Scogestia',
    'Sco-ges',
    'Ecogestia',
  ],
  authors: [{ name: 'Scogestia', url: 'https://www.scogestia.com' }],
  creator: 'Scogestia',
  publisher: 'Scogestia',
  applicationName: 'Scogestia',
  alternates: {
    canonical: 'https://www.scogestia.com',
  },
  openGraph: {
    title: 'Scogestia - Plateforme de Gestion de l\'École & Logiciel Scolaire Tout-en-Un',
    description:
      'Digitalisez et pilotez votre établissement scolaire en toute simplicité : élèves, notes, bulletins, caisse et portail parents.',
    url: 'https://www.scogestia.com',
    siteName: 'Scogestia',
    images: [
      {
        url: '/hero-landing.png',
        width: 1200,
        height: 630,
        alt: 'Scogestia - Plateforme de gestion de l\'école',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scogestia - Plateforme de Gestion de l\'École Tout-en-Un',
    description:
      'La solution complète pour administrer votre établissement : élèves, finances, notes, bulletins et communication parents.',
    images: ['/hero-landing.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'Software',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Scogestia',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      'name': 'Scogestia',
      'alternateName': ['Sco-ges', 'Scoges', 'Eco Gestia', 'Ecogestia', 'Scogestia ERP'],
      'applicationCategory': 'EducationApplication',
      'operatingSystem': 'Web, Android, iOS',
      'url': 'https://www.scogestia.com',
      'image': 'https://www.scogestia.com/hero-landing.png',
      'description':
        'Plateforme moderne de gestion scolaire tout-en-un : inscriptions, suivi des notes, bulletins automatiques, caisse et communication parents.',
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.9',
        'bestRating': '5',
        'worstRating': '1',
        'ratingCount': '38',
      },
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'XOF',
        'description': 'Essai gratuit de 14 jours sans engagement - Aucun paiement requis',
        'availability': 'https://schema.org/InStock',
      },
      'featureList': [
        'Gestion des inscriptions et fiches complètes élèves',
        'Saisie des notes et génération automatique des bulletins scolaires PDF',
        'Suivi de caisse journalière et recouvrement des frais de scolarité',
        'Portails dédiés direction, enseignants et parents',
        'Notifications WhatsApp et SMS pour les absences et paiements',
        'Emplois du temps et suivi rigoureux des présences',
      ],
    },
    {
      '@type': 'Organization',
      'name': 'Scogestia',
      'alternateName': ['Sco-ges', 'Eco Gestia'],
      'url': 'https://www.scogestia.com',
      'logo': 'https://www.scogestia.com/logo-scogestia.png',
    },
    {
      '@type': 'WebSite',
      'name': 'Scogestia',
      'alternateName': ['Sco-ges', 'Eco Gestia'],
      'url': 'https://www.scogestia.com',
    },
    {
      '@type': 'FAQPage',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': "Pourquoi choisir Scogestia comme logiciel de gestion d'école ?",
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': "Scogestia (Sco-ges / Eco Gestia) est le logiciel moderne tout-en-un conçu pour les établissements scolaires (primaires, collèges, lycées). Il regroupe la gestion complète des élèves, les bulletins de notes automatisés, la comptabilité des frais scolaires et la communication avec les parents dans une interface ultra-simple."
          }
        },
        {
          '@type': 'Question',
          'name': "Comment fonctionne la gestion des notes et la génération des bulletins scolaires ?",
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': "Les enseignants saisissent les notes par matière et par trimestre. Scogestia calcule instantanément les moyennes, coefficients et rangs des élèves, et génère en un clic des bulletins scolaires conformes et téléchargeables en PDF prêts pour impression."
          }
        },
        {
          '@type': 'Question',
          'name': "Comment l'application facilite-t-elle le recouvrement des frais de scolarité ?",
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': "Scogestia permet de suivre l'état des paiements élève par élève, d'éditer des reçus officiels instantanés, de relancer automatiquement les impayés et d'accepter les paiements par Mobile Money et cartes bancaires."
          }
        },
        {
          '@type': 'Question',
          'name': "Les parents d'élèves ont-ils un accès pour suivre la scolarité de leurs enfants ?",
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': "Oui, chaque parent dispose d'un portail dédié sécurisé pour consulter les notes, les bulletins trimestriels, les retards, les absences et l'échéancier des paiements, en recevant également des alertes directes."
          }
        },
        {
          '@type': 'Question',
          'name': "Scogestia est-il adapté aux écoles d'Afrique de l'Ouest ?",
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': "Oui, Scogestia est spécialement optimisé pour les systèmes éducatifs d'Afrique de l'Ouest (Togo, Bénin, Côte d'Ivoire, Sénégal, etc.) avec le support du Franc CFA (XOF), des modes d'évaluation francophones et des paiements Mobile Money (TMoney, Flooz, etc.)."
          }
        }
      ]
    }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`h-full antialiased scroll-smooth ${workSans.variable} ${publicSans.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <NotificationProvider>
          {children}
          <CookieBanner />
          <Toaster
            position="bottom-right"
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                fontSize: '13.5px',
                fontWeight: '500',
                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
              },
              success: {
                iconTheme: { primary: '#059669', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
              },
            }}
          />
        </NotificationProvider>
      </body>
    </html>
  );
}
