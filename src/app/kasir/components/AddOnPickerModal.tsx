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
import { Sparkles, Plus, Check, Utensils } from "lucide-react";

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

  // Filter add-ons matching this menu item's category or "Semua"
  const matchingAddOns = availableAddOns.filter((addon) => {
    if (!addon.isActive) return false;
    if (!addon.category || addon.category === "Semua") return true;
    return addon.category === menuItem.category;
  });

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-card text-card-foreground border-border flex flex-col">
        {/* Header */}
        <DialogHeader className="p-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-white truncate">
                {menuItem.name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-bold text-amber-400 text-xs">
                  Rp {Number(menuItem.price).toLocaleString("id-ID")}
                </span>
                <Badge variant="outline" className="text-[9.5px] px-1.5 py-0 border-amber-400/40 text-amber-300">
                  {menuItem.category}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Pilihan Add-On &amp; Topping:
            </span>
            <span className="text-[11px] font-semibold text-primary">
              {selectedAddOns.length} dipilih
            </span>
          </div>

          {matchingAddOns.length === 0 ? (
            <div className="text-center py-6 bg-muted/30 rounded-2xl border border-border/60 p-4 text-xs text-muted-foreground">
              <p className="font-bold text-foreground">Tidak Ada Add-On Khusus</p>
              <p className="mt-0.5">Menu ini dapat langsung dimasukkan ke keranjang.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {matchingAddOns.map((addon) => {
                const isSelected = selectedAddOns.some((a) => a.id === addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => handleToggleAddOn(addon)}
                    className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/40"
                        : "bg-background border-border hover:border-border/80 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-muted-foreground/40 bg-background"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="font-bold text-xs text-foreground">{addon.name}</span>
                    </div>

                    <span className="font-mono font-extrabold text-xs text-primary">
                      {addon.price > 0 ? `+ Rp ${addon.price.toLocaleString("id-ID")}` : "Gratis"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-muted/40 border-t border-border space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs pb-1">
            <span className="text-muted-foreground font-bold">Total Harga:</span>
            <span className="font-mono font-black text-sm sm:text-base text-foreground">
              Rp {currentTotal.toLocaleString("id-ID")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onDirectAdd(menuItem)}
              className="h-10 text-xs font-bold rounded-xl cursor-pointer"
            >
              Tanpa Add-On
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => onConfirm(menuItem, selectedAddOns)}
              className="h-10 text-xs font-black bg-primary text-primary-foreground rounded-xl cursor-pointer gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>+ Keranjang</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
