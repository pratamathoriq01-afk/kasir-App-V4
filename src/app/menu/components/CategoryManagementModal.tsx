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
import { Badge } from "@/components/ui/badge";
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
      <DialogContent
        showCloseButton={false}
        className="max-w-lg w-[96vw] sm:w-full p-0 overflow-hidden bg-card border-border shadow-2xl rounded-3xl"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-800 text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-600/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-xs text-white shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-white">
                Kelola Wadah Kategori Menu
              </DialogTitle>
              <p className="text-xs text-emerald-100 font-medium">
                Atur nama wadah, tambah kategori baru, atau ganti nama secara fleksibel.
              </p>
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

        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Add Category Input Form Card */}
          <form onSubmit={handleAddCategory} className="bg-muted/40 p-4 rounded-2xl border border-border space-y-2.5 shadow-2xs">
            <label className="block text-xs font-bold text-foreground">
              Tambah Wadah Kategori Baru
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Contoh: Menu Bebek Presto, Aneka Sambal..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="h-10 text-xs sm:text-sm bg-background font-bold rounded-xl"
              />
              <Button
                type="submit"
                disabled={!newCatName.trim() || isProcessing}
                className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs shrink-0 cursor-pointer rounded-xl shadow-sm gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Tambah</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Wadah baru akan langsung muncul pada filter Kasir POS, Kelola Menu, &amp; Menu Digital.
            </p>
          </form>

          {/* List of Existing Categories */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs sm:text-sm font-extrabold text-foreground">
                Daftar Wadah Aktif ({categories.length})
              </span>
              <span className="text-xs text-muted-foreground">
                Klik ikon ✏️ untuk ganti nama
              </span>
            </div>

            <div className="space-y-2">
              {categories.map((cat, index) => {
                const count = menuItems.filter((m) => m.category === cat).length;
                const isEditing = editingCatIndex === index;

                return (
                  <div
                    key={cat + index}
                    className="p-3 bg-card hover:bg-muted/30 border border-border rounded-2xl flex items-center justify-between gap-3 transition-all shadow-xs"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRename(cat);
                            if (e.key === "Escape") setEditingCatIndex(null);
                          }}
                          autoFocus
                          className="h-9 text-xs sm:text-sm font-bold bg-background rounded-xl"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleSaveRename(cat)}
                          className="h-9 w-9 text-emerald-600 hover:bg-emerald-500/10 cursor-pointer shrink-0 rounded-xl"
                          title="Simpan Nama Baru"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingCatIndex(null)}
                          className="h-9 w-9 text-rose-500 hover:bg-rose-500/10 cursor-pointer shrink-0 rounded-xl"
                          title="Batal"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                            {cat}
                          </span>
                          <Badge variant="secondary" className="font-mono text-xs font-bold shrink-0">
                            {count} menu
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleStartEdit(index, cat)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer rounded-lg"
                            title="Ganti Nama Wadah Ini"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteCategory(cat)}
                            className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 cursor-pointer rounded-lg"
                            title="Hapus Wadah"
                          >
                            <Trash2 className="w-4 h-4" />
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
        <div className="p-4 bg-muted/30 border-t border-border flex justify-end">
          <Button
            type="button"
            onClick={onClose}
            className="h-10 px-6 font-bold text-xs rounded-xl cursor-pointer"
          >
            Selesai
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
