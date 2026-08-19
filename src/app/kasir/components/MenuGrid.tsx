import { useState, useEffect } from "react";
import { MenuItem } from "@/types";
import { useCartStore } from "@/store/cart-store";
import { getStoredCategories, subscribePOSSync } from "@/lib/data-service";
import CategoryManagementModal from "@/app/menu/components/CategoryManagementModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, ArrowDownAZ, ArrowUpAZ, ArrowDown10, ArrowUp10, Utensils, Edit2, Layers, Settings2 } from "lucide-react";

interface MenuGridProps {
  items: MenuItem[];
  onSelectItem?: (item: MenuItem) => void;
  onEditItem?: (item: MenuItem) => void;
  onAddNewItem?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  "Menu Ayam Nyamleng": "🍗",
  "Menu Ikan Nyamleng": "🐟",
  "Menu Minuman": "🥤",
  "Menu Alacarte": "🍱",
  "Cemilan & Snack": "🍟",
  "Paket Hemat": "📦",
  Dessert: "🍰",
  Makanan: "🍽️",
  Minuman: "🥤",
  Cemilan: "🍟",
};

export default function MenuGrid({ items, onSelectItem, onEditItem, onAddNewItem }: MenuGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"default" | "name_asc" | "name_desc" | "price_low" | "price_high">("default");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [storedCategories, setStoredCategories] = useState<string[]>(() => getStoredCategories());
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    setStoredCategories(getStoredCategories());
    const unsubscribe = subscribePOSSync((type) => {
      if (type === "CATEGORY_UPDATED" || type === "MENU_UPDATED") {
        setStoredCategories(getStoredCategories());
      }
    });
    return unsubscribe;
  }, []);

  const handleCardClick = (item: MenuItem) => {
    if (onSelectItem) {
      onSelectItem(item);
    } else {
      addItem(item);
    }
  };

  // Merge stored categories with any category found in current items
  const presentCategories = Array.from(new Set(items.map((i) => i.category || "Menu Alacarte"))).filter(Boolean);
  const distinctCategories = Array.from(new Set([...storedCategories, ...presentCategories]));
  const categories = ["Semua", ...distinctCategories];

  // Filter items
  let filteredItems = items.filter((item) => {
    const matchesCategory =
      activeCategory === "Semua" || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch && item.isActive;
  });

  // Sort items
  if (sortBy === "name_asc") {
    filteredItems.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "name_desc") {
    filteredItems.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sortBy === "price_low") {
    filteredItems.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price_high") {
    filteredItems.sort((a, b) => b.price - a.price);
  }

  // Group items by category for "Semua" view
  const groupedByCategory: Record<string, MenuItem[]> = {};
  filteredItems.forEach((item) => {
    const cat = item.category || "Menu Alacarte";
    if (!groupedByCategory[cat]) groupedByCategory[cat] = [];
    groupedByCategory[cat].push(item);
  });

  return (
    <div className="flex flex-col h-full gap-2.5 min-h-0">
      {/* Search & Category Filter Header Bar - Ultra Compact */}
      <div className="bg-card p-2.5 sm:p-3 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0 transition-colors">
        {/* Search & Sort Input Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground z-10" />
            <Input
              type="text"
              placeholder="Cari ayam, ikan, minuman..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8.5 h-8 text-xs bg-background border-input font-medium rounded-xl"
            />
          </div>

          {/* Quick Sort Dropdown Button */}
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl border border-border shrink-0">
            <button
              type="button"
              title="Urutkan A-Z"
              onClick={() => setSortBy(sortBy === "name_asc" ? "default" : "name_asc")}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                sortBy === "name_asc" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowDownAZ className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Harga Termurah"
              onClick={() => setSortBy(sortBy === "price_low" ? "default" : "price_low")}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                sortBy === "price_low" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowUp10 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Horizontal Scrollable Category Container Filter Pills */}
        <div className="w-full sm:w-auto flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {categories.map((cat) => {
            const count = cat === "Semua" 
              ? items.filter(i => i.isActive).length 
              : items.filter(i => i.category === cat && i.isActive).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                <span>{CATEGORY_ICONS[cat] || "🍽️"}</span>
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                  activeCategory === cat ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background/80 text-muted-foreground"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}

          {/* Quick Category / Wadah Management Trigger Button */}
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
            title="Kelola / Ganti Nama Wadah Kategori"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Atur Wadah</span>
          </button>
        </div>
      </div>

      {/* Menu Cards Grid - Independent Smooth Scrollable Area */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-0 space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground my-auto flex flex-col items-center justify-center min-h-[220px] transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl mb-2 border border-primary/20">
              🔍
            </div>
            <p className="font-bold text-foreground text-sm">Tidak ada menu ditemukan di wadah ini</p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">
              Coba kata kunci pencarian lain atau pilih wadah kategori menu di atas.
            </p>
            {onAddNewItem && (
              <Button
                type="button"
                size="sm"
                onClick={onAddNewItem}
                className="mt-3 gap-1.5 text-xs font-bold rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Menu Baru</span>
              </Button>
            )}
          </div>
        ) : activeCategory === "Semua" ? (
          // Categorized Containers View (Structured sections by container name)
          Object.keys(groupedByCategory).map((catName) => (
            <div key={catName} className="space-y-2">
              {/* Container Section Header */}
              <div className="flex items-center justify-between px-1 border-b border-border/60 pb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{CATEGORY_ICONS[catName] || "🍽️"}</span>
                  <h2 className="text-xs sm:text-sm font-black text-foreground tracking-wide">
                    {catName}
                  </h2>
                  <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/20">
                    {groupedByCategory[catName].length} Menu
                  </Badge>
                </div>
              </div>

              {/* Cards in this container */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
                {groupedByCategory[catName].map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    onAdd={() => handleCardClick(item)}
                    onEdit={onEditItem ? () => onEditItem(item) : undefined}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Single Selected Container View
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 pb-3">
            {filteredItems.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                onAdd={() => handleCardClick(item)}
                onEdit={onEditItem ? () => onEditItem(item) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Category / Wadah Management Modal */}
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setStoredCategories(getStoredCategories());
        }}
        menuItems={items}
        onCategoriesChange={(newCats) => {
          setStoredCategories(newCats);
        }}
      />
    </div>
  );
}

function MenuCard({
  item,
  onAdd,
  onEdit,
}: {
  item: MenuItem;
  onAdd: () => void;
  onEdit?: () => void;
}) {
  return (
    <div
      onClick={onAdd}
      className="group bg-card rounded-2xl border border-border flex flex-col justify-between hover:shadow-md hover:border-primary/60 transition-all duration-150 cursor-pointer relative overflow-hidden active:scale-[0.98] select-none"
    >
      {/* Menu Image or Placeholder */}
      {item.imageUrl ? (
        <div className="w-full h-24 sm:h-28 overflow-hidden shrink-0 bg-muted relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {onEdit && (
            <button
              type="button"
              title="Edit menu"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : (
        <div className="w-full h-20 sm:h-22 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center text-3xl shrink-0 border-b border-border group-hover:from-primary/15 transition-colors relative">
          {CATEGORY_ICONS[item.category] || "🍽️"}
          {onEdit && (
            <button
              type="button"
              title="Edit menu"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="absolute top-1.5 right-1.5 p-1 bg-background/80 hover:bg-background text-foreground rounded-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
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
              onAdd();
            }}
            className="gap-1 font-extrabold text-[11px] h-7 px-2 rounded-xl shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Pilih</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
