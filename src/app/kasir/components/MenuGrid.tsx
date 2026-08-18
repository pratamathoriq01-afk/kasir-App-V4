"use client";

import { useState } from "react";
import { MenuItem } from "@/types";
import { useCartStore } from "@/store/cart-store";
import { Search, Plus, UtensilsCrossed } from "lucide-react";

interface MenuGridProps {
  items: MenuItem[];
}

export default function MenuGrid({ items }: MenuGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const addItem = useCartStore((state) => state.addItem);

  const categories = ["Semua", "Makanan", "Minuman", "Cemilan"];

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      activeCategory === "Semua" || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.isActive;
  });

  const categoryEmoji: Record<string, string> = {
    Makanan: "🍽️",
    Minuman: "🥤",
    Cemilan: "🍟",
  };

  return (
    <div className="flex flex-col h-full gap-3.5">
      {/* Search & Category Filter Header Bar */}
      <div className="bg-card p-3.5 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 transition-colors">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari menu makanan/minuman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all font-medium"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 active:scale-95 cursor-pointer ${
                activeCategory === cat
                  ? "bg-amber-500 text-slate-950 dark:bg-amber-400 shadow-sm shadow-amber-500/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Cards Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-10 text-center text-muted-foreground my-auto flex flex-col items-center justify-center min-h-[300px] transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center text-3xl mb-3 border border-amber-200/50 dark:border-amber-800/40">
              🔍
            </div>
            <p className="font-bold text-foreground text-base">Tidak ada menu ditemukan</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Coba kata kunci pencarian lain atau ganti filter kategori di atas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 pb-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => addItem(item)}
                className="group bg-card rounded-2xl border border-border flex flex-col justify-between hover:shadow-lg dark:hover:shadow-amber-500/5 hover:border-amber-400/80 dark:hover:border-amber-500/50 transition-all duration-200 cursor-pointer relative overflow-hidden active:scale-[0.98] select-none"
              >
                {/* Menu Image or Placeholder */}
                {item.imageUrl ? (
                  <div className="w-full h-24 sm:h-32 overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-full h-20 sm:h-24 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-3xl sm:text-4xl shrink-0 border-b border-amber-100/60 dark:border-slate-800 group-hover:from-amber-100 dark:group-hover:from-slate-700 transition-colors">
                    {categoryEmoji[item.category] || "🍽️"}
                  </div>
                )}

                {/* Card Body */}
                <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between">
                  <div>
                    {/* Category Badge */}
                    <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60 px-1.5 py-0.5 rounded-md w-fit mb-1 block">
                      {item.category}
                    </span>

                    {/* Menu Name */}
                    <h3 className="font-bold text-foreground text-xs sm:text-sm line-clamp-2 leading-tight sm:leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {item.name}
                    </h3>
                  </div>

                  {/* Price & Add Button */}
                  <div className="mt-2 pt-2 border-t border-border flex items-center justify-between gap-1">
                    <div className="min-w-0">
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide block sm:inline">
                        Harga
                      </span>
                      <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight block truncate">
                        Rp {item.price.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addItem(item);
                      }}
                      className="flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-slate-950 font-extrabold text-xs p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl shadow-xs group-hover:shadow-md transition-all active:scale-90 cursor-pointer shrink-0"
                      title="Tambah ke keranjang"
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                      <span className="hidden sm:inline">Tambah</span>
                    </button>
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

