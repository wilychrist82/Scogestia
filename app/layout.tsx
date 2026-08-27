import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "@/components/providers/NotificationProvider";

const workSans = Work_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Scogestia - ERP Scolaire",
  description: "Plateforme de gestion scolaire",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${workSans.variable} h-full antialiased scroll-smooth`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
