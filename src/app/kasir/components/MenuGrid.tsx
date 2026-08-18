"use client";

import { useState } from "react";
import { MenuItem } from "@/types";
import { useCartStore } from "@/store/cart-store";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
          <Input
            type="text"
            placeholder="Cari menu makanan/minuman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs sm:text-sm bg-background border-input font-medium rounded-xl"
          />
        </div>

        {/* Category Tabs */}
        <Tabs defaultValue="Semua" value={activeCategory} onValueChange={setActiveCategory} className="w-full sm:w-auto">
          <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex h-9 bg-muted p-1 rounded-xl">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="text-xs font-bold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all cursor-pointer"
              >
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Menu Cards Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-10 text-center text-muted-foreground my-auto flex flex-col items-center justify-center min-h-[300px] transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl mb-3 border border-primary/20">
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
                className="group bg-card rounded-2xl border border-border flex flex-col justify-between hover:shadow-lg hover:border-primary/60 transition-all duration-200 cursor-pointer relative overflow-hidden active:scale-[0.98] select-none"
              >
                {/* Menu Image or Placeholder */}
                {item.imageUrl ? (
                  <div className="w-full h-24 sm:h-32 overflow-hidden shrink-0 bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-full h-20 sm:h-24 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center text-3xl sm:text-4xl shrink-0 border-b border-border group-hover:from-primary/15 transition-colors">
                    {categoryEmoji[item.category] || "🍽️"}
                  </div>
                )}

                {/* Card Body */}
                <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between">
                  <div>
                    {/* Category Badge */}
                    <Badge variant="outline" className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest text-primary border-primary/30 bg-primary/5 px-1.5 py-0.5 rounded-md w-fit mb-1 block">
                      {item.category}
                    </Badge>

                    {/* Menu Name */}
                    <h3 className="font-bold text-foreground text-xs sm:text-sm line-clamp-2 leading-tight sm:leading-snug group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                  </div>

                  {/* Price & Add Button */}
                  <div className="mt-2 pt-2 border-t border-border flex items-center justify-between gap-1">
                    <div className="min-w-0">
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide block sm:inline">
                        Harga
                      </span>
                      <span className="text-xs sm:text-sm font-black text-primary dark:text-primary font-mono tracking-tight block truncate">
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
                      className="gap-1 font-extrabold text-xs h-7 px-2.5 rounded-xl shadow-xs shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span className="hidden sm:inline">Tambah</span>
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


