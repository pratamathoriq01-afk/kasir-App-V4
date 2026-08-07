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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 my-4">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Image Upload Area */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">
              Foto / Gambar Menu
              <span className="ml-1 text-slate-400 font-normal">(tanpa batasan ukuran file)</span>
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden ${
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
                    className="w-full h-36 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold gap-1 text-xs">
                    <Upload className="w-4 h-4" />
                    <span>Ganti Gambar</span>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-slate-700 text-xs">Klik atau seret gambar ke sini</p>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">JPG, PNG, WebP — Semua ukuran diterima</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Menu Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Menu Produk</label>
            <input
              type="text"
              placeholder="misal: Ayam Bakar Bumbu Rujak"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Kategori Menu</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            >
              <option value="Makanan">🍽️ Makanan</option>
              <option value="Minuman">🥤 Minuman</option>
              <option value="Cemilan">🍟 Cemilan</option>
            </select>
          </div>

          {/* Target Margin Input Box */}
          <div className="p-3 bg-amber-50/90 rounded-2xl border border-amber-200/90 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-950 text-xs block">Target Margin Keuntungan (%)</span>
                <span className="text-[10px] text-amber-800/80">Ketik persen margin untuk hitung otomatis</span>
              </div>
              <div className="relative w-24">
                <input
                  type="number"
                  value={targetMargin || ""}
                  onChange={(e) => handleTargetMarginChange(Number(e.target.value))}
                  placeholder="45"
                  className="w-full pl-3 pr-6 py-1.5 bg-white border-2 border-amber-400 rounded-xl text-sm font-black text-center text-slate-900 shadow-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  min={0}
                  max={99}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-amber-700">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-amber-900 font-semibold pt-1.5 border-t border-amber-200/70">
              <span>Preset Cepat:</span>
              <div className="flex gap-1">
                {[25, 35, 45, 50, 60, 70].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleTargetMarginChange(m)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Harga Jual (Rp)</label>
              <input
                type="text"
                inputMode="numeric"
                value={price ? price.toLocaleString("id-ID") : ""}
                onChange={(e) => {
                  const num = Number(e.target.value.replace(/\D/g, ""));
                  setPrice(num);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold font-mono outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
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
                  const num = Number(e.target.value.replace(/\D/g, ""));
                  setHpp(num);
                  if (calcMode === "target_margin") {
                    setPrice(Math.round(num / (1 - targetMargin / 100)));
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold font-mono outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Tax Percent */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Pajak / PPN (%)
              <span className="ml-1 text-slate-400 font-normal">— berlaku untuk harga jual</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={taxPercent}
                onChange={(e) => setTaxPercent(Number(e.target.value))}
                className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold font-mono outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-center"
                min={0}
                max={100}
              />
              <span className="text-slate-500 font-semibold">%</span>
              <div className="ml-2 flex gap-1.5">
                {[0, 5, 10, 11].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setTaxPercent(v)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      taxPercent === v
                        ? "bg-amber-500 text-slate-950"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Flexible Margin Summary Banner */}
          <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Laba per Porsi</div>
              <div className={`text-sm font-black font-mono mt-0.5 ${marginPercent >= 30 ? "text-emerald-600" : marginPercent >= 15 ? "text-amber-600" : "text-rose-600"}`}>
                Rp {(price - hpp).toLocaleString("id-ID")}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Margin Bersih</div>
              <div className={`text-sm font-black font-mono mt-0.5 ${marginPercent >= 30 ? "text-emerald-600" : marginPercent >= 15 ? "text-amber-600" : "text-rose-600"}`}>
                {marginPercent}%
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Pajak/Porsi</div>
              <div className="text-sm font-black font-mono mt-0.5 text-blue-600">
                Rp {Math.round((price * taxPercent) / 100).toLocaleString("id-ID")}
              </div>
            </div>
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
            <label htmlFor="isActive" className="font-semibold text-slate-700 cursor-pointer">
              Tampilkan menu ini di Halaman Kasir (Status Aktif)
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Menu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
