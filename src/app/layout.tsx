import type { Metadata } from "next";
import { Outfit, Space_Mono, Inter } from "next/font/google";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "Kedai Nyamleng — Sistem Kasir POS",
  description: "Aplikasi Kasir POS & Laporan Kedai Nyamleng Malang",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={cn(outfit.variable, spaceMono.variable, "font-sans", inter.variable)}>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
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
