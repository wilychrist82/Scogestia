import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NotificationProvider } from "@/components/providers/NotificationProvider";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { Toaster } from "react-hot-toast";

export const viewport: Viewport = {
  themeColor: '#005841',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: "Scogestia - ERP Scolaire",
  description: "Plateforme de gestion scolaire",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Scogestia",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`h-full antialiased scroll-smooth`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
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
