"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, UtensilsCrossed, BarChart3 } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/kasir",
      label: "Kasir",
      icon: ShoppingCart,
    },
    {
      href: "/menu",
      label: "Kelola Menu",
      icon: UtensilsCrossed,
    },
    {
      href: "/laporan",
      label: "Laporan & AI",
      icon: BarChart3,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-lg transition-colors">
      <div className="flex items-center justify-around h-15 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[11px] font-bold transition-all active:scale-95 cursor-pointer ${
                isActive
                  ? "text-primary dark:text-primary font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary shadow-xs"
                    : ""
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
