"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-xl bg-slate-800/50 border border-slate-700/50 animate-pulse" />
    );
  }

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("system");
    } else {
      setTheme("dark");
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700/80 transition-all duration-200 active:scale-95 cursor-pointer shadow-sm group"
      title={`Tema: ${theme === "dark" ? "Mode Gelap" : theme === "light" ? "Mode Terang" : "Otomatis (Sistem)"} - Klik untuk mengubah`}
    >
      {theme === "dark" ? (
        <Moon className="w-4 h-4 text-amber-300 transition-transform group-hover:rotate-12" />
      ) : theme === "light" ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-45" />
      ) : (
        <Laptop className="w-4 h-4 text-sky-300 transition-transform group-hover:scale-110" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
