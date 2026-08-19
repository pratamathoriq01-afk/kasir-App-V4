"use client";

import { useState, useEffect } from "react";
import { MenuItem } from "@/types";
import {
  fetchMenuItemsFromDB,
  getStoredMenuItems,
  saveMenuItemOptimistic,
  deleteMenuItemOptimistic,
  getStoredCategories,
  broadcastPOSSync,
  subscribePOSSync,
} from "@/lib/data-service";
import MenuFormModal from "./components/MenuFormModal";
import VoucherManagementModal from "./components/VoucherManagementModal";
import AddOnManagementModal from "./components/AddOnManagementModal";
import CategoryManagementModal from "./components/CategoryManagementModal";
import StoreOperationalModal from "./components/StoreOperationalModal";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit3, Trash2, CheckCircle2, XCircle, Utensils, Coffee, Cookie, Ticket, Sparkles, Settings2, Layers, Clock, Store } from "lucide-react";

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => getStoredMenuItems());
  const [storedCategories, setStoredCategories] = useState<string[]>(() => getStoredCategories());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const loadMenu = () => {
    fetchMenuItemsFromDB().then((items) => setMenuItems(items));
    setStoredCategories(getStoredCategories());
  };

  useEffect(() => {
    loadMenu();

    const unsubscribe = subscribePOSSync((type) => {
      if (type === "MENU_UPDATED" || type === "CATEGORY_UPDATED") {
        loadMenu();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSaveItem = async (item: MenuItem) => {
    const updated = await saveMenuItemOptimistic(item, menuItems);
    setMenuItems(updated);
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus menu ini dari database?")) return;
    const updated = await deleteMenuItemOptimistic(id, menuItems);
    setMenuItems(updated);
  };

  const handleToggleStatus = async (id: string) => {
    const targetItem = menuItems.find((m) => m.id === id);
    if (!targetItem) return;

    const updatedItem = { ...targetItem, isActive: !targetItem.isActive };
    const updated = await saveMenuItemOptimistic(updatedItem, menuItems);
    setMenuItems(updated);
  };

  const dynamicCategories = Array.from(
    new Set([
      "Semua",
      ...storedCategories,
      ...menuItems.map((m) => m.category || "Menu Alacarte"),
    ])
  ).filter(Boolean);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      activeCategory === "Semua" || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const countAyam = menuItems.filter((m) => m.category === "Menu Ayam Nyamleng").length;
  const countIkan = menuItems.filter((m) => m.category === "Menu Ikan Nyamleng").length;
  const countMinuman = menuItems.filter((m) => m.category === "Menu Minuman").length;
  const countAlacarte = menuItems.filter((m) => m.category === "Menu Alacarte").length;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Kelola Menu &amp; Produk</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Atur daftar makanan, minuman, HPP/modal, serta harga jual Kedai Nyamleng.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          <Button
            variant="outline"
            onClick={() => setIsStoreModalOpen(true)}
            className="flex-1 sm:flex-initial h-10 px-3.5 text-xs font-bold gap-2 cursor-pointer shrink-0 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
          >
            <Clock className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
            <span className="truncate">Jam Operasional</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex-1 sm:flex-initial h-10 px-3.5 text-xs font-bold gap-2 cursor-pointer shrink-0 border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20"
          >
            <Layers className="w-4 h-4 text-blue-500 stroke-[2.5]" />
            <span className="truncate">Kelola Wadah</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsAddOnModalOpen(true)}
            className="flex-1 sm:flex-initial h-10 px-3.5 text-xs font-bold gap-2 cursor-pointer shrink-0 border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
          >
            <Sparkles className="w-4 h-4 text-amber-500 stroke-[2.5]" />
            <span className="truncate">Kelola Add-On</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsVoucherModalOpen(true)}
            className="flex-1 sm:flex-initial h-10 px-3.5 text-xs font-bold gap-2 cursor-pointer shrink-0"
          >
            <Ticket className="w-4 h-4 text-amber-500 stroke-[2.5]" />
            <span className="truncate">Voucher Digital</span>
          </Button>

          <Button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-initial h-10 px-4 text-xs font-bold gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="truncate">Tambah Menu</span>
          </Button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card p-3.5 rounded-2xl border border-border shadow-xs flex items-center gap-3 transition-colors">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary font-bold text-base">
            📋
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block">Total Menu</span>
            <h3 className="text-base font-bold text-foreground font-mono">{menuItems.length} Item</h3>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-2xl border border-border shadow-xs flex items-center gap-3 transition-colors">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
            🍗
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block">Ayam Nyamleng</span>
            <h3 className="text-base font-bold text-foreground font-mono">{countAyam} Item</h3>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-2xl border border-border shadow-xs flex items-center gap-3 transition-colors">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block">Minuman</span>
            <h3 className="text-base font-bold text-foreground font-mono">{countMinuman} Item</h3>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-2xl border border-border shadow-xs flex items-center gap-3 transition-colors">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
            🍱
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block">Alacarte & Lainnya</span>
            <h3 className="text-base font-bold text-foreground font-mono">{countAlacarte + countIkan} Item</h3>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-card p-3.5 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari nama menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-background border-input font-medium"
          />
        </div>

        {/* Dynamic Category Container Pills */}
        <div className="w-full sm:w-auto flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {dynamicCategories.map((cat) => (
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
              {cat}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30"
            title="Kelola / Ganti Nama Wadah Kategori"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Atur Wadah</span>
          </button>
        </div>
      </div>

      {/* Mobile Card List View (< md screens) */}
      <div className="md:hidden space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground">
            Belum ada menu dalam kategori ini.
          </div>
        ) : (
          filteredItems.map((item) => {
            const profit = item.price - item.hpp;
            const marginPct = item.price > 0 ? Math.round((profit / item.price) * 100) : 0;

            return (
              <div
                key={item.id}
                className="bg-card p-3.5 rounded-2xl border border-border shadow-xs space-y-3 transition-colors"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-lg overflow-hidden shrink-0">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded-xl"
                        />
                      ) : (
                        <span className="text-lg">
                          {item.category === "Makanan" ? "🍽️" : item.category === "Minuman" ? "🥤" : "🍟"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-foreground text-sm truncate">{item.name}</h4>
                      <span className="text-[10px] text-muted-foreground font-mono">ID: {item.id}</span>
                    </div>
                  </div>

                  {/* Status Pill Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => handleToggleStatus(item.id)}
                    className={`shrink-0 h-6 px-2.5 rounded-full text-[10px] font-bold cursor-pointer ${
                      item.isActive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {item.isActive ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Aktif
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Nonaktif
                      </>
                    )}
                  </Button>
                </div>

                {/* Pricing & Profit Grid */}
                <div className="grid grid-cols-3 gap-2 bg-muted/40 p-2.5 rounded-xl text-xs border border-border">
                  <div>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Harga Jual</span>
                    <span className="font-black font-mono text-primary">
                      Rp {item.price.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">HPP / Modal</span>
                    <span className="font-semibold font-mono text-muted-foreground">
                      Rp {item.hpp.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Margin Laba</span>
                    <span className="font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                      {marginPct}%
                    </span>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <Badge variant="secondary" className="text-[10px] font-semibold">
                    {item.category}
                  </Badge>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => {
                        setEditingItem(item);
                        setIsModalOpen(true);
                      }}
                      className="text-muted-foreground hover:text-primary cursor-pointer"
                      title="Edit menu"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-muted-foreground hover:text-destructive cursor-pointer"
                      title="Hapus menu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (>= md screens) */}
      <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden shadow-xs transition-colors">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-extrabold text-xs">Menu / Produk</TableHead>
              <TableHead className="font-extrabold text-xs">Kategori</TableHead>
              <TableHead className="font-extrabold text-xs text-right">Harga Jual</TableHead>
              <TableHead className="font-extrabold text-xs text-right">HPP / Modal</TableHead>
              <TableHead className="font-extrabold text-xs text-right">Laba / Margin</TableHead>
              <TableHead className="font-extrabold text-xs text-center">Status</TableHead>
              <TableHead className="font-extrabold text-xs text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-8 text-center text-muted-foreground">
                  Belum ada menu dalam kategori ini.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const profit = item.price - item.hpp;
                const marginPct = item.price > 0 ? Math.round((profit / item.price) * 100) : 0;

                return (
                  <TableRow
                    key={item.id}
                    className="hover:bg-muted/40 transition-colors group"
                  >
                    <TableCell className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-muted border border-border flex items-center justify-center text-base overflow-hidden shrink-0">
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-9 h-9 object-cover rounded-xl"
                            />
                          ) : (
                            <span>
                              {item.category === "Makanan"
                                ? "🍽️"
                                : item.category === "Minuman"
                                ? "🥤"
                                : "🍟"}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                            {item.name}
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ID: {item.id}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="p-3.5">
                      <Badge variant="secondary" className="font-bold text-[11px]">
                        {item.category}
                      </Badge>
                    </TableCell>

                    <TableCell className="p-3.5 text-right font-black font-mono text-primary text-sm">
                      Rp {item.price.toLocaleString("id-ID")}
                    </TableCell>

                    <TableCell className="p-3.5 text-right font-medium font-mono text-muted-foreground">
                      Rp {item.hpp.toLocaleString("id-ID")}
                    </TableCell>

                    <TableCell className="p-3.5 text-right font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                      <div>Rp {profit.toLocaleString("id-ID")}</div>
                      <div className="text-[10px] font-normal text-emerald-600/80 dark:text-emerald-400/80">({marginPct}%)</div>
                    </TableCell>

                    <TableCell className="p-3.5 text-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => handleToggleStatus(item.id)}
                        className={`inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[10px] font-bold cursor-pointer ${
                          item.isActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {item.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Aktif
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Nonaktif
                          </>
                        )}
                      </Button>
                    </TableCell>

                    <TableCell className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => {
                            setEditingItem(item);
                            setIsModalOpen(true);
                          }}
                          className="text-muted-foreground hover:text-primary cursor-pointer"
                          title="Edit menu"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-muted-foreground hover:text-destructive cursor-pointer"
                          title="Hapus menu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Modal for Creating/Editing Item */}
      <MenuFormModal
        isOpen={isModalOpen}
        itemToEdit={editingItem}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
      />

      {/* Voucher Digital Management Modal */}
      <VoucherManagementModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
      />

      {/* Add-On Management Modal */}
      <AddOnManagementModal
        isOpen={isAddOnModalOpen}
        onClose={() => setIsAddOnModalOpen(false)}
      />

      {/* Category / Wadah Management Modal */}
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setStoredCategories(getStoredCategories());
        }}
        menuItems={menuItems}
        onCategoriesChange={(newCats, updatedItems) => {
          setStoredCategories(newCats);
          if (updatedItems) setMenuItems(updatedItems);
        }}
      />

      {/* Store Operational Hours & Status Modal */}
      <StoreOperationalModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
      />
    </div>
  );
}

