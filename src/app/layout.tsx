import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
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
      <body className="min-h-screen flex flex-col bg-background text-foreground font-sans antialiased selection:bg-primary selection:text-primary-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            {/* Main Application Desktop Header */}
            <Navbar />

            {/* Dynamic Page Body */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
              {children}
            </main>

            {/* Mobile Bottom Sticky Navigation */}
            <BottomNav />

            {/* Footer (Desktop) */}
            <footer className="hidden md:block bg-card border-t border-border py-4 text-center text-xs text-muted-foreground transition-colors">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p className="font-medium">© {new Date().getFullYear()} Kedai Nyamleng POS — Powering Local Business</p>
                <p className="text-[11px] text-primary dark:text-primary font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  SAK EMKM Compliant • Shadcn UI Premium
                </p>
              </div>
            </footer>

            {/* Sonner Toast Notifications */}
            <Toaster position="top-right" richColors />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


