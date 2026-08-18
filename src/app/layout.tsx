import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";
import { cn } from "@/lib/utils";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
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
    <html lang="id" suppressHydrationWarning className={cn(plusJakarta.variable, spaceMono.variable, "font-sans")}>
      <body className="min-h-screen flex flex-col bg-background text-foreground font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {/* Main Application Header */}
          <Navbar />

          {/* Dynamic Page Body */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-card border-t border-border py-4 text-center text-xs text-muted-foreground transition-colors">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="font-medium">© {new Date().getFullYear()} Kedai Nyamleng POS — Powering Local Business</p>
              <p className="text-[11px] text-amber-500 dark:text-amber-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SAK EMKM Compliant • POS v4 Premium UI
              </p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}

