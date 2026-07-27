import type { Metadata } from "next";
import { Space_Grotesk, Inter, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const arabic = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dental Clinic OS — Le système d’exploitation de votre cabinet dentaire",
  description:
    "Du premier rendez-vous à la fidélité à vie. Agenda, plans de traitement, imagerie, facturation et relation patient — réunis dans une plateforme pensée pour les cabinets marocains, en français et en arabe.",
};

// Pose lang/dir avant l'hydratation React : un visiteur qui avait choisi
// l'arabe ne voit pas la page apparaître en français puis basculer.
const LANG_BOOT = `try{if(localStorage.getItem("dcos-lang")==="ar"){var e=document.documentElement;e.lang="ar";e.dir="rtl"}}catch(t){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning : lang/dir peuvent déjà avoir été posés par LANG_BOOT.
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${display.variable} ${sans.variable} ${arabic.variable} font-sans antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: LANG_BOOT }} />
        {children}
      </body>
    </html>
  );
}
