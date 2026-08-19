"use client";

import { useState, useEffect, useRef } from "react";
import { MenuItem } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Upload, ImageIcon, Sparkles, Tag, Plus, Check, Percent, Calculator, X } from "lucide-react";
import { getStoredCategories, addNewCategoryOptimistic } from "@/lib/data-service";

interface MenuFormModalProps {
  isOpen: boolean;
  itemToEdit: MenuItem | null;
  onClose: () => void;
  onSave: (item: MenuItem) => void;
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

export default function MenuFormModal({
  isOpen,
  itemToEdit,
  onClose,
  onSave,
}: MenuFormModalProps) {
  const [availableCategories, setAvailableCategories] = useState<string[]>(() => getStoredCategories());
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Menu Ayam Nyamleng");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");

  const [priceStr, setPriceStr] = useState<string>("15.000");
  const [hppStr, setHppStr] = useState<string>("8.000");
  const [taxPercent, setTaxPercent] = useState<number>(10);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Target Margin Percentage State
  const [targetMargin, setTargetMargin] = useState<number>(45);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cats = getStoredCategories();
    setAvailableCategories(cats);

    if (itemToEdit) {
      setName(itemToEdit.name);
      const isPreset = cats.includes(itemToEdit.category);
      if (isPreset) {
        setCategory(itemToEdit.category);
        setIsCustomCategory(false);
      } else {
        setCategory(itemToEdit.category);
        setIsCustomCategory(true);
        setCustomCategoryInput(itemToEdit.category);
      }
      setPriceStr(new Intl.NumberFormat("id-ID").format(itemToEdit.price || 0));
      setHppStr(new Intl.NumberFormat("id-ID").format(itemToEdit.hpp || 0));
      setTaxPercent(itemToEdit.taxPercent ?? 10);
      setImageUrl(itemToEdit.imageUrl || null);
      setIsActive(itemToEdit.isActive);
    } else {
      setName("");
      setCategory(cats[0] || "Menu Ayam Nyamleng");
      setIsCustomCategory(false);
      setCustomCategoryInput("");
      setPriceStr("15.000");
      setHppStr("8.000");
      setTaxPercent(10);
      setImageUrl(null);
      setIsActive(true);
    }
  }, [itemToEdit, isOpen]);

  const parseNumber = (val: string) => {
    const clean = val.replace(/\D/g, "");
    return clean ? parseInt(clean, 10) : 0;
  };

  const formatNumber = (val: string | number) => {
    const raw = String(val).replace(/\D/g, "");
    if (!raw) return "";
    return new Intl.NumberFormat("id-ID").format(parseInt(raw, 10));
  };

  const numPrice = parseNumber(priceStr);
  const numHpp = parseNumber(hppStr);

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleImageFile(file);
  };

  // Recalculate price when target margin is used
  const handleTargetMarginChange = (marginVal: number) => {
    setTargetMargin(marginVal);
    if (marginVal < 100 && numHpp > 0) {
      const calculatedPrice = Math.round(numHpp / (1 - marginVal / 100));
      setPriceStr(formatNumber(calculatedPrice));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Nama menu tidak boleh kosong");
      return;
    }

    const finalCategory = isCustomCategory
      ? (customCategoryInput.trim() || "Menu Alacarte")
      : category;

    if (isCustomCategory && customCategoryInput.trim()) {
      addNewCategoryOptimistic(customCategoryInput.trim());
    }

    const newItem: MenuItem = {
      id: itemToEdit ? itemToEdit.id : `menu-${Date.now()}`,
      name: name.trim(),
      category: finalCategory,
      price: numPrice,
      hpp: numHpp,
      taxPercent: Number(taxPercent),
      imageUrl: imageUrl || null,
      icon: null,
      isActive,
    };

    onSave(newItem);
  };

  const marginPercent = numPrice > 0 ? Math.round(((numPrice - numHpp) / numPrice) * 100) : 0;
  const profitAmount = numPrice - numHpp;
  const taxAmount = Math.round((numPrice * taxPercent) / 100);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-xl w-[96vw] sm:w-full p-0 overflow-hidden bg-card border-border shadow-2xl rounded-3xl flex flex-col max-h-[90vh]"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-800 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 border-b border-emerald-600/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-xs text-white shadow-inner">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-white">
                {itemToEdit ? `Edit Menu: ${itemToEdit.name}` : "Tambah Menu Baru"}
              </DialogTitle>
              <p className="text-xs text-emerald-100 font-medium">
                Tersinkronisasi otomatis ke Kasir POS, Supabase DB &amp; Menu Digital.
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

        {/* Form Body - Scrollable Container */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Image Upload Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                Foto / Gambar Menu Produk
              </label>
              <span className="text-xs text-muted-foreground font-medium">(Opsional)</span>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden ${
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/60 hover:bg-muted/40 bg-muted/20"
              }`}
            >
              {imageUrl ? (
                <div className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Preview Menu"
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-2 text-xs backdrop-blur-xs">
                    <Upload className="w-4 h-4" />
                    <span>Ganti Foto Menu</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-foreground block text-xs">
                      Klik atau seret foto menu ke area ini
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Mendukung format JPG, PNG, WebP (Rasio 1:1 atau 16:9 disarankan)
                    </span>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Menu Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Nama Menu Produk <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              placeholder="Contoh: Ayam Bakar Bumbu Madu Nyamleng"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 text-xs sm:text-sm font-bold bg-background rounded-xl"
              required
            />
          </div>

          {/* Category Selector with Quick Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">Wadah Kategori</label>
              <button
                type="button"
                onClick={() => setIsCustomCategory(!isCustomCategory)}
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                {isCustomCategory ? "Pilih dari Preset Wadah" : "+ Ketik Wadah Baru"}
              </button>
            </div>

            {isCustomCategory ? (
              <Input
                type="text"
                placeholder="Ketik nama wadah baru (contoh: Aneka Sambal & Lalapan)"
                value={customCategoryInput}
                onChange={(e) => setCustomCategoryInput(e.target.value)}
                className="h-10 text-xs sm:text-sm font-bold bg-background rounded-xl"
                required
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      category === cat
                        ? "bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/40"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground border border-border hover:bg-muted"
                    }`}
                  >
                    <span>{CATEGORY_ICONS[cat] || "🍽️"}</span>
                    <span>{cat}</span>
                    {category === cat && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Target Margin Smart Calculator Card */}
          <div className="p-3.5 bg-amber-500/10 dark:bg-amber-500/5 rounded-2xl border border-amber-500/30 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-xs text-amber-950 dark:text-amber-200 block">
                    Target Margin Keuntungan (%)
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Hitung rekomendasi harga jual otomatis dari modal HPP
                  </span>
                </div>
              </div>

              <div className="relative w-24 shrink-0">
                <Input
                  type="number"
                  value={targetMargin || ""}
                  onChange={(e) => handleTargetMarginChange(Number(e.target.value))}
                  placeholder="45"
                  className="h-9 text-xs sm:text-sm font-black font-mono text-center pr-7 bg-background rounded-xl"
                  min={0}
                  max={99}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-amber-600 dark:text-amber-400 select-none">
                  %
                </span>
              </div>
            </div>

            {/* Quick Presets Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-amber-500/20">
              <span className="text-xs font-bold text-muted-foreground shrink-0 mr-1">
                Preset Cepat:
              </span>
              {[25, 35, 45, 50, 60, 70].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleTargetMarginChange(m)}
                  className={`h-7 px-2.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                    targetMargin === m
                      ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                      : "bg-background border border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {m}%
                </button>
              ))}
            </div>
          </div>

          {/* Pricing & HPP Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Harga Jual (Rp) <span className="text-destructive">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-bold font-mono text-muted-foreground text-xs select-none">
                  Rp
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={priceStr}
                  onChange={(e) => setPriceStr(formatNumber(e.target.value))}
                  className="pl-9 pr-3 h-10 text-xs sm:text-sm font-mono font-black bg-background rounded-xl text-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                HPP / Modal Porsi (Rp) <span className="text-destructive">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-bold font-mono text-muted-foreground text-xs select-none">
                  Rp
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={hppStr}
                  onChange={(e) => {
                    const formatted = formatNumber(e.target.value);
                    setHppStr(formatted);
                    const rawHpp = parseNumber(formatted);
                    if (targetMargin < 100 && rawHpp > 0) {
                      setPriceStr(formatNumber(Math.round(rawHpp / (1 - targetMargin / 100))));
                    }
                  }}
                  className="pl-9 pr-3 h-10 text-xs sm:text-sm font-mono font-bold bg-background rounded-xl"
                  required
                />
              </div>
            </div>
          </div>

          {/* Tax Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">Pajak Restoran / PPN (%)</label>
              <span className="text-xs text-muted-foreground font-medium">
                Dihitung dari subtotal pesanan
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type="number"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Number(e.target.value))}
                  className="h-10 text-xs sm:text-sm font-mono font-bold pr-7 bg-background rounded-xl"
                  min={0}
                  max={100}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs select-none">
                  %
                </span>
              </div>

              <div className="flex gap-1">
                {[0, 5, 10, 11].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setTaxPercent(pct)}
                    className={`h-10 px-3 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                      taxPercent === pct
                        ? "bg-primary text-primary-foreground font-black shadow-xs"
                        : "bg-muted border border-border text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Calculation Summary Breakdown Card */}
          <div className="p-3.5 bg-muted/40 rounded-2xl border border-border grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-xs text-muted-foreground font-bold block mb-0.5">
                Laba Per Porsi
              </span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                Rp {profitAmount.toLocaleString("id-ID")}
              </span>
            </div>

            <div>
              <span className="text-xs text-muted-foreground font-bold block mb-0.5">
                Margin Bersih
              </span>
              <span className={`font-mono font-black text-xs sm:text-sm ${
                marginPercent >= 40 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
              }`}>
                {marginPercent}%
              </span>
            </div>

            <div>
              <span className="text-xs text-muted-foreground font-bold block mb-0.5">
                Pajak Terkumpul
              </span>
              <span className="font-mono font-bold text-foreground text-xs sm:text-sm">
                Rp {taxAmount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Active Status Checkbox */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/20 border border-border cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded-md border-border text-primary accent-primary cursor-pointer"
            />
            <span className="text-xs font-bold text-foreground">
              Tampilkan menu ini di Kasir POS &amp; Menu Digital (Status Aktif)
            </span>
          </label>

          {/* Action Footer Buttons */}
          <div className="pt-2 border-t border-border flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 px-5 text-xs font-bold rounded-xl cursor-pointer"
            >
              Batal
            </Button>

            <Button
              type="submit"
              className="h-10 px-6 text-xs font-extrabold gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>Simpan Menu</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
