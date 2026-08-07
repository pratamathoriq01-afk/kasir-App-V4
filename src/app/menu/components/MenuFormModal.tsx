"use client";

import { useState, useEffect, useRef } from "react";
import { MenuItem } from "@/types";
import { X, Save, Upload, ImageIcon, Calculator, CheckCircle2 } from "lucide-react";

interface MenuFormModalProps {
  isOpen: boolean;
  itemToEdit: MenuItem | null;
  onClose: () => void;
  onSave: (item: MenuItem) => void;
}

export default function MenuFormModal({
  isOpen,
  itemToEdit,
  onClose,
  onSave,
}: MenuFormModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Makanan");
  const [price, setPrice] = useState<number>(15000);
  const [hpp, setHpp] = useState<number>(8000);
  const [taxPercent, setTaxPercent] = useState<number>(10);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Flexible Margin Mode ("manual" | "target_margin")
  const [calcMode, setCalcMode] = useState<"manual" | "target_margin">("manual");
  const [targetMargin, setTargetMargin] = useState<number>(45);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setCategory(itemToEdit.category);
      setPrice(itemToEdit.price);
      setHpp(itemToEdit.hpp);
      setTaxPercent(itemToEdit.taxPercent ?? 10);
      setImageUrl(itemToEdit.imageUrl || null);
      setIsActive(itemToEdit.isActive);
    } else {
      setName("");
      setCategory("Makanan");
      setPrice(15000);
      setHpp(8000);
      setTaxPercent(10);
      setImageUrl(null);
      setIsActive(true);
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

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
    if (marginVal < 100 && hpp > 0) {
      const calculatedPrice = Math.round(hpp / (1 - marginVal / 100));
      setPrice(calculatedPrice);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Nama menu tidak boleh kosong");
      return;
    }

    const newItem: MenuItem = {
      id: itemToEdit ? itemToEdit.id : `menu-${Date.now()}`,
      name: name.trim(),
      category,
      price: Number(price),
      hpp: Number(hpp),
      taxPercent: Number(taxPercent),
      imageUrl: imageUrl || null,
      icon: null,
      isActive,
    };

    onSave(newItem);
  };

  const marginPercent = price > 0 ? Math.round(((price - hpp) / price) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md sm:max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h3 className="font-bold text-sm sm:text-base">
              {itemToEdit ? "Edit Menu Produk" : "Tambah Menu Baru"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable Container */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-2.5 text-xs overflow-y-auto flex-1">
          {/* Image Upload Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">Foto / Gambar Menu</label>
              <span className="text-[10px] text-slate-400 font-normal">(opsional)</span>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden ${
                isDragging
                  ? "border-amber-500 bg-amber-50"
                  : "border-slate-200 hover:border-amber-400 hover:bg-amber-50/30"
              }`}
            >
              {imageUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-24 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-1 text-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Ganti Foto</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center flex flex-col items-center justify-center gap-1 text-slate-500">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block text-xs">Klik atau seret gambar ke sini</span>
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
            <label className="block font-bold text-slate-700 mb-1">Nama Menu Produk</label>
            <input
              type="text"
              placeholder="misal: Ayam Bakar Bumbu Rujak"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-xs"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Kategori Menu</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-xs"
            >
              <option value="Makanan">🍽️ Makanan</option>
              <option value="Minuman">🥤 Minuman</option>
              <option value="Cemilan">🍟 Cemilan</option>
            </select>
          </div>

          {/* Target Margin Input Box */}
          <div className="p-2.5 bg-amber-50/90 rounded-xl border border-amber-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-950 text-xs block">Target Margin Keuntungan (%)</span>
                <span className="text-[9.5px] text-amber-800/80">Ketik persen margin untuk hitung otomatis</span>
              </div>
              <div className="relative w-20">
                <input
                  type="number"
                  value={targetMargin || ""}
                  onChange={(e) => handleTargetMarginChange(Number(e.target.value))}
                  placeholder="45"
                  className="w-full pl-2 pr-5 py-1 bg-white border border-amber-400 rounded-lg text-xs font-black text-center text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                  min={0}
                  max={99}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-black text-amber-700">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10.5px] text-amber-900 font-semibold pt-1 border-t border-amber-200/70">
              <span>Preset Cepat:</span>
              <div className="flex gap-1">
                {[25, 35, 45, 50, 60, 70].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleTargetMarginChange(m)}
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                      targetMargin === m
                        ? "bg-amber-500 text-slate-950 shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-amber-100"
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
              <label className="block font-bold text-slate-700 mb-1">Harga Jual (Rp)</label>
              <input
                type="text"
                inputMode="numeric"
                value={price ? price.toLocaleString("id-ID") : ""}
                onChange={(e) => {
                  const val = Number(e.target.value.replace(/\D/g, ""));
                  setPrice(val);
                }}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">HPP / Modal (Rp)</label>
              <input
                type="text"
                inputMode="numeric"
                value={hpp ? hpp.toLocaleString("id-ID") : ""}
                onChange={(e) => {
                  const val = Number(e.target.value.replace(/\D/g, ""));
                  setHpp(val);
                  if (calcMode === "target_margin" && targetMargin < 100 && val > 0) {
                    setPrice(Math.round(val / (1 - targetMargin / 100)));
                  }
                }}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs"
                required
              />
            </div>
          </div>

          {/* Tax Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">Pajak / PPN (%)</label>
              <span className="text-[10px] text-slate-400">berlaku untuk harga jual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Number(e.target.value))}
                  className="w-full pl-3 pr-6 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none text-xs"
                  min={0}
                  max={100}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
              </div>
              <div className="flex gap-1">
                {[0, 5, 10, 11].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setTaxPercent(pct)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      taxPercent === pct
                        ? "bg-amber-500 text-slate-950"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Calculation Summary */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-1 text-center">
            <div>
              <span className="text-[9.5px] text-slate-400 uppercase font-bold block">Laba Per Porsi</span>
              <span className="font-bold text-emerald-600 text-xs">
                Rp {(price - hpp).toLocaleString("id-ID")}
              </span>
            </div>
            <div>
              <span className="text-[9.5px] text-slate-400 uppercase font-bold block">Margin Bersih</span>
              <span className={`font-bold text-xs ${marginPercent >= 40 ? "text-emerald-600" : "text-amber-600"}`}>
                {marginPercent}%
              </span>
            </div>
            <div>
              <span className="text-[9.5px] text-slate-400 uppercase font-bold block">Pajak/Porsi</span>
              <span className="font-bold text-indigo-600 text-xs">
                Rp {Math.round((price * taxPercent) / 100).toLocaleString("id-ID")}
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
            <span className="font-semibold text-slate-700 text-xs">Tampilkan menu ini di Halaman Kasir (Status Aktif)</span>
          </label>

          {/* Sticky Action Footer Buttons */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Menu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
