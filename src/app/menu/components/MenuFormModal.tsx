"use client";

import { useState, useEffect, useRef } from "react";
import { MenuItem } from "@/types";
import { X, Save, Upload, ImageIcon } from "lucide-react";

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
  const [price, setPrice] = useState<number>(0);
  const [hpp, setHpp] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(10);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
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
                    alt="Preview menu"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-white text-center">
                      <Upload className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-xs font-bold">Ganti Gambar</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 flex flex-col items-center justify-center text-slate-400 min-h-[160px]">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                    <ImageIcon className="w-7 h-7 text-slate-300" />
                  </div>
                  <p className="font-semibold text-slate-600 text-sm">Klik atau seret gambar ke sini</p>
                  <p className="text-[11px] text-slate-400 mt-1">JPG, PNG, WebP — Semua ukuran diterima</p>
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

            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                className="mt-2 text-[11px] text-rose-500 hover:text-rose-700 font-semibold transition-colors"
              >
                Hapus Gambar
              </button>
            )}
          </div>

          {/* Nama Menu */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Menu Produk</label>
            <input
              type="text"
              placeholder="misal: Ayam Bakar Bumbu Rujak"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              required
            />
          </div>

          {/* Category Selector */}
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

          {/* Price, HPP, Tax Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Harga Jual (Rp)</label>
              <input
                type="number"
                value={price || ""}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold font-mono outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                min={0}
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">HPP / Modal (Rp)</label>
              <input
                type="number"
                value={hpp || ""}
                onChange={(e) => setHpp(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold font-mono outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                min={0}
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

          {/* Margin Banner */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-3 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Laba per Porsi</div>
              <div className={`text-sm font-black font-mono mt-0.5 ${marginPercent >= 30 ? "text-emerald-600" : marginPercent >= 15 ? "text-amber-600" : "text-rose-600"}`}>
                Rp {(price - hpp).toLocaleString("id-ID")}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Margin (%)</div>
              <div className={`text-sm font-black font-mono mt-0.5 ${marginPercent >= 30 ? "text-emerald-600" : marginPercent >= 15 ? "text-amber-600" : "text-rose-600"}`}>
                {marginPercent}%
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Pajak/Porsi</div>
              <div className="text-sm font-black font-mono mt-0.5 text-blue-600">
                Rp {Math.round(price * taxPercent / 100).toLocaleString("id-ID")}
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
