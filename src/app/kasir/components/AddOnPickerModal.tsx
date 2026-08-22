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
import { Sparkles, Plus, Check } from "lucide-react";

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

  const isPaketItem =
    menuItem.category.toLowerCase().includes("paket") ||
    menuItem.category.toLowerCase().includes("bundling") ||
    menuItem.name.toLowerCase().includes("paket") ||
    menuItem.name.toLowerCase().includes("bundling");

  const allowedCats = Array.isArray(menuItem.allowedAddOnCategories)
    ? menuItem.allowedAddOnCategories
    : null;

  // Smart Section Categorization for Food, Paket, vs Drink Items
  const activeAddOns = availableAddOns.filter((a) => a.isActive);

  // Group Filters with Per-MenuItem ON/OFF check
  const isGroupAllowed = (groupId: string, defaultCheck: boolean) => {
    if (allowedCats) {
      return allowedCats.includes(groupId);
    }
    return defaultCheck;
  };

  // 1. Nasi / Karbo Add-Ons (First Priority: Any item with Nasi / Karbo)
  const rawNasiAddOns = activeAddOns.filter((a) => {
    const cat = (a.category || "").toLowerCase();
    const name = a.name.toLowerCase();
    return (
      cat === "🍚 pilihan nasi" ||
      cat.includes("nasi") ||
      cat.includes("karbo") ||
      name.includes("nasi") ||
      name.includes("karbo")
    );
  });
  const nasiAddOns = isGroupAllowed("🍚 Pilihan Nasi", isFoodItem) ? rawNasiAddOns : [];

  // 2. Sambal Add-Ons
  const rawSambalAddOns = activeAddOns.filter((a) => {
    if (rawNasiAddOns.includes(a)) return false;
    const cat = (a.category || "").toLowerCase();
    const name = a.name.toLowerCase();
    return (
      cat === "🌶️ pilihan sambal" ||
      cat.includes("sambal") ||
      name.includes("sambal") ||
      name.includes("bawang") ||
      name.includes("hijau") ||
      name.includes("matah") ||
      name.includes("terasi")
    );
  });
  const sambalAddOns = isGroupAllowed("🌶️ Pilihan Sambal", isFoodItem) ? rawSambalAddOns : [];

  // 3. Pedas Add-Ons
  const rawPedasAddOns = activeAddOns.filter((a) => {
    if (rawNasiAddOns.includes(a) || rawSambalAddOns.includes(a)) return false;
    const cat = (a.category || "").toLowerCase();
    const name = a.name.toLowerCase();
    return (
      cat === "🔥 level pedas" ||
      cat.includes("pedas") ||
      name.includes("pedas") ||
      name.includes("level") ||
      name.includes("sedang") ||
      name.includes("super")
    );
  });
  const pedasAddOns = isGroupAllowed("🔥 Level Pedas", isFoodItem) ? rawPedasAddOns : [];

  // 4. Paket Drink Add-Ons (Strictly for Drinks, Never Nasi or Food)
  const rawPaketDrinkAddOns = activeAddOns.filter((a) => {
    if (rawNasiAddOns.includes(a) || rawSambalAddOns.includes(a) || rawPedasAddOns.includes(a)) return false;
    const cat = (a.category || "").toLowerCase();
    const name = a.name.toLowerCase();
    const isDrinkCategory = cat === "🍹 pilihan minuman paket" || cat.includes("minuman paket") || cat.includes("minum");
    const isDrinkName =
      (name.includes("es") && name.includes("teh")) ||
      (name.includes("es") && name.includes("jeruk")) ||
      name.includes("mineral") ||
      name.includes("kopi") ||
      name.includes("teh") ||
      name.includes("jeruk");

    return isDrinkCategory || isDrinkName;
  });
  const paketDrinkAddOns = isGroupAllowed("🍹 Pilihan Minuman Paket", isPaketItem) ? rawPaketDrinkAddOns : [];

  // 5. Ice / Suhu Add-Ons
  const rawIceAddOns = activeAddOns.filter((a) => {
    if (rawNasiAddOns.includes(a) || rawSambalAddOns.includes(a) || rawPedasAddOns.includes(a) || rawPaketDrinkAddOns.includes(a)) return false;
    const cat = (a.category || "").toLowerCase();
    const name = a.name.toLowerCase();
    return (
      cat === "🥤 pilihan es & gula" ||
      cat.includes("es") ||
      cat.includes("suhu") ||
      name.includes("es") ||
      name.includes("ice") ||
      name.includes("hangat") ||
      name.includes("warm") ||
      name.includes("suhu")
    );
  });
  const iceAddOns = isGroupAllowed("🥤 Pilihan Es & Gula", !isFoodItem) ? rawIceAddOns : [];

  // 6. Sugar / Manis Add-Ons
  const rawSugarAddOns = activeAddOns.filter((a) => {
    if (rawNasiAddOns.includes(a) || rawSambalAddOns.includes(a) || rawPedasAddOns.includes(a) || rawPaketDrinkAddOns.includes(a) || rawIceAddOns.includes(a)) return false;
    const cat = (a.category || "").toLowerCase();
    const name = a.name.toLowerCase();
    return (
      cat.includes("gula") ||
      cat.includes("manis") ||
      name.includes("gula") ||
      name.includes("sugar") ||
      name.includes("manis")
    );
  });
  const sugarAddOns = isGroupAllowed("🥤 Pilihan Es & Gula", !isFoodItem) ? rawSugarAddOns : [];

  // 7. Topping & Ala Carte Add-Ons (Fallback for Food)
  const rawToppingAddOns = activeAddOns.filter(
    (a) =>
      !rawNasiAddOns.includes(a) &&
      !rawSambalAddOns.includes(a) &&
      !rawPedasAddOns.includes(a) &&
      !rawPaketDrinkAddOns.includes(a) &&
      !rawIceAddOns.includes(a) &&
      !rawSugarAddOns.includes(a)
  );
  const toppingAddOns = isGroupAllowed("🍳 Ekstra Topping / Lauk", isFoodItem) ? rawToppingAddOns : [];

  // Single-Select (Radio) for PaketDrink, Nasi, Sambal, Pedas, Es, Gula, Multi-Select (Checkbox) for Topping
  const handleToggleAddOn = (
    addon: AddOn,
    isSingleSelect: boolean,
    groupItems: AddOn[]
  ) => {
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
    stepNumber: number,
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
            <span>Langkah {stepNumber}: {title}</span>
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

  let stepCounter = 1;

  const hasAnyActiveAddOn =
    paketDrinkAddOns.length > 0 ||
    nasiAddOns.length > 0 ||
    sambalAddOns.length > 0 ||
    pedasAddOns.length > 0 ||
    toppingAddOns.length > 0 ||
    iceAddOns.length > 0 ||
    sugarAddOns.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[94vw] sm:max-w-xl max-h-[90vh] p-0 overflow-hidden bg-card border-border shadow-2xl rounded-3xl flex flex-col">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 to-green-700 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white/20 text-white font-bold text-lg">
                {menuItem.icon || (isFoodItem ? "📦" : "🥤")}
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
              {isPaketItem ? "Paket Hemat Bundling" : isFoodItem ? "Opsi Pilihan Menu" : "Opsi Es & Gula"}
            </Badge>
          </div>
        </DialogHeader>

        {/* Add-Ons List Sections */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 max-h-[60vh]">
          {hasAnyActiveAddOn ? (
            <>
              {nasiAddOns.length > 0 &&
                renderAddOnGroup(
                  stepCounter++,
                  "Pilih Jenis Nasi / Karbo",
                  "(Pilih 1 opsi nasi)",
                  "🍚",
                  nasiAddOns,
                  true // Single Select Radio
                )}

              {sambalAddOns.length > 0 &&
                renderAddOnGroup(
                  stepCounter++,
                  "Pilih Jenis Sambal",
                  "(Pilih 1 jenis sambal)",
                  "🌶️",
                  sambalAddOns,
                  true // Single Select Radio
                )}

              {pedasAddOns.length > 0 &&
                renderAddOnGroup(
                  stepCounter++,
                  "Pilih Level Kepedasan",
                  "(Pilih 1 level pedas)",
                  "🔥",
                  pedasAddOns,
                  true // Single Select Radio
                )}

              {paketDrinkAddOns.length > 0 &&
                renderAddOnGroup(
                  stepCounter++,
                  "Pilihan Minuman Paket",
                  "(Pilih 1 minuman paket)",
                  "🍹",
                  paketDrinkAddOns,
                  true // Single Select Radio
                )}

              {toppingAddOns.length > 0 &&
                renderAddOnGroup(
                  stepCounter++,
                  "Ekstra Topping & Ala Carte",
                  "(Bisa pilih banyak)",
                  "🍳",
                  toppingAddOns,
                  false // Multi Select Checkbox
                )}

              {iceAddOns.length > 0 &&
                renderAddOnGroup(
                  stepCounter++,
                  "Pilihan Suhu & Es",
                  "(Pilih 1 opsi es/suhu)",
                  "🧊",
                  iceAddOns,
                  true // Single Select Radio
                )}

              {sugarAddOns.length > 0 &&
                renderAddOnGroup(
                  stepCounter++,
                  "Pilihan Tingkat Manis & Gula",
                  "(Pilih 1 opsi gula/manis)",
                  "🍬",
                  sugarAddOns,
                  true // Single Select Radio
                )}
            </>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-xs font-bold">
              Tidak ada Add-On / Varian aktif untuk menu ini.
            </div>
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
              Tanpa Opsi Tambahan
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
