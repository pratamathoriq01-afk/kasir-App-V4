"use client";

import { useState, useEffect } from "react";
import { AddOn } from "@/types";
import {
  fetchAddOnsFromDB,
  getStoredAddOns,
  saveAddOnOptimistic,
  deleteAddOnOptimistic,
  subscribePOSSync,
} from "@/lib/data-service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  Check,
  X,
  Tag,
  Flame,
  Layers,
  Wand2,
} from "lucide-react";

interface AddOnManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_PRESETS = [
  "Semua",
  "🌶️ Pilihan Sambal",
  "🔥 Level Pedas",
  "🍳 Ekstra Topping / Lauk",
  "🥤 Pilihan Es / Suhu",
  "Semua Makanan",
  "Semua Minuman",
  "Menu Ayam Nyamleng",
  "Menu Ikan Nyamleng",
  "Menu Minuman",
  "Menu Alacarte",
  "Cemilan & Snack",
  "Paket Hemat",
];

const SAMBAL_DEFAULTS = [
  { name: "Sambal Bawang Nyamleng 🌶️", price: 0, hpp: 500, category: "🌶️ Pilihan Sambal" },
  { name: "Sambal Terasi Matang 🔴", price: 0, hpp: 500, category: "🌶️ Pilihan Sambal" },
  { name: "Sambal Hijau / Ijo Segar 🟢", price: 0, hpp: 500, category: "🌶️ Pilihan Sambal" },
];

export default function AddOnManagementModal({
  isOpen,
  onClose,
}: AddOnManagementModalProps) {
  const [addOns, setAddOns] = useState<AddOn[]>(() => getStoredAddOns());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">(0);
  const [hpp, setHpp] = useState<number | "">(0);
  const [category, setCategory] = useState("🌶️ Pilihan Sambal");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("Semua");
  const [isGeneratingSambal, setIsGeneratingSambal] = useState(false);

  const loadData = () => {
    fetchAddOnsFromDB().then((data) => setAddOns(data));
  };

  useEffect(() => {
    if (isOpen) {
      setAddOns(getStoredAddOns());
      loadData();
    }

    const unsubscribe = subscribePOSSync((type) => {
      if (type === "ADDONS_UPDATED") {
        setAddOns(getStoredAddOns());
        loadData();
      }
    });

    return () => unsubscribe();
  }, [isOpen]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setPrice(0);
    setHpp(0);
    setCategory("🌶️ Pilihan Sambal");
    setIsCustomCategory(false);
    setCustomCategoryInput("");
    setIsActive(true);
    setIsFormOpen(false);
  };

  const handleEdit = (addon: AddOn) => {
    setEditingId(addon.id);
    setName(addon.name);
    setPrice(addon.price);
    setHpp(addon.hpp);
    const catVal = addon.category || "Semua";
    if (CATEGORY_PRESETS.includes(catVal)) {
      setCategory(catVal);
      setIsCustomCategory(false);
    } else {
      setCategory(catVal);
      setIsCustomCategory(true);
      setCustomCategoryInput(catVal);
    }
    setIsActive(addon.isActive);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalCat = isCustomCategory
      ? customCategoryInput.trim() || "Semua"
      : category;

    const payload: AddOn = {
      id: editingId || `addon-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim(),
      price: Number(price) || 0,
      hpp: Number(hpp) || 0,
      category: finalCat,
      isActive,
      updatedAt: new Date().toISOString(),
    };

    // 0ms Optimistic UI
    await saveAddOnOptimistic(payload);
    setAddOns(getStoredAddOns());
    resetForm();
  };

  const handleAutoCreateSambal = async () => {
    setIsGeneratingSambal(true);
    try {
      for (const s of SAMBAL_DEFAULTS) {
        // Check if already exists
        const exists = addOns.some(
          (a) => a.name.toLowerCase().includes(s.name.toLowerCase().split(" ")[0])
        );
        if (!exists) {
          const item: AddOn = {
            id: `addon-sambal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: s.name,
            price: s.price,
            hpp: s.hpp,
            category: s.category,
            isActive: true,
            updatedAt: new Date().toISOString(),
          };
          await saveAddOnOptimistic(item);
        }
      }
      setAddOns(getStoredAddOns());
      loadData();
    } catch (err) {
      console.error("Gagal auto create sambal:", err);
    } finally {
      setIsGeneratingSambal(false);
    }
  };

  const handleDelete = async (id: string, addonName: string) => {
    if (!confirm(`Hapus Add-On "${addonName}"?`)) return;
    await deleteAddOnOptimistic(id);
    setAddOns(getStoredAddOns());
  };

  const handleToggleStatus = async (addon: AddOn) => {
    const updated: AddOn = { ...addon, isActive: !addon.isActive };
    await saveAddOnOptimistic(updated);
    setAddOns(getStoredAddOns());
  };

  const filteredAddOns = addOns.filter((a) => {
    if (selectedFilterCategory === "Semua") return true;
    if (selectedFilterCategory === "🌶️ Pilihan Sambal") {
      return (
        a.category === "🌶️ Pilihan Sambal" ||
        a.name.toLowerCase().includes("sambal")
      );
    }
    if (selectedFilterCategory === "🔥 Level Pedas") {
      return (
        a.category === "🔥 Level Pedas" ||
        a.name.toLowerCase().includes("pedas") ||
        a.name.toLowerCase().includes("level")
      );
    }
    if (selectedFilterCategory === "🍳 Ekstra Topping / Lauk") {
      return (
        a.category === "🍳 Ekstra Topping / Lauk" ||
        a.category === "Semua" ||
        a.category === "Semua Makanan"
      );
    }
    return a.category === selectedFilterCategory;
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[96vw] sm:w-[94vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card text-card-foreground border-border rounded-3xl shadow-2xl"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-800 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 border-b border-emerald-600/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-xs text-white rounded-2xl shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-white">
                Kelola Add-On &amp; 3 Opsi Sambal Nyamleng
              </DialogTitle>
              <p className="text-xs text-emerald-100 font-medium">
                Atur 3 pilihan sambal, ekstra topping, sambal, porsi nasi &amp; level pedas realtime.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isFormOpen && (
              <Button
                onClick={() => {
                  resetForm();
                  setIsFormOpen(true);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm h-10 px-4 gap-2 rounded-xl cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Add-On / Sambal Baru</span>
              </Button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Quick Preset Banner for 3 Sambal Options */}
          <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold shrink-0">
                🌶️
              </div>
              <div>
                <h4 className="font-extrabold text-xs sm:text-sm text-foreground">
                  Kelola 3 Opsi Sambal Utama Nyamleng
                </h4>
                <p className="text-xs text-muted-foreground">
                  Sambal Bawang, Sambal Terasi, dan Sambal Hijau siap disinkronkan ke Kasir POS &amp; Menu Digital.
                </p>
              </div>
            </div>

            <Button
              type="button"
              disabled={isGeneratingSambal}
              onClick={handleAutoCreateSambal}
              variant="outline"
              className="border-amber-500/40 text-amber-700 dark:text-amber-300 bg-background hover:bg-amber-500/20 font-black text-xs h-10 px-4 gap-2 rounded-xl cursor-pointer shrink-0"
            >
              <Wand2 className="w-4 h-4 text-amber-500" />
              <span>{isGeneratingSambal ? "Memproses..." : "✨ Auto Create 3 Opsi Sambal"}</span>
            </Button>
          </div>

          {/* Add / Edit Form Card */}
          {isFormOpen && (
            <form
              onSubmit={handleSave}
              className="p-4 sm:p-6 bg-muted/40 border border-primary/30 rounded-2xl space-y-5 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h4 className="font-black text-sm sm:text-base text-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <span>{editingId ? "Edit Data Add-On / Sambal" : "Form Tambah Add-On / Sambal Baru"}</span>
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="h-9 px-4 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer rounded-xl"
                >
                  Batal
                </Button>
              </div>

              {/* Responsive Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                {/* Nama Add On */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-foreground block">
                    Nama Add-On / Opsi Sambal <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    placeholder="Contoh: Sambal Bawang Nyamleng 🌶️, Ekstra Sambal Terasi, Level 3..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="font-bold text-sm text-foreground bg-background h-11 rounded-xl w-full"
                  />
                  <span className="text-xs text-muted-foreground block">
                    Nama topping/sambal yang muncul sebagai opsi pilihan saat pemesanan makanan.
                  </span>
                </div>

                {/* Harga Jual */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Harga Jual Tambahan (Rp) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    className="font-mono font-bold text-sm text-foreground bg-background h-11 rounded-xl w-full"
                  />
                  <span className="text-xs text-muted-foreground block">
                    Isi 0 jika gratis (misal pilihan sambal bawaan / porsi gratis).
                  </span>
                </div>

                {/* Modal HPP */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Modal HPP (Rp)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={hpp}
                    onChange={(e) => setHpp(e.target.value === "" ? "" : Number(e.target.value))}
                    className="font-mono font-bold text-sm text-foreground bg-background h-11 rounded-xl w-full"
                  />
                  <span className="text-xs text-muted-foreground block">
                    Digunakan untuk kalkulasi laba bersih akurat per porsi topping.
                  </span>
                </div>

                {/* Kategori Wadah / Kelompok */}
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground block">
                      Wadah Kelompok / Kategori Add-On
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(!isCustomCategory)}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      {isCustomCategory ? "Pilih dari Preset Wadah" : "+ Ketik Wadah / Kelompok Baru"}
                    </button>
                  </div>

                  {isCustomCategory ? (
                    <Input
                      type="text"
                      placeholder="Ketik kelompok baru (contoh: 🌶️ Pilihan Sambal Spesial)"
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      className="h-11 text-sm font-bold bg-background rounded-xl w-full"
                    />
                  ) : (
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="bg-background font-bold text-sm h-11 rounded-xl w-full">
                        <SelectValue placeholder="Pilih Wadah Kelompok" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_PRESETS.map((cat) => (
                          <SelectItem key={cat} value={cat} className="font-bold text-xs sm:text-sm">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Status Toggle */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-foreground block">
                    Status Ketersediaan Opsi
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsActive(!isActive)}
                    className={`justify-between text-xs sm:text-sm font-bold h-11 rounded-xl bg-background cursor-pointer w-full ${
                      isActive ? "text-emerald-600 border-emerald-500/40" : "text-rose-500 border-rose-500/40"
                    }`}
                  >
                    <span>{isActive ? "🟢 Aktif (Tersedia Dipilih Pembeli)" : "🔴 Nonaktif (Stok Habis / Tutup)"}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  className="cursor-pointer rounded-xl h-11 px-6 text-xs sm:text-sm font-bold"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold cursor-pointer rounded-xl h-11 px-8 text-xs sm:text-sm shadow-sm"
                >
                  {editingId ? "Update Data Add-On ✨" : "Simpan Add-On ✨"}
                </Button>
              </div>
            </form>
          )}

          {/* Filter Bar Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-xs font-bold text-muted-foreground shrink-0 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Filter Kelompok:
            </span>
            {[
              "Semua",
              "🌶️ Pilihan Sambal",
              "🔥 Level Pedas",
              "🍳 Ekstra Topping / Lauk",
              "🥤 Pilihan Es / Suhu",
            ].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedFilterCategory(cat)}
                className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer text-xs ${
                  selectedFilterCategory === cat
                    ? "bg-primary text-primary-foreground shadow-xs ring-1 ring-primary/40 font-extrabold"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Add-On List (Roomy 1/2/3 Columns) */}
          {filteredAddOns.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 border border-dashed border-border rounded-2xl p-6">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="font-bold text-foreground text-sm">Belum Ada Add-On di Kelompok Ini</p>
              <p className="text-xs text-muted-foreground mt-1">
                Klik tombol <strong>&quot;+ Add-On / Sambal Baru&quot;</strong> atau <strong>&quot;Auto Create 3 Opsi Sambal&quot;</strong> di atas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAddOns.map((addon) => (
                <div
                  key={addon.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    addon.isActive
                      ? "bg-card border-border hover:border-primary/50 shadow-xs hover:shadow-md"
                      : "bg-muted/30 border-border/60 opacity-60"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h5 className="font-black text-sm sm:text-base text-foreground leading-snug flex items-center gap-1.5">
                        {addon.name}
                      </h5>
                      <Badge
                        variant="outline"
                        className={`text-xs px-2.5 py-0.5 font-extrabold uppercase ${
                          addon.isActive
                            ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
                            : "text-rose-500 border-rose-500/30 bg-rose-500/10"
                        }`}
                      >
                        {addon.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>

                    <div className="p-2.5 bg-muted/40 rounded-xl border border-border flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-mono font-black text-primary text-sm sm:text-base">
                        {addon.price > 0 ? `+ Rp ${addon.price.toLocaleString("id-ID")}` : "Gratis (Rp 0)"}
                      </span>
                      {addon.hpp > 0 && (
                        <span className="font-mono text-muted-foreground text-xs">
                          HPP: Rp {addon.hpp.toLocaleString("id-ID")}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md font-semibold inline-block">
                        Wadah: {addon.category || "Semua"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-mono">
                      ID: {addon.id.slice(0, 10)}...
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(addon)}
                        className={`w-8 h-8 rounded-lg cursor-pointer ${
                          addon.isActive ? "text-emerald-600 hover:bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"
                        }`}
                        title={addon.isActive ? "Nonaktifkan" : "Aktifkan"}
                      >
                        {addon.isActive ? <Check className="w-4 h-4 stroke-[2.5]" /> : <X className="w-4 h-4" />}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(addon)}
                        className="w-8 h-8 rounded-lg text-primary hover:bg-primary/10 cursor-pointer"
                        title="Edit Add-On"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(addon.id, addon.name)}
                        className="w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                        title="Hapus Add-On"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Bottom Bar */}
        {!isFormOpen && (
          <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between text-xs sm:text-sm text-muted-foreground shrink-0">
            <span>Total: <strong className="text-foreground">{addOns.length} Add-On &amp; Sambal</strong> terdaftar</span>
            <Button variant="outline" onClick={onClose} className="cursor-pointer font-bold h-10 px-6 rounded-xl text-xs sm:text-sm">
              Tutup
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
