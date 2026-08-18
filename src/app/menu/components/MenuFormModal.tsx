"use client";

import { useState, useEffect, useRef } from "react";
import { MenuItem } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Upload, ImageIcon } from "lucide-react";

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-card text-card-foreground border-border rounded-3xl">
        {/* Header */}
        <DialogHeader className="p-4 bg-slate-900 text-white flex flex-row items-center justify-between space-y-0 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-primary/20 text-primary-foreground">
              <ImageIcon className="w-5 h-5" />
            </div>
            <DialogTitle className="font-bold text-base text-white">
              {itemToEdit ? "Edit Menu Produk" : "Tambah Menu Baru"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Form Body - Scrollable Container */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs overflow-y-auto max-h-[75vh]">
          {/* Image Upload Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-muted-foreground">Foto / Gambar Menu</label>
              <span className="text-[10px] text-muted-foreground font-normal">(opsional)</span>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden ${
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
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
                <div className="p-3 text-center flex flex-col items-center justify-center gap-1 text-muted-foreground">
                  <div className="p-2 bg-primary/10 text-primary rounded-xl">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-foreground block text-xs">Klik atau seret gambar ke sini</span>
                    <span className="text-[10px] text-muted-foreground">JPG, PNG, WebP — Semua ukuran diterima</span>
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
            <label className="block font-bold text-muted-foreground mb-1">Nama Menu Produk</label>
            <Input
              type="text"
              placeholder="misal: Ayam Bakar Bumbu Rujak"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-xs font-semibold bg-background border-input"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-bold text-muted-foreground mb-1">Kategori Menu</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground font-semibold outline-none focus:ring-2 focus:ring-primary/20 text-xs"
            >
              <option value="Makanan">🍽️ Makanan</option>
              <option value="Minuman">🥤 Minuman</option>
              <option value="Cemilan">🍟 Cemilan</option>
            </select>
          </div>

          {/* Target Margin Input Box */}
          <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-foreground text-xs block">Target Margin Keuntungan (%)</span>
                <span className="text-[10px] text-muted-foreground">Ketik persen margin untuk hitung otomatis</span>
              </div>
              <div className="relative w-20">
                <Input
                  type="number"
                  value={targetMargin || ""}
                  onChange={(e) => handleTargetMarginChange(Number(e.target.value))}
                  placeholder="45"
                  className="h-8 pl-2 pr-5 text-xs font-black text-center bg-background border-input"
                  min={0}
                  max={99}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-black text-primary">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10.5px] font-semibold pt-1 border-t border-border">
              <span className="text-muted-foreground">Preset Cepat:</span>
              <div className="flex gap-1">
                {[25, 35, 45, 50, 60, 70].map((m) => (
                  <Button
                    key={m}
                    type="button"
                    variant={targetMargin === m ? "default" : "outline"}
                    size="xs"
                    onClick={() => handleTargetMarginChange(m)}
                    className="h-6 text-[10px] font-bold px-1.5 cursor-pointer"
                  >
                    {m}%
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Price & HPP Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-muted-foreground mb-1">Harga Jual (Rp)</label>
              <Input
                type="text"
                inputMode="numeric"
                value={price ? price.toLocaleString("id-ID") : ""}
                onChange={(e) => {
                  const val = Number(e.target.value.replace(/\D/g, ""));
                  setPrice(val);
                }}
                className="h-9 text-xs font-bold bg-background border-input"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-muted-foreground mb-1">HPP / Modal (Rp)</label>
              <Input
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
                className="h-9 text-xs font-bold bg-background border-input"
                required
              />
            </div>
          </div>

          {/* Tax Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-muted-foreground">Pajak / PPN (%)</label>
              <span className="text-[10px] text-muted-foreground">berlaku untuk harga jual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Input
                  type="number"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Number(e.target.value))}
                  className="h-8 text-xs font-bold bg-background border-input pl-3 pr-6"
                  min={0}
                  max={100}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">%</span>
              </div>
              <div className="flex gap-1">
                {[0, 5, 10, 11].map((pct) => (
                  <Button
                    key={pct}
                    type="button"
                    variant={taxPercent === pct ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTaxPercent(pct)}
                    className="h-8 text-xs font-bold px-2.5 cursor-pointer"
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Calculation Summary */}
          <div className="p-2.5 bg-muted/50 rounded-xl border border-border grid grid-cols-3 gap-1 text-center">
            <div>
              <span className="text-[9.5px] text-muted-foreground uppercase font-bold block">Laba Per Porsi</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                Rp {(price - hpp).toLocaleString("id-ID")}
              </span>
            </div>
            <div>
              <span className="text-[9.5px] text-muted-foreground uppercase font-bold block">Margin Bersih</span>
              <span className={`font-bold text-xs ${marginPercent >= 40 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`}>
                {marginPercent}%
              </span>
            </div>
            <div>
              <span className="text-[9.5px] text-muted-foreground uppercase font-bold block">Pajak/Porsi</span>
              <span className="font-bold text-primary text-xs">
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
              className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
            />
            <span className="font-semibold text-foreground text-xs">Tampilkan menu ini di Halaman Kasir (Status Aktif)</span>
          </label>

          {/* Sticky Action Footer Buttons */}
          <div className="pt-2 border-t border-border grid grid-cols-2 gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 font-bold text-xs cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="h-10 font-bold text-xs gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Menu</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

