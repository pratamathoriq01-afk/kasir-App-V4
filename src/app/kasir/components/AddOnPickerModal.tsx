"use client";

import { useState, useEffect } from "react";
import { MenuItem, AddOn } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, Check, Utensils, Flame } from "lucide-react";

interface AddOnPickerModalProps {
  isOpen: boolean;
  menuItem: MenuItem | null;
  availableAddOns: AddOn[];
  onConfirm: (item: MenuItem, selectedAddOns: AddOn[]) => void;
  onDirectAdd: (item: MenuItem) => void;
  onClose: () => void;
}

export default function AddOnPickerModal({
  isOpen,
  menuItem,
  availableAddOns,
  onConfirm,
  onDirectAdd,
  onClose,
}: AddOnPickerModalProps) {
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedAddOns([]);
    }
  }, [isOpen, menuItem]);

  if (!menuItem) return null;

  const isFoodItem =
    !menuItem.category.toLowerCase().includes("minuman") &&
    !menuItem.category.toLowerCase().includes("drink");

  // Smart Matching Logic: Show all active Sambal, Pedas, Topping & Matching category add-ons
  const matchingAddOns = availableAddOns.filter((addon) => {
    if (!addon.isActive) return false;
    const cat = addon.category || "Semua";
    const nameLower = addon.name.toLowerCase();

    // 1. Always show Sambal options & Level Pedas for Food items
    if (
      isFoodItem &&
      (cat.includes("Sambal") ||
        cat.includes("Pedas") ||
        nameLower.includes("sambal") ||
        nameLower.includes("pedas") ||
        nameLower.includes("level"))
    ) {
      return true;
    }

    // 2. Always show "Semua" or "Semua Makanan" for Food items / "Semua Minuman" for Drink items
    if (cat === "Semua") return true;
    if (isFoodItem && cat === "Semua Makanan") return true;
    if (!isFoodItem && cat === "Semua Minuman") return true;

    // 3. Match exact category name
    if (cat === menuItem.category) return true;

    // 4. Default fallback: show general food toppings if item is food
    if (isFoodItem && cat.includes("Topping")) return true;

    return false;
  });

  // Group add-ons by section
  const sambalAddOns = matchingAddOns.filter(
    (a) =>
      (a.category && a.category.includes("Sambal")) ||
      a.name.toLowerCase().includes("sambal")
  );

  const pedasAddOns = matchingAddOns.filter(
    (a) =>
      !sambalAddOns.includes(a) &&
      ((a.category && a.category.includes("Pedas")) ||
        a.name.toLowerCase().includes("pedas") ||
        a.name.toLowerCase().includes("level"))
  );

  const toppingAddOns = matchingAddOns.filter(
    (a) => !sambalAddOns.includes(a) && !pedasAddOns.includes(a)
  );

  const handleToggleAddOn = (addon: AddOn) => {
    setSelectedAddOns((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      }
      return [...prev, addon];
    });
  };

  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + (a.price || 0), 0);
  const currentTotal = Number(menuItem.price) + addOnsTotal;

  const renderAddOnGroup = (title: string, icon: string, items: AddOn[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-black text-foreground border-b border-border pb-1">
          <span>{icon}</span>
          <span>{title}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold ml-auto">
            {items.length} opsi
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {items.map((addon) => {
            const isSelected = selectedAddOns.some((a) => a.id === addon.id);
            return (
              <button
                key={addon.id}
                type="button"
                onClick={() => handleToggleAddOn(addon)}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer ${
                  isSelected
                    ? "bg-primary/10 border-primary shadow-xs ring-2 ring-primary/40 font-bold"
                    : "bg-background border-border hover:border-border/80 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-muted-foreground/40 bg-background"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="font-bold text-xs text-foreground truncate">
                    {addon.name}
                  </span>
                </div>

                <span className="font-mono font-extrabold text-xs text-primary shrink-0">
                  {addon.price > 0 ? `+ Rp ${addon.price.toLocaleString("id-ID")}` : "Gratis"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[96vw] sm:w-[92vw] md:max-w-lg lg:max-w-xl p-0 overflow-hidden bg-card text-card-foreground border-border shadow-2xl rounded-3xl flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-800 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 border-b border-emerald-600/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-xs text-white rounded-2xl shadow-inner">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-white truncate">
                {menuItem.name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-bold text-amber-300 text-xs">
                  Rp {Number(menuItem.price).toLocaleString("id-ID")}
                </span>
                <Badge variant="outline" className="text-[10px] px-2 py-0 border-white/30 text-emerald-100 font-bold">
                  {menuItem.category}
                </Badge>
              </div>
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

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Pilihan Sambal &amp; Topping Tambahan:</span>
            </span>
            <Badge className="bg-primary/20 text-primary border-primary/40 font-mono font-bold text-xs">
              {selectedAddOns.length} Dipilih
            </Badge>
          </div>

          {matchingAddOns.length === 0 ? (
            <div className="text-center py-8 bg-muted/30 rounded-2xl border border-dashed border-border p-6 text-xs text-muted-foreground">
              <p className="font-bold text-foreground text-sm">Tidak Ada Add-On / Opsi Sambal</p>
              <p className="mt-1">
                Menu ini dapat langsung dimasukkan ke keranjang pesanan.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {renderAddOnGroup("Pilihan Sambal Nyamleng", "🌶️", sambalAddOns)}
              {renderAddOnGroup("Tingkat Kepedasan", "🔥", pedasAddOns)}
              {renderAddOnGroup("Ekstra Topping & Lauk", "🍳", toppingAddOns)}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-muted/40 border-t border-border space-y-3 shrink-0">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground font-bold">Total Harga Per Porsi:</span>
            <span className="font-mono font-black text-base sm:text-lg text-primary">
              Rp {currentTotal.toLocaleString("id-ID")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onDirectAdd(menuItem)}
              className="h-11 text-xs sm:text-sm font-bold rounded-xl cursor-pointer"
            >
              Tanpa Add-On
            </Button>
            <Button
              type="button"
              onClick={() => onConfirm(menuItem, selectedAddOns)}
              className="h-11 text-xs sm:text-sm font-extrabold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md cursor-pointer gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tambah Ke Keranjang</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
