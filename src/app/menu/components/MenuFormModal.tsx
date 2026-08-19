"use client";

import { useState, useEffect, useRef } from "react";
import { MenuItem } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Upload, ImageIcon, Sparkles, Tag, Plus, Check } from "lucide-react";

interface MenuFormModalProps {
  isOpen: boolean;
  itemToEdit: MenuItem | null;
  onClose: () => void;
  onSave: (item: MenuItem) => void;
}

const CATEGORY_PRESETS = [
  { label: "🍽️ Makanan", val: "Makanan" },
  { label: "🥤 Minuman", val: "Minuman" },
  { label: "🍟 Cemilan", val: "Cemilan" },
  { label: "☕ Aneka Kopi", val: "Aneka Kopi" },
  { label: "🍹 Non-Kopi", val: "Non-Kopi" },
  { label: "📦 Paket Hemat", val: "Paket Hemat" },
  { label: "🍰 Dessert", val: "Dessert" },
];

export default function MenuFormModal({
  isOpen,
  itemToEdit,
  onClose,
  onSave,
}: MenuFormModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Makanan");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");

  const [priceStr, setPriceStr] = useState<string>("15.000");
  const [hppStr, setHppStr] = useState<string>("8.000");
  const [taxPercent, setTaxPercent] = useState<number>(10);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Flexible Margin Target
  const [targetMargin, setTargetMargin] = useState<number>(45);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      const isPreset = CATEGORY_PRESETS.some((p) => p.val === itemToEdit.category);
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
      setCategory("Makanan");
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
      ? (customCategoryInput.trim() || "Makanan")
      : category;

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 bg-slate-950 text-white flex flex-row items-center justify-between space-y-0 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950">
              <ImageIcon className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <DialogTitle className="font-extrabold text-base text-white">
                {itemToEdit ? `Edit Menu: ${itemToEdit.name}` : "✨ Tambah Menu Baru"}
              </DialogTitle>
              <p className="text-[11px] text-slate-400">
                Data otomatis tersinkronisasi realtime ke Kasir POS, Supabase DB, &amp; Menu Digital.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body - Scrollable Container */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto max-h-[75vh]">
          {/* Image Upload Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-900 dark:text-slate-100">Foto / Gambar Menu</label>
              <span className="text-[10px] text-slate-500 font-normal">(opsional)</span>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden ${
                isDragging
                  ? "border-amber-500 bg-amber-50"
                  : "border-slate-300 hover:border-amber-500 hover:bg-slate-50"
              }`}
            >
              {imageUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-28 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-1 text-xs">
                    <Upload className="w-4 h-4" />
                    <span>Ganti Foto</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center flex flex-col items-center justify-center gap-1 text-slate-500">
                  <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Klik atau seret foto menu ke sini</span>
                    <span className="text-[10px] text-slate-400">JPG, PNG, WebP — Semua ukuran diterima</span>
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

          {/* Menu Name */}
          <div>
            <label className="block font-bold text-slate-900 dark:text-slate-100 mb-1">
              Nama Menu Produk <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Nasi Bakar Cumi Pedas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white text-slate-950 font-bold placeholder:text-slate-400 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none shadow-xs"
              required
            />
          </div>

          {/* Category Selector with Quick Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-900 dark:text-slate-100">Kategori Menu</label>
              <button
                type="button"
                onClick={() => setIsCustomCategory(!isCustomCategory)}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline cursor-pointer"
              >
                {isCustomCategory ? "Pilih dari Preset" : "+ Ketik Kategori Kustom"}
              </button>
            </div>

            {isCustomCategory ? (
              <input
                type="text"
                placeholder="Ketik kategori baru (contoh: Paket Sarapan)"
                value={customCategoryInput}
                onChange={(e) => setCustomCategoryInput(e.target.value)}
                className="w-full px-3 py-2 bg-white text-slate-950 font-bold placeholder:text-slate-400 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none shadow-xs"
                required
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_PRESETS.map((cat) => (
                  <button
                    key={cat.val}
                    type="button"
                    onClick={() => setCategory(cat.val)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      category === cat.val
                        ? "bg-slate-900 text-amber-400 shadow-xs border border-slate-900"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{cat.label}</span>
                    {category === cat.val && <Check className="w-3 h-3 text-amber-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Target Margin Smart Calculator Box */}
          <div className="p-3 bg-amber-50/70 dark:bg-slate-800/60 rounded-2xl border border-amber-300/80 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
                  🎯 Target Margin Keuntungan (%)
                </span>
                <span className="text-[10px] text-slate-500">Pilih persen margin untuk menghitung harga jual otomatis</span>
              </div>
              <div className="relative w-20">
                <input
                  type="number"
                  value={targetMargin || ""}
                  onChange={(e) => handleTargetMarginChange(Number(e.target.value))}
                  placeholder="45"
                  className="w-full py-1.5 pl-2 pr-6 text-xs font-black text-center bg-white text-slate-950 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/30 outline-none"
                  min={0}
                  max={99}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-black text-amber-700">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10.5px] font-semibold pt-1 border-t border-amber-200/60">
              <span className="text-slate-600 dark:text-slate-400 font-bold">Preset Cepat:</span>
              <div className="flex gap-1 overflow-x-auto">
                {[25, 35, 45, 50, 60, 70].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleTargetMarginChange(m)}
                    className={`h-6 text-[10px] font-bold px-2 rounded-lg cursor-pointer transition-all ${
                      targetMargin === m
                        ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-amber-100"
                    }`}
                  >
                    {m}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Price & HPP Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-900 dark:text-slate-100 mb-1">
                Harga Jual (Rp) <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-bold font-mono text-slate-700 text-xs select-none">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={priceStr}
                  onChange={(e) => setPriceStr(formatNumber(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 bg-white text-slate-950 font-mono font-black border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none shadow-xs"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-900 dark:text-slate-100 mb-1">
                HPP / Modal (Rp) <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-bold font-mono text-slate-700 text-xs select-none">Rp</span>
                <input
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
                  className="w-full pl-9 pr-3 py-2 bg-white text-slate-950 font-mono font-black border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none shadow-xs"
                  required
                />
              </div>
            </div>
          </div>

          {/* Tax Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-900 dark:text-slate-100">Pajak / PPN (%)</label>
              <span className="text-[10px] text-slate-500">berlaku untuk harga jual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Number(e.target.value))}
                  className="w-full pl-3 pr-6 py-2 text-xs font-black bg-white text-slate-950 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/30 outline-none shadow-xs"
                  min={0}
                  max={100}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">%</span>
              </div>
              <div className="flex gap-1">
                {[0, 5, 10, 11].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setTaxPercent(pct)}
                    className={`h-8 text-xs font-bold px-2.5 rounded-xl cursor-pointer transition-all ${
                      taxPercent === pct
                        ? "bg-slate-900 text-white font-black"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Calculation Summary */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-1 text-center">
            <div>
              <span className="text-[9.5px] text-slate-500 uppercase font-bold block">Laba Per Porsi</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
                Rp {(numPrice - numHpp).toLocaleString("id-ID")}
              </span>
            </div>
            <div>
              <span className="text-[9.5px] text-slate-500 uppercase font-bold block">Margin Bersih</span>
              <span className={`font-black text-xs ${marginPercent >= 40 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}`}>
                {marginPercent}%
              </span>
            </div>
            <div>
              <span className="text-[9.5px] text-slate-500 uppercase font-bold block">Pajak / Porsi</span>
              <span className="font-black text-slate-900 dark:text-slate-100 text-xs">
                Rp {Math.round((numPrice * taxPercent) / 100).toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Active Status Checkbox */}
          <label className="flex items-center gap-2 pt-0.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
            />
            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
              Tampilkan menu ini di Halaman Kasir POS &amp; Menu Digital (Status Aktif)
            </span>
          </label>

          {/* Sticky Action Footer Buttons */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="h-10 font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-10 font-black text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl gap-1.5 flex items-center justify-center shadow-md shadow-amber-500/20 cursor-pointer transition-all"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>Simpan Menu ✨</span>
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
