"use client";

import { useState, useEffect } from "react";
import { MenuItem } from "@/types";
import {
  getStoredCategories,
  addNewCategoryOptimistic,
  renameCategoryOptimistic,
  deleteCategoryOptimistic,
  subscribePOSSync,
} from "@/lib/data-service";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Layers, Plus, Edit2, Trash2, Check, X, Sparkles, FolderPlus, Utensils } from "lucide-react";

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onCategoriesChange?: (newCategories: string[], updatedItems?: MenuItem[]) => void;
}

export default function CategoryManagementModal({
  isOpen,
  onClose,
  menuItems,
  onCategoriesChange,
}: CategoryManagementModalProps) {
  const [categories, setCategories] = useState<string[]>(() => getStoredCategories());
  const [newCatName, setNewCatName] = useState("");
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const refreshCategories = () => {
    setCategories(getStoredCategories());
  };

  useEffect(() => {
    if (isOpen) {
      refreshCategories();
      setEditingCatIndex(null);
      setNewCatName("");
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = subscribePOSSync((type) => {
      if (type === "CATEGORY_UPDATED" || type === "MENU_UPDATED") {
        refreshCategories();
      }
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Wadah kategori "${trimmed}" sudah ada!`);
      return;
    }

    setIsProcessing(true);
    const updated = await addNewCategoryOptimistic(trimmed);
    setCategories(updated);
    setNewCatName("");
    setIsProcessing(false);
    if (onCategoriesChange) onCategoriesChange(updated);
  };

  const handleStartEdit = (index: number, cat: string) => {
    setEditingCatIndex(index);
    setEditValue(cat);
  };

  const handleSaveRename = async (oldName: string) => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingCatIndex(null);
      return;
    }

    setIsProcessing(true);
    const result = await renameCategoryOptimistic(oldName, trimmed, menuItems);
    setCategories(result.categories);
    setEditingCatIndex(null);
    setIsProcessing(false);
    if (onCategoriesChange) onCategoriesChange(result.categories, result.items);
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    const count = menuItems.filter((m) => m.category === catToDelete).length;
    const confirmMsg =
      count > 0
        ? `Wadah "${catToDelete}" memiliki ${count} menu aktif. Jika dihapus, menu-menu ini akan otomatis dipindahkan ke wadah "Menu Alacarte". Lanjutkan hapus?`
        : `Apakah Anda yakin ingin menghapus wadah kategori "${catToDelete}"?`;

    if (!confirm(confirmMsg)) return;

    setIsProcessing(true);
    const result = await deleteCategoryOptimistic(catToDelete, "Menu Alacarte", menuItems);
    setCategories(result.categories);
    setIsProcessing(false);
    if (onCategoriesChange) onCategoriesChange(result.categories, result.items);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden bg-card border-border shadow-2xl rounded-3xl">
        {/* Header Banner */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-white">
                Kelola Wadah Kategori Menu
              </DialogTitle>
              <p className="text-[11px] text-slate-400">
                Atur nama wadah, tambah kategori baru, atau ganti nama secara fleksibel.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Add Category Input Form */}
          <form onSubmit={handleAddCategory} className="bg-muted/40 p-3 rounded-2xl border border-border/80 space-y-2">
            <label className="block text-xs font-bold text-foreground">
              ➕ Tambah Wadah Kategori Baru
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Contoh: Menu Bebek Presto, Aneka Sambal..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="h-9 text-xs bg-background font-bold"
              />
              <Button
                type="submit"
                disabled={!newCatName.trim() || isProcessing}
                className="h-9 px-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shrink-0 cursor-pointer rounded-xl"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Tambah</span>
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Wadah baru akan langsung muncul pada filter Kasir POS, Menu Page, &amp; Menu Digital.
            </p>
          </form>

          {/* List of Existing Categories */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-extrabold text-foreground">
                Daftar Wadah Aktif ({categories.length})
              </span>
              <span className="text-[10px] text-muted-foreground">
                Klik ✏️ untuk ganti nama wadah
              </span>
            </div>

            <div className="space-y-1.5">
              {categories.map((cat, index) => {
                const count = menuItems.filter((m) => m.category === cat).length;
                const isEditing = editingCatIndex === index;

                return (
                  <div
                    key={cat + index}
                    className="p-2.5 bg-card hover:bg-muted/30 border border-border rounded-xl flex items-center justify-between gap-2 transition-all shadow-2xs"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <Input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRename(cat);
                            if (e.key === "Escape") setEditingCatIndex(null);
                          }}
                          autoFocus
                          className="h-8 text-xs font-bold bg-background"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleSaveRename(cat)}
                          className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10 cursor-pointer shrink-0"
                          title="Simpan Nama Baru"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingCatIndex(null)}
                          className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 cursor-pointer shrink-0"
                          title="Batal"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                          <span className="text-xs font-bold text-foreground truncate">
                            {cat}
                          </span>
                          <span className="px-1.5 py-0.2 text-[10px] font-black rounded-md bg-muted text-muted-foreground font-mono shrink-0">
                            {count} menu
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleStartEdit(index, cat)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                            title="Ganti Nama Wadah Ini"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteCategory(cat)}
                            className="h-7 w-7 text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                            title="Hapus Wadah"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-muted/30 border-t border-border flex justify-end">
          <Button
            type="button"
            onClick={onClose}
            className="h-9 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Selesai
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
