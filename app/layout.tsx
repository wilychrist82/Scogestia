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
    default: 'Scogestia - Logiciel de Gestion Scolaire Tout-en-Un | ERP Scolaire',
    template: '%s | Scogestia',
  },
  description:
    'Scogestia (Sco-ges) est le logiciel moderne de gestion scolaire tout-en-un : inscriptions, suivi des notes et bulletins, gestion financière des scolarités et communication parents-enseignants.',
  keywords: [
    'Scogestia',
    'scogestia',
    'Sco-ges',
    'scoges',
    'logiciel de gestion scolaire',
    'application gestion école',
    'ERP scolaire',
    'logiciel gestion école afrique',
    'gestion des notes et bulletins scolaires',
    'suivi des frais de scolarité',
    'plateforme scolaire',
    'logiciel pour établissement scolaire',
    'bulletin scolaire automatique',
    'gestion administrative ecole',
  ],
  authors: [{ name: 'Scogestia', url: 'https://www.scogestia.com' }],
  creator: 'Scogestia',
  publisher: 'Scogestia',
  applicationName: 'Scogestia',
  alternates: {
    canonical: 'https://www.scogestia.com',
  },
  openGraph: {
    title: 'Scogestia - Logiciel de Gestion Scolaire Tout-en-Un',
    description:
      'Digitalisez et simplifiez la gestion de votre établissement scolaire : élèves, notes, bulletins, scolarités et communication en quelques clics.',
    url: 'https://www.scogestia.com',
    siteName: 'Scogestia',
    images: [
      {
        url: '/hero-landing.png',
        width: 1200,
        height: 630,
        alt: 'Scogestia - Plateforme de gestion scolaire',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scogestia - Logiciel de Gestion Scolaire Tout-en-Un',
    description:
      'La solution complète pour administrer votre école : élèves, finances, notes, bulletins et communication parents.',
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
      'alternateName': ['Sco-ges', 'Scoges', 'Scogestia ERP'],
      'applicationCategory': 'BusinessApplication',
      'operatingSystem': 'Web, Android, iOS',
      'url': 'https://www.scogestia.com',
      'image': 'https://www.scogestia.com/hero-landing.png',
      'description':
        'Scogestia est le logiciel de gestion scolaire tout-en-un pour établissements scolaires : gestion des notes, bulletins, finances, inscriptions et portail parents.',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'XOF',
        'description': 'Essai gratuit de 14 jours sans engagement',
      },
      'featureList': [
        'Gestion des inscriptions et des dossiers élèves',
        'Saisie des notes et génération automatique des bulletins scolaires',
        'Suivi des paiements et recouvrement des frais de scolarité',
        'Portail direction, enseignants et parents',
        'Notifications WhatsApp et SMS',
        'Emplois du temps et gestion des absences',
      ],
    },
    {
      '@type': 'Organization',
      'name': 'Scogestia',
      'alternateName': 'Sco-ges',
      'url': 'https://www.scogestia.com',
      'logo': 'https://www.scogestia.com/logo-scogestia.png',
    },
    {
      '@type': 'WebSite',
      'name': 'Scogestia',
      'alternateName': 'Sco-ges',
      'url': 'https://www.scogestia.com',
    },
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
