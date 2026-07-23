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
  title:
    "Dental Clinic OS — The operating system for Moroccan dental practices",
  description:
    "From the first appointment to lifelong patient loyalty. Booking, treatment plans, imaging, billing and patient relationships in one beautifully simple platform built for Morocco.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body
        className={`${display.variable} ${sans.variable} ${arabic.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
