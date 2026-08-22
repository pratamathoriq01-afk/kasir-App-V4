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
  Tag,
  Flame,
  Wand2,
  Power,
} from "lucide-react";

interface AddOnManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_PRESETS = [
  "Semua",
  "🍹 Pilihan Minuman Paket",
  "🍚 Pilihan Nasi",
  "🌶️ Pilihan Sambal",
  "🔥 Level Pedas",
  "🍳 Ekstra Topping / Lauk",
  "🥤 Pilihan Es & Gula",
  "Semua Makanan",
  "Semua Minuman",
  "Menu Ayam Nyamleng",
  "Menu Ikan Nyamleng",
  "Menu Minuman",
  "Menu Alacarte",
  "Cemilan & Snack",
  "Paket Hemat",
];

const SAMBAL_AND_DRINK_DEFAULTS = [
  // Minuman Paket Hemat / Bundling
  { name: "ES Teh Manis Segar (Paket) 🥤", price: 0, hpp: 500, category: "🍹 Pilihan Minuman Paket" },
  { name: "ES Jeruk Peras Segar (Paket) 🍊", price: 0, hpp: 1000, category: "🍹 Pilihan Minuman Paket" },
  { name: "Air Mineral Dingin (Paket) 💧", price: 0, hpp: 1000, category: "🍹 Pilihan Minuman Paket" },

  // Pilihan Nasi / Karbo
  { name: "Nasi Putih Matang 🍚", price: 0, hpp: 1500, category: "🍚 Pilihan Nasi" },
  { name: "Nasi Daun Jeruk Nyamleng 🍃", price: 2000, hpp: 2000, category: "🍚 Pilihan Nasi" },
  { name: "Tanpa Nasi / Tanpa Karbo 🚫🍚", price: 0, hpp: 0, category: "🍚 Pilihan Nasi" },

  // Sambal
  { name: "Sambal Bawang Nyamleng 🌶️", price: 0, hpp: 500, category: "🌶️ Pilihan Sambal" },
  { name: "Sambal Terasi Matang 🔴", price: 0, hpp: 500, category: "🌶️ Pilihan Sambal" },
  { name: "Sambal Hijau / Ijo Segar 🟢", price: 0, hpp: 500, category: "🌶️ Pilihan Sambal" },
  { name: "Sambal Matah Bali 🥭", price: 0, hpp: 500, category: "🌶️ Pilihan Sambal" },

  // Level Pedas
  { name: "Level 1 — Sedang 🌶️", price: 0, hpp: 0, category: "🔥 Level Pedas" },
  { name: "Level 2 — Pedas 🔥", price: 0, hpp: 0, category: "🔥 Level Pedas" },
  { name: "Level 3 — Ekstra Pedas 💥", price: 1000, hpp: 0, category: "🔥 Level Pedas" },

  // Topping & Lauk Ala Carte
  { name: "Tahu Goreng Crispy 🧈", price: 2500, hpp: 1000, category: "🍳 Ekstra Topping / Lauk" },
  { name: "Tempe Goreng Nyamleng 🥓", price: 2500, hpp: 1000, category: "🍳 Ekstra Topping / Lauk" },
  { name: "Terong Goreng Crispy 🍆", price: 3000, hpp: 1000, category: "🍳 Ekstra Topping / Lauk" },
  { name: "Telur Ceplok / Dadar 🍳", price: 4000, hpp: 2000, category: "🍳 Ekstra Topping / Lauk" },

  // Minuman (Es & Suhu)
  { name: "Es Normal 🧊", price: 0, hpp: 0, category: "🥤 Pilihan Es & Gula" },
  { name: "Es Sedikit / Less Ice 🧊", price: 0, hpp: 0, category: "🥤 Pilihan Es & Gula" },
  { name: "Tanpa Es / No Ice 🚫🧊", price: 0, hpp: 0, category: "🥤 Pilihan Es & Gula" },
  { name: "Hangat / Warm ☕", price: 0, hpp: 0, category: "🥤 Pilihan Es & Gula" },

  // Minuman (Gula & Manis)
  { name: "Gula Normal 🍬", price: 0, hpp: 0, category: "🥤 Pilihan Es & Gula" },
  { name: "Gula Sedikit / Less Sugar 🤏", price: 0, hpp: 0, category: "🥤 Pilihan Es & Gula" },
  { name: "Tanpa Gula / No Sugar 🚫🍬", price: 0, hpp: 0, category: "🥤 Pilihan Es & Gula" },
  { name: "Ekstra Shot Gula 🍯", price: 1000, hpp: 200, category: "🥤 Pilihan Es & Gula" },
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
  const [category, setCategory] = useState("🍹 Pilihan Minuman Paket");
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
    setCategory("🍹 Pilihan Minuman Paket");
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

    let finalCat = isCustomCategory
      ? customCategoryInput.trim() || "Semua"
      : category;

    const nameLower = name.toLowerCase().trim();
    if (nameLower.includes("nasi") || nameLower.includes("karbo")) {
      finalCat = "🍚 Pilihan Nasi";
    } else if (nameLower.includes("sambal") || nameLower.includes("bawang") || nameLower.includes("hijau") || nameLower.includes("matah") || nameLower.includes("terasi")) {
      finalCat = "🌶️ Pilihan Sambal";
    } else if (nameLower.includes("pedas") || nameLower.includes("level") || nameLower.includes("sedang") || nameLower.includes("super")) {
      finalCat = "🔥 Level Pedas";
    } else if (nameLower.includes("tahu") || nameLower.includes("tempe") || nameLower.includes("terong") || nameLower.includes("telur")) {
      finalCat = "🍳 Ekstra Topping / Lauk";
    }

    const payload: AddOn = {
      id: editingId || `addon-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim(),
      price: Number(price) || 0,
      hpp: Number(hpp) || 0,
      category: finalCat,
      isActive,
    };

    await saveAddOnOptimistic(payload);
    setAddOns(getStoredAddOns());
    resetForm();
  };

  const handleToggleStatus = async (addon: AddOn) => {
    const updatedAddon = { ...addon, isActive: !addon.isActive };
    await saveAddOnOptimistic(updatedAddon);
    setAddOns(getStoredAddOns());
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus Add-On ini?")) return;
    await deleteAddOnOptimistic(id);
    setAddOns(getStoredAddOns());
    if (editingId === id) resetForm();
  };

  const handleAutoCreateSambals = async () => {
    setIsGeneratingSambal(true);
    try {
      for (const preset of SAMBAL_AND_DRINK_DEFAULTS) {
        const exists = addOns.some(
          (a) => a.name.toLowerCase().trim() === preset.name.toLowerCase().trim()
        );
        if (!exists) {
          const itemPayload: AddOn = {
            id: `addon-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            name: preset.name,
            price: preset.price,
            hpp: preset.hpp,
            category: preset.category,
            isActive: true,
          };
          await saveAddOnOptimistic(itemPayload);
        }
      }
      setAddOns(getStoredAddOns());
    } catch (e) {
      console.error("Auto create preset add-ons error:", e);
    } finally {
      setIsGeneratingSambal(false);
    }
  };

  // Smart Keyword Filter: Match both category field & item name keywords
  const filteredAddOns = addOns.filter((a) => {
    if (selectedFilterCategory === "Semua") return true;

    const cat = (a.category || "Semua").toLowerCase();
    const nameLower = a.name.toLowerCase();

    if (selectedFilterCategory === "🍹 Pilihan Minuman Paket") {
      return (
        cat.includes("paket") ||
        nameLower.includes("paket") ||
        (nameLower.includes("es") && nameLower.includes("teh")) ||
        (nameLower.includes("es") && nameLower.includes("jeruk"))
      );
    }

    if (selectedFilterCategory === "🍚 Pilihan Nasi") {
      return (
        cat.includes("nasi") ||
        cat.includes("karbo") ||
        nameLower.includes("nasi") ||
        nameLower.includes("karbo") ||
        nameLower.includes("jeruk")
      );
    }

    if (selectedFilterCategory === "🌶️ Pilihan Sambal") {
      return (
        cat.includes("sambal") ||
        nameLower.includes("sambal") ||
        nameLower.includes("bawang") ||
        nameLower.includes("hijau") ||
        nameLower.includes("matah") ||
        nameLower.includes("terasi")
      );
    }

    if (selectedFilterCategory === "🔥 Level Pedas") {
      return (
        cat.includes("pedas") ||
        nameLower.includes("pedas") ||
        nameLower.includes("level") ||
        nameLower.includes("sedang") ||
        nameLower.includes("super")
      );
    }

    if (selectedFilterCategory === "🍳 Ekstra Topping / Lauk") {
      return (
        cat.includes("topping") ||
        cat.includes("lauk") ||
        nameLower.includes("tahu") ||
        nameLower.includes("tempe") ||
        nameLower.includes("terong") ||
        nameLower.includes("telur")
      );
    }

    if (selectedFilterCategory === "🥤 Pilihan Es & Gula") {
      return (
        cat.includes("minuman") ||
        cat.includes("es") ||
        cat.includes("gula") ||
        nameLower.includes("es") ||
        nameLower.includes("gula") ||
        nameLower.includes("hangat") ||
        nameLower.includes("ice") ||
        nameLower.includes("sugar")
      );
    }

    return (a.category || "Semua") === selectedFilterCategory;
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[96vw] sm:w-[94vw] md:max-w-4xl lg:max-w-5xl max-h-[92vh] p-0 overflow-hidden bg-card border-border shadow-2xl rounded-3xl flex flex-col"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 border-b border-amber-400/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-xs text-white shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-white">
                Kelola Add-On &amp; Varian (Minuman Paket, Nasi, Sambal, Pedas, Topping)
              </DialogTitle>
              <p className="text-xs text-amber-100 font-medium">
                Tambah, edit, hapus, &amp; kontrol stok aktif/habis opsi makanan &amp; minuman realtime 0ms.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-4 sm:px-6 border-b border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">Filter Grup:</span>
            {[
              "Semua",
              "🍹 Pilihan Minuman Paket",
              "🍚 Pilihan Nasi",
              "🌶️ Pilihan Sambal",
              "🔥 Level Pedas",
              "🍳 Ekstra Topping / Lauk",
              "🥤 Pilihan Es & Gula",
            ].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  selectedFilterCategory === cat
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-background border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isGeneratingSambal}
              onClick={handleAutoCreateSambals}
              className="h-9 px-3 text-xs font-bold gap-1.5 cursor-pointer rounded-xl border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{isGeneratingSambal ? "Membuat..." : "✨ Auto Preset Lengkap"}</span>
            </Button>

            {!isFormOpen && (
              <Button
                type="button"
                size="sm"
                onClick={() => setIsFormOpen(true)}
                className="h-9 px-4 text-xs font-extrabold gap-1.5 cursor-pointer rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Tambah Varian Baru</span>
              </Button>
            )}
          </div>
        </div>

        {/* Scrollable Form & List Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Add / Edit Form Drawer */}
          {isFormOpen && (
            <form
              onSubmit={handleSave}
              className="p-4 sm:p-5 rounded-2xl bg-muted/40 border border-border space-y-4 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <span>{editingId ? "Edit Varian Add-On" : "Tambah Varian Add-On Baru"}</span>
                </h4>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-muted-foreground hover:text-foreground text-xs font-bold"
                >
                  Batal ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-foreground">Nama Varian / Option</label>
                  <Input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: ES Jeruk Peras Segar (Paket) 🍊"
                    className="h-10 text-xs sm:text-sm font-bold bg-background rounded-xl w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Harga Tambahan (Rp)</label>
                  <Input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0 (Gratis) / Rp 1.000"
                    className="h-10 text-xs sm:text-sm font-mono font-bold bg-background rounded-xl w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">HPP / Modal (Rp)</label>
                  <Input
                    type="number"
                    min={0}
                    value={hpp}
                    onChange={(e) => setHpp(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0"
                    className="h-10 text-xs sm:text-sm font-mono bg-background rounded-xl w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Grup / Kategori Add-On</label>
                  <Select
                    value={isCustomCategory ? "CUSTOM" : category}
                    onValueChange={(val) => {
                      if (val === "CUSTOM") {
                        setIsCustomCategory(true);
                      } else {
                        setIsCustomCategory(false);
                        setCategory(val);
                      }
                    }}
                  >
                    <SelectTrigger className="h-10 text-xs font-bold bg-background rounded-xl w-full">
                      <SelectValue placeholder="Pilih Grup" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_PRESETS.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-xs font-medium">
                          {cat}
                        </SelectItem>
                      ))}
                      <SelectItem value="CUSTOM" className="text-xs font-bold text-primary">
                        + Buat Grup Kustom Baru...
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {isCustomCategory && (
                    <Input
                      type="text"
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      placeholder="Masukkan nama grup kustom..."
                      className="h-9 text-xs mt-1.5 bg-background rounded-xl w-full"
                    />
                  )}
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-background border border-border cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                    />
                    <span className="text-xs font-bold text-foreground">
                      {isActive ? "🟢 Status: Aktif (Tersedia)" : "🔴 Status: Non-Aktif (Habis)"}
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  className="h-9 px-4 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-9 px-6 text-xs font-extrabold gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{editingId ? "Update Varian" : "Simpan Varian"}</span>
                </Button>
              </div>
            </form>
          )}

          {/* Add-Ons List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAddOns.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border p-6">
                <Flame className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold">Belum ada Add-On / Varian dalam grup ini.</p>
                <p className="text-[11px] mt-1 text-muted-foreground">
                  Klik "+ Tambah Varian Baru" atau gunakan "✨ Auto Preset Lengkap" di atas.
                </p>
              </div>
            ) : (
              filteredAddOns.map((addon) => (
                <div
                  key={addon.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    addon.isActive
                      ? "bg-card border-border hover:border-primary/40 shadow-xs"
                      : "bg-muted/40 border-border/60 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge
                        variant="secondary"
                        className="text-[9.5px] px-2 py-0.5 font-bold mb-1.5 bg-muted text-muted-foreground"
                      >
                        {addon.category || "Semua"}
                      </Badge>
                      <h4 className="font-extrabold text-sm text-foreground leading-tight">
                        {addon.name}
                      </h4>
                    </div>

                    {/* Instant Toggle Stock Button (0ms Sync) */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(addon)}
                      className={`px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                        addon.isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                      }`}
                      title={addon.isActive ? "Klik untuk tandai HABIS" : "Klik untuk tandai TERSEDIA"}
                    >
                      <Power className="w-3 h-3" />
                      <span>{addon.isActive ? "AKTIFF" : "HABIS"}</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-medium">Harga Tambahan</span>
                      <span className="text-xs font-extrabold font-mono text-primary">
                        {addon.price > 0 ? `+Rp ${addon.price.toLocaleString("id-ID")}` : "Gratis / Rp 0"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(addon)}
                        className="w-8 h-8 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Edit Varian"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(addon.id)}
                        className="w-8 h-8 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                        title="Hapus Varian"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
