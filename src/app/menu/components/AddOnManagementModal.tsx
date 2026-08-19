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
import { Plus, Trash2, Edit3, Sparkles, Check, X, Tag, DollarSign, Layers } from "lucide-react";

interface AddOnManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_PRESETS = [
  "Semua",
  "Menu Ayam Nyamleng",
  "Menu Ikan Nyamleng",
  "Menu Minuman",
  "Menu Alacarte",
  "Cemilan & Snack",
  "Paket Hemat",
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
  const [category, setCategory] = useState("Semua");
  const [isActive, setIsActive] = useState(true);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("Semua");

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
    setCategory("Semua");
    setIsActive(true);
    setIsFormOpen(false);
  };

  const handleEdit = (addon: AddOn) => {
    setEditingId(addon.id);
    setName(addon.name);
    setPrice(addon.price);
    setHpp(addon.hpp);
    setCategory(addon.category || "Semua");
    setIsActive(addon.isActive);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: AddOn = {
      id: editingId || `addon-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim(),
      price: Number(price) || 0,
      hpp: Number(hpp) || 0,
      category,
      isActive,
      updatedAt: new Date().toISOString(),
    };

    // 0ms Optimistic UI
    await saveAddOnOptimistic(payload);
    setAddOns(getStoredAddOns());
    resetForm();
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
    return a.category === selectedFilterCategory || a.category === "Semua";
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-3xl w-[96vw] sm:w-full max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card text-card-foreground border-border rounded-3xl shadow-2xl"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-800 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 border-b border-emerald-600/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-xs text-white rounded-2xl shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-white">
                Kelola Add-On &amp; Topping Menu
              </DialogTitle>
              <p className="text-xs text-emerald-100 font-medium">
                Atur ekstra topping, sambal, porsi nasi &amp; level pedas realtime.
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
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs h-9 px-3.5 gap-1.5 rounded-xl cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Add-On Baru</span>
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Add / Edit Form Card */}
          {isFormOpen && (
            <form
              onSubmit={handleSave}
              className="p-4 sm:p-5 bg-muted/40 border border-primary/30 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h4 className="font-black text-xs sm:text-sm text-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <span>{editingId ? "Edit Data Add-On" : "Tambah Add-On Baru"}</span>
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
                >
                  Batal
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Nama Add On */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-foreground">
                    Nama Add-On / Topping <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    placeholder="Contoh: Ekstra Sambal Bawang, Telur Dadar Crispy, Level Pedas 3..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="font-bold text-xs sm:text-sm text-foreground bg-background h-10 rounded-xl"
                  />
                </div>

                {/* Harga Jual */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Harga Jual (Rp) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    className="font-mono font-bold text-xs sm:text-sm text-foreground bg-background h-10 rounded-xl"
                  />
                  <span className="text-xs text-muted-foreground block">
                    Isi 0 jika gratis (misal pilihan level pedas).
                  </span>
                </div>

                {/* Modal HPP */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Modal HPP (Rp)</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={hpp}
                    onChange={(e) => setHpp(e.target.value === "" ? "" : Number(e.target.value))}
                    className="font-mono font-bold text-xs sm:text-sm text-foreground bg-background h-10 rounded-xl"
                  />
                  <span className="text-xs text-muted-foreground block">
                    Digunakan untuk kalkulasi laba bersih akurat.
                  </span>
                </div>

                {/* Kategori Wadah Berlakunya */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Berlaku Untuk Wadah Kategori</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-background font-bold text-xs h-10 rounded-xl">
                      <SelectValue placeholder="Pilih Wadah" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_PRESETS.map((cat) => (
                        <SelectItem key={cat} value={cat} className="font-bold text-xs">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Toggle */}
                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="text-xs font-bold text-foreground">Status Ketersediaan</label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsActive(!isActive)}
                    className={`justify-between text-xs font-bold h-10 rounded-xl bg-background cursor-pointer ${
                      isActive ? "text-emerald-600 border-emerald-500/40" : "text-rose-500 border-rose-500/40"
                    }`}
                  >
                    <span>{isActive ? "🟢 Aktif (Tersedia)" : "🔴 Nonaktif (Habis)"}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2.5 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={resetForm} className="cursor-pointer rounded-xl h-9 px-4 text-xs">
                  Batal
                </Button>
                <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold cursor-pointer rounded-xl h-9 px-5 text-xs shadow-sm">
                  Simpan Add-On
                </Button>
              </div>
            </form>
          )}

          {/* Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-xs font-bold text-muted-foreground shrink-0 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Wadah:
            </span>
            {CATEGORY_PRESETS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer text-xs ${
                  selectedFilterCategory === cat
                    ? "bg-primary text-primary-foreground shadow-xs ring-1 ring-primary/40 font-extrabold"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Add-On List */}
          {filteredAddOns.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 border border-dashed border-border rounded-2xl p-6">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="font-bold text-foreground text-sm">Belum Ada Add-On di Wadah Ini</p>
              <p className="text-xs text-muted-foreground mt-1">
                Klik tombol <strong>&quot;+ Add-On Baru&quot;</strong> di atas untuk membuat pilihan topping pertama.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredAddOns.map((addon) => (
                <div
                  key={addon.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    addon.isActive
                      ? "bg-card border-border hover:border-primary/50 shadow-xs"
                      : "bg-muted/30 border-border/60 opacity-60"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="font-black text-sm text-foreground truncate">{addon.name}</h5>
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0.2 font-extrabold uppercase ${
                          addon.isActive
                            ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
                            : "text-rose-500 border-rose-500/30 bg-rose-500/10"
                        }`}
                      >
                        {addon.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-xs">
                      <span className="font-mono font-black text-primary text-xs sm:text-sm">
                        {addon.price > 0 ? `+ Rp ${addon.price.toLocaleString("id-ID")}` : "Gratis (Rp 0)"}
                      </span>
                      {addon.hpp > 0 && (
                        <span className="font-mono text-muted-foreground text-xs">
                          HPP: Rp {addon.hpp.toLocaleString("id-ID")}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md font-semibold truncate max-w-[140px]">
                        {addon.category || "Semua"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
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
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between text-xs text-muted-foreground shrink-0">
          <span>Total: <strong className="text-foreground">{addOns.length} Add-On</strong> terdaftar</span>
          <Button variant="outline" onClick={onClose} className="cursor-pointer font-bold h-9 px-5 rounded-xl text-xs">
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
