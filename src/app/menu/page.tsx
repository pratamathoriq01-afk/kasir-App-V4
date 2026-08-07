"use client";

import { useState, useEffect } from "react";
import { MenuItem } from "@/types";
import { fetchMenuItemsFromDB, saveMenuItems } from "@/lib/data-service";
import MenuFormModal from "./components/MenuFormModal";
import { Plus, Search, Edit3, Trash2, CheckCircle2, XCircle, Utensils, Coffee, Cookie } from "lucide-react";

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    fetchMenuItemsFromDB().then((items) => setMenuItems(items));
  }, []);

  const handleSaveItem = async (item: MenuItem) => {
    let updated: MenuItem[];
    const exists = menuItems.some((m) => m.id === item.id);
    if (exists) {
      updated = menuItems.map((m) => (m.id === item.id ? item : m));
    } else {
      updated = [item, ...menuItems];
    }
    setMenuItems(updated);
    saveMenuItems(updated);

    try {
      const res = await fetch("/api/menu", {
        method: "POST",
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

  const handleDeleteItem = (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus menu ini?")) return;
    const updated = menuItems.filter((m) => m.id !== id);
    setMenuItems(updated);
    saveMenuItems(updated);
  };

  const handleToggleStatus = (id: string) => {
    const updated = menuItems.map((m) =>
      m.id === id ? { ...m, isActive: !m.isActive } : m
    );
    setMenuItems(updated);
    saveMenuItems(updated);
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Kelola Menu &amp; Produk</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur daftar makanan, minuman, HPP/modal, serta harga jual Kedai Nyamleng.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 font-bold text-base">
            📋
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Total Menu</span>
            <h3 className="text-base font-bold text-slate-900 font-mono">{menuItems.length} Item</h3>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-100 text-orange-700">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Makanan</span>
            <h3 className="text-base font-bold text-slate-900 font-mono">{countMakanan} Item</h3>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Minuman</span>
            <h3 className="text-base font-bold text-slate-900 font-mono">{countMinuman} Item</h3>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
            <Cookie className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Cemilan</span>
            <h3 className="text-base font-bold text-slate-900 font-mono">{countCemilan} Item</h3>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["Semua", "Makanan", "Minuman", "Cemilan"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Product / Item</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Harga Jual</th>
                <th className="py-3 px-4">HPP / Modal</th>
                <th className="py-3 px-4">Margin Laba</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Belum ada menu dalam kategori ini.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const profit = item.price - item.hpp;
                  const marginPct = item.price > 0 ? Math.round((profit / item.price) * 100) : 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-lg overflow-hidden shrink-0">
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
                          <div>
                            <h4 className="font-bold text-slate-900">{item.name}</h4>
                            <span className="text-[10px] text-slate-400">ID: {item.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-4">
                        <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-lg text-[11px]">
                          {item.category}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 font-bold font-mono text-slate-900">
                        Rp {item.price.toLocaleString("id-ID")}
                      </td>

                      <td className="py-2.5 px-4 font-mono text-slate-600">
                        Rp {item.hpp.toLocaleString("id-ID")}
                      </td>

                      <td className="py-2.5 px-4">
                        <span className="font-bold font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {marginPct}% (+Rp {profit.toLocaleString("id-ID")})
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(item.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                            item.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
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

                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Edit Menu"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Menu"
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

      {/* Form Modal */}
      <MenuFormModal
        isOpen={isModalOpen}
        itemToEdit={editingItem}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
      />
    </div>
  );
}
