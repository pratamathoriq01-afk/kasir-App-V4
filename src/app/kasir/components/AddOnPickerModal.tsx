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
import { Sparkles, Plus, Check, Utensils, Flame, Radio } from "lucide-react";

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

  // Smart Matching Logic: Show active Sambal, Pedas, Topping & Matching category add-ons
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

  // Single-Select (Radio) for Sambal & Pedas, Multi-Select (Checkbox) for Topping
  const handleToggleAddOn = (addon: AddOn, isSingleSelect: boolean, groupItems: AddOn[]) => {
    setSelectedAddOns((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (isSingleSelect) {
        if (exists) {
          // Deselect if already selected
          return prev.filter((a) => a.id !== addon.id);
        }
        // Replace other items in the same single-select group
        const groupIds = groupItems.map((g) => g.id);
        const filtered = prev.filter((a) => !groupIds.includes(a.id));
        return [...filtered, addon];
      }

      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      }
      return [...prev, addon];
    });
  };

  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + (a.price || 0), 0);
  const currentTotal = Number(menuItem.price) + addOnsTotal;

  const renderAddOnGroup = (
    title: string,
    subtitle: string,
    icon: string,
    items: AddOn[],
    isSingleSelect: boolean
  ) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-border pb-1">
          <div className="flex items-center gap-1.5 text-xs font-black text-foreground">
            <span>{icon}</span>
            <span>{title}</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-semibold">
            {subtitle}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {items.map((addon) => {
            const isSelected = selectedAddOns.some((a) => a.id === addon.id);
            return (
              <button
                key={addon.id}
                type="button"
                onClick={() => handleToggleAddOn(addon, isSingleSelect, items)}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer ${
                  isSelected
                    ? "bg-primary/10 border-primary shadow-xs ring-2 ring-primary/40 font-bold"
                    : "bg-background border-border hover:border-border/80 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0 ${
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

                <span className="text-xs font-extrabold font-mono text-primary shrink-0 ml-2">
                  {addon.price > 0 ? `+Rp ${addon.price.toLocaleString("id-ID")}` : "Gratis"}
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
      <DialogContent className="w-[94vw] sm:max-w-xl max-h-[90vh] p-0 overflow-hidden bg-card border-border shadow-2xl rounded-3xl flex flex-col">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 to-green-700 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white/20 text-white font-bold text-lg">
                {menuItem.icon || "🍽️"}
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-white">
                  {menuItem.name}
                </DialogTitle>
                <p className="text-xs text-emerald-100 font-mono font-bold">
                  Rp {Number(menuItem.price).toLocaleString("id-ID")} / porsi
                </p>
              </div>
            </div>
            <Badge className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-0.5">
              Opsi Add-On
            </Badge>
          </div>
        </DialogHeader>

        {/* Add-Ons List Sections */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 max-h-[60vh]">
          {matchingAddOns.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs font-bold">
              Belum ada varian Add-On aktif untuk menu ini.
            </div>
          ) : (
            <>
              {renderAddOnGroup(
                "Langkah 1: 🌶️ Pilih Jenis Sambal",
                "(Pilih 1 jenis sambal)",
                "🌶️",
                sambalAddOns,
                true // Single Select Radio
              )}

              {renderAddOnGroup(
                "Langkah 2: 🔥 Pilih Level Kepedasan",
                "(Pilih 1 level pedas)",
                "🔥",
                pedasAddOns,
                true // Single Select Radio
              )}

              {renderAddOnGroup(
                "Langkah 3: 🍳 Ekstra Topping & Lauk",
                "(Bisa pilih banyak)",
                "🍳",
                toppingAddOns,
                false // Multi Select Checkbox
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-muted/40 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[10px] text-muted-foreground font-semibold block uppercase tracking-wider">
              Total Harga per Porsi
            </span>
            <span className="text-lg font-black text-primary font-mono">
              Rp {currentTotal.toLocaleString("id-ID")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onDirectAdd(menuItem);
                onClose();
              }}
              className="flex-1 sm:flex-initial h-10 px-4 text-xs font-bold rounded-xl cursor-pointer"
            >
              Tanpa Add-On
            </Button>
            <Button
              type="button"
              onClick={() => {
                onConfirm(menuItem, selectedAddOns);
                onClose();
              }}
              className="flex-1 sm:flex-initial h-10 px-6 text-xs font-extrabold gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tambah ke Keranjang</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
