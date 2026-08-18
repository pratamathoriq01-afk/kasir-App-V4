import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";
import { cn } from "@/lib/utils";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "Kedai Nyamleng — Sistem Kasir POS & Analytics Eksekutif",
  description: "Sistem Kasir POS, Manajemen Menu & Laporan Keuangan Eksekutif Kedai Nyamleng Malang",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={cn(plusJakarta.variable, spaceMono.variable, "font-sans")}>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
        {/* Main Application Header */}
        <Navbar />

        {/* Dynamic Page Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Kedai Nyamleng POS — Powering Local Business</p>
        </footer>
      </body>
    </html>
  );
}
