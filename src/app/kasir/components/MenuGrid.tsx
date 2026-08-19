"use client";

import { useState } from "react";
import { MenuItem } from "@/types";
import { useCartStore } from "@/store/cart-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, UtensilsCrossed } from "lucide-react";

interface MenuGridProps {
  items: MenuItem[];
}

export default function MenuGrid({ items }: MenuGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const addItem = useCartStore((state) => state.addItem);

  // Dynamic Categories from available items
  const uniqueCats = Array.from(new Set(items.map((i) => i.category || "Makanan"))).filter(Boolean);
  const categories = ["Semua", ...uniqueCats];

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      activeCategory === "Semua" || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch && item.isActive;
  });

  const categoryEmoji: Record<string, string> = {
    Makanan: "🍽️",
    Minuman: "🥤",
    Cemilan: "🍟",
    "Aneka Kopi": "☕",
    "Non-Kopi": "🍹",
    "Paket Hemat": "📦",
    Dessert: "🍰",
  };

  return (
    <div className="flex flex-col h-full gap-2.5 min-h-0">
      {/* Search & Category Filter Header Bar - Ultra Compact */}
      <div className="bg-card p-2.5 sm:p-3 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 transition-colors">
        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <Input
            type="text"
            placeholder="Cari menu makanan/minuman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8.5 text-xs bg-background border-input font-medium rounded-xl"
          />
        </div>

        {/* Dynamic Horizontal Scrollable Category Filter Pills */}
        <div className="w-full sm:w-auto flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              {categoryEmoji[cat] ? `${categoryEmoji[cat]} ` : ""}{cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Cards Grid - Independent Smooth Scrollable Area */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-0">
        {filteredItems.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground my-auto flex flex-col items-center justify-center min-h-[220px] transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl mb-2 border border-primary/20">
              🔍
            </div>
            <p className="font-bold text-foreground text-sm">Tidak ada menu ditemukan</p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">
              Coba kata kunci pencarian lain atau ganti filter kategori di atas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 pb-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => addItem(item)}
                className="group bg-card rounded-2xl border border-border flex flex-col justify-between hover:shadow-md hover:border-primary/60 transition-all duration-150 cursor-pointer relative overflow-hidden active:scale-[0.98] select-none"
              >
                {/* Menu Image or Placeholder */}
                {item.imageUrl ? (
                  <div className="w-full h-24 sm:h-28 overflow-hidden shrink-0 bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-full h-20 sm:h-22 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center text-3xl shrink-0 border-b border-border group-hover:from-primary/15 transition-colors">
                    {categoryEmoji[item.category] || "🍽️"}
                  </div>
                )}

                {/* Card Body */}
                <div className="p-2.5 flex flex-col flex-1 justify-between gap-1.5">
                  <div>
                    {/* Category Badge */}
                    <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded-md w-fit block mb-1">
                      {item.category}
                    </span>

                    {/* Menu Name */}
                    <h3 className="font-bold text-foreground text-xs sm:text-[13px] line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                  </div>

                  {/* Price & Add Button */}
                  <div className="pt-1.5 border-t border-border flex items-center justify-between gap-1">
                    <div className="min-w-0">
                      <span className="text-xs sm:text-[13px] font-black text-primary font-mono tracking-tight block truncate">
                        Rp {item.price.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        addItem(item);
                      }}
                      className="gap-1 font-extrabold text-[11px] h-7 px-2 rounded-xl shadow-xs shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span className="hidden sm:inline">Pilih</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
