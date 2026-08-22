"use client";

import { useState, useEffect, useRef } from "react";
import { MenuItem } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Upload, ImageIcon, Sparkles, Tag, Plus, Check, Percent, Calculator, X, AlignLeft, AlertCircle } from "lucide-react";
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
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Menu Ayam Nyamleng");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");

  const [priceStr, setPriceStr] = useState<string>("15.000");
  const [hppStr, setHppStr] = useState<string>("8.000");
  const [taxPercent, setTaxPercent] = useState<number>(10);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Target Margin Percentage State
  const [targetMargin, setTargetMargin] = useState<number>(45);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cats = getStoredCategories();
    setAvailableCategories(cats);
    setErrorMessage(null);
    setIsSaving(false);

    if (itemToEdit) {
      setName(itemToEdit.name);
      setDescription(itemToEdit.description || "");
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

      const initPrice = itemToEdit.price || 0;
      const initHpp = itemToEdit.hpp || 0;
      if (initPrice > 0) {
        setTargetMargin(Math.max(0, Math.round(((initPrice - initHpp) / initPrice) * 100)));
      }
    } else {
      setName("");
      setDescription("");
      setCategory(cats[0] || "Menu Ayam Nyamleng");
      setIsCustomCategory(false);
      setCustomCategoryInput("");
      setPriceStr("15.000");
      setHppStr("8.000");
      setTargetMargin(47);
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
      const src = e.target?.result as string;
      if (!src) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600;
        const scaleSize = MAX_WIDTH / img.width;

        if (scaleSize < 1) {
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        setImageUrl(compressedBase64);
      };
      img.src = src;
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

  // Recalculate price when target margin is explicitly set by user/preset
  const handleTargetMarginChange = (marginVal: number) => {
    setTargetMargin(marginVal);
    if (marginVal < 100 && numHpp > 0) {
      const calculatedPrice = Math.round(numHpp / (1 - marginVal / 100));
      setPriceStr(formatNumber(calculatedPrice));
    }
  };

  // Recalculate target margin when price input is changed directly
  const handlePriceChange = (valStr: string) => {
    const formatted = formatNumber(valStr);
    setPriceStr(formatted);
    const p = parseNumber(formatted);
    if (p > 0) {
      const effMargin = Math.max(0, Math.round(((p - numHpp) / p) * 100));
      setTargetMargin(effMargin);
    }
  };

  // Recalculate target margin when HPP input is changed directly
  const handleHppChange = (valStr: string) => {
    const formatted = formatNumber(valStr);
    setHppStr(formatted);
    const h = parseNumber(formatted);
    if (numPrice > 0) {
      const effMargin = Math.max(0, Math.round(((numPrice - h) / numPrice) * 100));
      setTargetMargin(effMargin);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("⚠️ Nama Menu Produk wajib diisi!");
      if (formRef.current) formRef.current.scrollTop = 0;
      if (nameInputRef.current) nameInputRef.current.focus();
      return;
    }

    if (numPrice <= 0) {
      setErrorMessage("⚠️ Harga Jual harus lebih dari Rp 0!");
      return;
    }

    setIsSaving(true);

    try {
      const finalCategory = isCustomCategory
        ? (customCategoryInput.trim() || "Menu Alacarte")
        : category;

      if (isCustomCategory && customCategoryInput.trim()) {
        addNewCategoryOptimistic(customCategoryInput.trim());
      }

      const newItem: MenuItem = {
        id: itemToEdit ? itemToEdit.id : `menu-${Date.now()}`,
        name: name.trim(),
        description: description.trim() || null,
        category: finalCategory,
        price: numPrice,
        hpp: numHpp,
        taxPercent: Number(taxPercent),
        imageUrl: imageUrl || null,
        icon: null,
        isActive,
      };

      await onSave(newItem);
    } catch (err: any) {
      console.error("Save menu error:", err);
      setErrorMessage(`Gagal menyimpan menu: ${err.message || "Terjadi kesalahan"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const marginPercent = numPrice > 0 ? Math.round(((numPrice - numHpp) / numPrice) * 100) : 0;
  const profitAmount = numPrice - numHpp;
  const taxAmount = Math.round((numPrice * taxPercent) / 100);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[96vw] sm:w-[94vw] md:max-w-3xl lg:max-w-4xl xl:max-w-5xl p-0 overflow-hidden bg-card border-border shadow-2xl rounded-3xl flex flex-col max-h-[90vh]"
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

        {/* Error Alert Notice */}
        {errorMessage && (
          <div className="mx-4 mt-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-2.5 text-rose-600 dark:text-rose-400 text-xs font-extrabold animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body - Scrollable Container */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
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
                    className="w-full h-36 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-2 text-xs sm:text-sm backdrop-blur-xs">
                    <Upload className="w-4 h-4" />
                    <span>Ganti Foto Menu</span>
                  </div>
                </div>
              ) : (
                <div className="p-5 text-center flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-foreground block text-xs sm:text-sm">
                      Klik atau seret foto menu ke area ini
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Mendukung JPG, PNG, WebP (Rasio 1:1 atau 16:9 disarankan)
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

          {/* Form Fields: Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            {/* Menu Name Input (Full Width on Desktop) */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-foreground block">
                Nama Menu Produk <span className="text-destructive">*</span>
              </label>
              <Input
                ref={nameInputRef}
                type="text"
                placeholder="Contoh: Ayam Bakar Bumbu Madu Nyamleng"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`h-11 text-sm font-bold bg-background rounded-xl w-full ${
                  !name.trim() && errorMessage ? "border-rose-500 ring-2 ring-rose-500/20" : ""
                }`}
                required
              />
            </div>

            {/* Menu Description Input (Full Width on Desktop) */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground block">
                  Deskripsi Menu Produk
                </label>
                <span className="text-xs text-muted-foreground font-medium">
                  Tersinkronisasi ke Menu Digital
                </span>
              </div>
              <Textarea
                placeholder="Contoh: Daging ayam pilihan empuk yang dibakar dengan bumbu madu gurih manis khas Nyamleng, disajikan lengkap dengan lalapan dan sambal korek pedas."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="text-sm bg-background font-medium rounded-xl min-h-[75px] resize-y w-full"
              />
            </div>

            {/* Category Selector with Quick Chips (Full Width on Desktop) */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground block">Wadah Kategori</label>
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
                  className="h-11 text-sm font-bold bg-background rounded-xl w-full"
                  required
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        category === cat
                          ? "bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/40 font-black"
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

            {/* Target Margin Smart Calculator Card (Full Width on Desktop) */}
            <div className="md:col-span-2 p-4 bg-amber-500/10 dark:bg-amber-500/5 rounded-2xl border border-amber-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shadow-xs">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-black text-xs sm:text-sm text-amber-950 dark:text-amber-200 block">
                      Target Margin Keuntungan (%)
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Hitung rekomendasi harga jual otomatis dari modal HPP
                    </span>
                  </div>
                </div>

                <div className="relative w-28 shrink-0">
                  <Input
                    type="number"
                    value={targetMargin || ""}
                    onChange={(e) => handleTargetMarginChange(Number(e.target.value))}
                    placeholder="45"
                    className="h-10 text-sm font-black font-mono text-center pr-7 bg-background rounded-xl"
                    min={0}
                    max={99}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-amber-600 dark:text-amber-400 select-none">
                    %
                  </span>
                </div>
              </div>

              {/* Quick Presets Pills */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-amber-500/20">
                <span className="text-xs font-bold text-muted-foreground shrink-0 mr-1">
                  Preset Cepat:
                </span>
                {[25, 35, 45, 50, 60, 70].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleTargetMarginChange(m)}
                    className={`h-8 px-3 text-xs font-bold rounded-lg cursor-pointer transition-all ${
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
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Harga Jual (Rp) <span className="text-destructive">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 font-bold font-mono text-muted-foreground text-sm select-none">
                  Rp
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={priceStr}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className="pl-11 pr-3 h-11 text-sm font-mono font-black bg-background rounded-xl text-primary w-full"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                HPP / Modal Porsi (Rp) <span className="text-destructive">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 font-bold font-mono text-muted-foreground text-sm select-none">
                  Rp
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={hppStr}
                  onChange={(e) => handleHppChange(e.target.value)}
                  className="pl-11 pr-3 h-11 text-sm font-mono font-bold bg-background rounded-xl w-full"
                  required
                />
              </div>
            </div>

            {/* Tax Selector (Full Width on Desktop) */}
            <div className="md:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground block">
                  Pajak Restoran / PPN (%)
                </label>
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
                    className="h-11 text-sm font-mono font-bold pr-7 bg-background rounded-xl w-full"
                    min={0}
                    max={100}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs select-none">
                    %
                  </span>
                </div>

                <div className="flex gap-1.5">
                  {[0, 5, 10, 11].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setTaxPercent(pct)}
                      className={`h-11 px-4 text-xs font-bold rounded-xl cursor-pointer transition-all ${
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
          </div>

          {/* Live Calculation Summary Breakdown Card */}
          <div className="p-4 bg-muted/40 rounded-2xl border border-border grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-xs text-muted-foreground font-bold block mb-1">
                Laba Per Porsi
              </span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                Rp {profitAmount.toLocaleString("id-ID")}
              </span>
            </div>

            <div>
              <span className="text-xs text-muted-foreground font-bold block mb-1">
                Margin Bersih
              </span>
              <span className={`font-mono font-black text-sm sm:text-base ${
                marginPercent >= 40 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
              }`}>
                {marginPercent}%
              </span>
            </div>

            <div>
              <span className="text-xs text-muted-foreground font-bold block mb-1">
                Pajak Terkumpul
              </span>
              <span className="font-mono font-bold text-foreground text-sm sm:text-base">
                Rp {taxAmount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Active Status Checkbox */}
          <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/20 border border-border cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 rounded-md border-border text-primary accent-primary cursor-pointer"
            />
            <span className="text-xs sm:text-sm font-bold text-foreground">
              Tampilkan menu ini di Kasir POS &amp; Menu Digital (Status Aktif)
            </span>
          </label>

          {/* Action Footer Buttons */}
          <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="h-11 px-6 text-xs sm:text-sm font-bold rounded-xl cursor-pointer"
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={isSaving}
              className="h-11 px-8 text-xs sm:text-sm font-extrabold gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{isSaving ? "Menyimpan..." : "Simpan Menu ✨"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
