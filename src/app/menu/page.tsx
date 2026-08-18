"use client";

import { useState, useEffect } from "react";
import { MenuItem } from "@/types";
import { fetchMenuItemsFromDB, saveMenuItems } from "@/lib/data-service";
import MenuFormModal from "./components/MenuFormModal";
import VoucherManagementModal from "./components/VoucherManagementModal";
import { Plus, Search, Edit3, Trash2, CheckCircle2, XCircle, Utensils, Coffee, Cookie, Ticket } from "lucide-react";

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    fetchMenuItemsFromDB().then((items) => setMenuItems(items));
  }, []);

  const handleSaveItem = async (item: MenuItem) => {
    try {
      const isExisting = Boolean(item.id && !item.id.startsWith("mock-"));
      const method = isExisting ? "PUT" : "POST";

      const res = await fetch("/api/menu", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      if (res.ok) {
        const freshData = await fetchMenuItemsFromDB();
        setMenuItems(freshData);
      }
    } catch (err) {
      console.warn("DB save error:", err);
    }

    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus menu ini dari database?")) return;
    
    // Optimistic UI update
    const updated = menuItems.filter((m) => m.id !== id);
    setMenuItems(updated);
    saveMenuItems(updated);

    try {
      const res = await fetch(`/api/menu?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const freshData = await fetchMenuItemsFromDB();
        setMenuItems(freshData);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Gagal menghapus menu di DB:", errData);
      }
    } catch (err) {
      console.error("Gagal menghapus menu:", err);
    }
  };

  const handleToggleStatus = async (id: string) => {
    const targetItem = menuItems.find((m) => m.id === id);
    if (!targetItem) return;

    const updatedItem = { ...targetItem, isActive: !targetItem.isActive };
    
    // Optimistic UI update
    const updatedList = menuItems.map((m) => (m.id === id ? updatedItem : m));
    setMenuItems(updatedList);
    saveMenuItems(updatedList);

    try {
      const res = await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem),
      });
      if (res.ok) {
        const freshData = await fetchMenuItemsFromDB();
        setMenuItems(freshData);
      }
    } catch (err) {
      console.error("Gagal mengubah status menu:", err);
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      activeCategory === "Semua" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const countMakanan = menuItems.filter((m) => m.category === "Makanan").length;
  const countMinuman = menuItems.filter((m) => m.category === "Minuman").length;
  const countCemilan = menuItems.filter((m) => m.category === "Cemilan").length;

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

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => setIsVoucherModalOpen(true)}
            className="flex-1 sm:flex-initial py-2.5 px-3 sm:px-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 border border-slate-700"
          >
            <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 stroke-[2.5]" />
            <span className="truncate">Voucher Digital</span>
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-initial py-2.5 px-3 sm:px-4 bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            <span className="truncate">Tambah Menu</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card p-3.5 rounded-2xl border border-border shadow-xs flex items-center gap-3 transition-colors">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold text-base">
            📋
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block">Total Menu</span>
            <h3 className="text-base font-bold text-foreground font-mono">{menuItems.length} Item</h3>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-2xl border border-border shadow-xs flex items-center gap-3 transition-colors">
          <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block">Makanan</span>
            <h3 className="text-base font-bold text-foreground font-mono">{countMakanan} Item</h3>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-2xl border border-border shadow-xs flex items-center gap-3 transition-colors">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block">Minuman</span>
            <h3 className="text-base font-bold text-foreground font-mono">{countMinuman} Item</h3>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-2xl border border-border shadow-xs flex items-center gap-3 transition-colors">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
            <Cookie className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-muted-foreground font-medium block">Cemilan</span>
            <h3 className="text-base font-bold text-foreground font-mono">{countCemilan} Item</h3>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-card p-3.5 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["Semua", "Makanan", "Minuman", "Cemilan"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? "bg-amber-500 text-slate-950 dark:bg-amber-400 font-extrabold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
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
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-slate-800 border border-amber-100 dark:border-slate-700 flex items-center justify-center text-lg overflow-hidden shrink-0">
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
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item.id)}
                    className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all active:scale-95 cursor-pointer ${
                      item.isActive
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {item.isActive ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Nonaktif
                      </>
                    )}
                  </button>
                </div>

                {/* Pricing & Profit Grid */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl text-xs border border-slate-200/80 dark:border-slate-800">
                  <div>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Harga Jual</span>
                    <span className="font-black font-mono text-foreground">
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
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-2 py-0.5 rounded-lg text-[10px]">
                    {item.category}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit menu"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Hapus menu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (>= md screens) */}
      <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden shadow-xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 dark:bg-slate-900/90 text-muted-foreground font-extrabold uppercase tracking-wider border-b border-border">
              <tr>
                <th className="p-3.5">Menu / Produk</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5 text-right">Harga Jual</th>
                <th className="p-3.5 text-right">HPP / Modal</th>
                <th className="p-3.5 text-right">Laba / Margin</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Belum ada menu dalam kategori ini.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const profit = item.price - item.hpp;
                  const marginPct = item.price > 0 ? Math.round((profit / item.price) * 100) : 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-slate-800 border border-amber-100 dark:border-slate-700 flex items-center justify-center text-base overflow-hidden shrink-0">
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
                            <h4 className="font-bold text-foreground text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                              {item.name}
                            </h4>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ID: {item.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2.5 py-1 rounded-lg text-[11px]">
                          {item.category}
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-black font-mono text-amber-600 dark:text-amber-400 text-sm">
                        Rp {item.price.toLocaleString("id-ID")}
                      </td>

                      <td className="p-3.5 text-right font-medium font-mono text-muted-foreground">
                        Rp {item.hpp.toLocaleString("id-ID")}
                      </td>

                      <td className="p-3.5 text-right font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                        <div>Rp {profit.toLocaleString("id-ID")}</div>
                        <div className="text-[10px] font-normal text-emerald-600/80 dark:text-emerald-400/80">({marginPct}%)</div>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all active:scale-95 cursor-pointer ${
                            item.isActive
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {item.isActive ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" /> Nonaktif
                            </>
                          )}
                        </button>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit menu"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Hapus menu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
    </div>
  );
}
