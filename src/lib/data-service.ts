import { MenuItem, Transaction, Voucher, AddOn, StoreSettings } from "@/types";
import { supabase } from "./supabase";

const MENU_STORAGE_KEY = "kedainyamleng_menu_v4";
const ADDONS_STORAGE_KEY = "kedainyamleng_addons_v4";
const CATEGORIES_STORAGE_KEY = "kedainyamleng_categories_v4";
const TRANSACTIONS_STORAGE_KEY = "kedainyamleng_transactions_v4";
const VOUCHERS_STORAGE_KEY = "kedainyamleng_vouchers_v4";
const STORE_SETTINGS_STORAGE_KEY = "kedainyamleng_store_settings_v4";

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: "default",
  storeName: "Kedai Nyamleng",
  address: "Jl. Laksada Adi Sucipto Gg.14 No 42, Kelurahan Blimbing, Kecamatan Blimbing, Kota Malang, Jawa Timur",
  whatsapp: "085113661387",
  city: "Kota Malang",
  province: "Jawa Timur",
  isOpen: true,
  openTime: "08:00",
  closeTime: "22:00",
  isAutoSchedule: true,
  closedReason: "Kedai sedang istirahat / tutup sementara.",
};

export const DEFAULT_CATEGORIES = [
  "Menu Ayam Nyamleng",
  "Menu Ikan Nyamleng",
  "Menu Minuman",
  "Menu Alacarte",
  "Cemilan & Snack",
  "Paket Hemat",
];

// Cross-tab / Cross-window broadcast channel for 0ms instant sync
let posBroadcastChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    posBroadcastChannel = new BroadcastChannel("kedai_pos_sync");
  } catch (e) {
    console.warn("BroadcastChannel not supported:", e);
  }
}

export function broadcastPOSSync(
  type: "MENU_UPDATED" | "TRANSACTION_UPDATED" | "VOUCHER_UPDATED" | "ADDONS_UPDATED" | "CATEGORY_UPDATED" | "STORE_SETTINGS_UPDATED",
  payload?: any
) {
  if (typeof window === "undefined") return;
  try {
    if (posBroadcastChannel) {
      posBroadcastChannel.postMessage({ type, payload, timestamp: Date.now() });
    }
    window.dispatchEvent(new CustomEvent("pos-sync-event", { detail: { type, payload } }));
  } catch (e) {
    console.warn("Error broadcasting POS sync:", e);
  }
}

export function subscribePOSSync(callback: (type: string, payload?: any) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleBcMessage = (event: MessageEvent) => {
    if (event?.data?.type) {
      callback(event.data.type, event.data.payload);
    }
  };

  const handleCustomEvent = (event: Event) => {
    const custom = event as CustomEvent;
    if (custom?.detail?.type) {
      callback(custom.detail.type, custom.detail.payload);
    }
  };

  if (posBroadcastChannel) {
    posBroadcastChannel.addEventListener("message", handleBcMessage);
  }
  window.addEventListener("pos-sync-event", handleCustomEvent);

  return () => {
    if (posBroadcastChannel) {
      posBroadcastChannel.removeEventListener("message", handleBcMessage);
    }
    window.removeEventListener("pos-sync-event", handleCustomEvent);
  };
}

export function getStoredMenuItems(): MenuItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MENU_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function fetchMenuItemsFromDB(): Promise<MenuItem[]> {
  // 1. Direct Supabase Edge Query (~30ms)
  try {
    const { data, error } = await supabase
      .from("MenuItem")
      .select("*")
      .order("createdAt", { ascending: true });
    if (!error && Array.isArray(data) && data.length > 0) {
      saveMenuItems(data as MenuItem[]);
      return data as MenuItem[];
    }
  } catch (e) {
    console.warn("Direct Supabase menu query note:", e);
  }

  // 2. Fallback to API route
  try {
    const res = await fetch(`/api/menu?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveMenuItems(data);
        return data;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch menu from API:", e);
  }

  return getStoredMenuItems();
}

export function saveMenuItems(items: MenuItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn("LocalStorage quota exceeded in saveMenuItems, stripping base64 images:", e);
    try {
      // Strip base64 data URLs for local storage fallback
      const streamlined = items.map((m) => ({
        ...m,
        imageUrl: m.imageUrl && m.imageUrl.startsWith("data:") ? null : m.imageUrl,
      }));
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(streamlined));
    } catch (err) {
      console.warn("LocalStorage saveMenuItems fallback notice:", err);
    }
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.warn("LocalStorage quota exceeded in saveTransactions, keeping recent:", e);
    try {
      const recent = transactions.slice(-20);
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(recent));
    } catch (err) {
      console.warn("LocalStorage saveTransactions fallback notice:", err);
    }
  }
}

// 0ms Optimistic Menu Save & Sync
export async function saveMenuItemOptimistic(item: MenuItem, currentItems: MenuItem[]): Promise<MenuItem[]> {
  const isExisting = currentItems.some((m) => m.id === item.id);
  const updatedList = isExisting
    ? currentItems.map((m) => (m.id === item.id ? item : m))
    : [...currentItems, item];

  // 1. Instant local persistence & broadcast (0ms)
  saveMenuItems(updatedList);
  broadcastPOSSync("MENU_UPDATED", item);

  // 2. Background DB Upsert with sanitized explicit payload
  (async () => {
    try {
      const payload = {
        id: item.id,
        name: item.name,
        category: item.category || "Menu Alacarte",
        price: Number(item.price || 0),
        hpp: Number(item.hpp || 0),
        taxPercent: Number(item.taxPercent ?? 10),
        description: item.description || null,
        icon: item.icon || "🍽️",
        imageUrl: item.imageUrl || null,
        isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
        allowedAddOnCategories: Array.isArray(item.allowedAddOnCategories) ? item.allowedAddOnCategories : null,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase.from("MenuItem").upsert(payload, { onConflict: "id" });
      if (error) {
        console.warn("Supabase MenuItem upsert error, falling back to API:", error);
        await fetch("/api/menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
    } catch (err) {
      console.warn("Background menu save notice:", err);
    }
  })();

  return updatedList;
}

// 0ms Optimistic Menu Delete & Sync
export async function deleteMenuItemOptimistic(id: string, currentItems: MenuItem[]): Promise<MenuItem[]> {
  const updatedList = currentItems.filter((m) => m.id !== id);

  // 1. Instant local persistence & broadcast (0ms)
  saveMenuItems(updatedList);
  broadcastPOSSync("MENU_UPDATED", { deletedId: id });

  // 2. Background DB Delete
  (async () => {
    try {
      await supabase.from("MenuItem").delete().eq("id", id);
      await fetch(`/api/menu?id=${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Background menu delete notice:", err);
    }
  })();

  return updatedList;
}

export function getStoredTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function fetchTransactionsFromDB(): Promise<Transaction[]> {
  // 1. Direct Supabase Edge Query (~30ms)
  try {
    const { data, error } = await supabase
      .from("Transaction")
      .select("*, items:TransactionItem(*)")
      .order("createdAt", { ascending: false });
    if (!error && Array.isArray(data)) {
      saveTransactions(data as Transaction[]);
      return data as Transaction[];
    }
  } catch (e) {
    console.warn("Direct Supabase transactions query note:", e);
  }

  // 2. Fallback to API route
  try {
    const res = await fetch(`/api/transactions?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        saveTransactions(data);
        return data;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch transactions from DB API:", e);
  }

  return getStoredTransactions();
}



export async function fetchActiveVouchersFromDB(): Promise<Voucher[]> {
  // 1. Direct Supabase Edge Query (~30ms)
  try {
    const { data, error } = await supabase
      .from("Voucher")
      .select("*")
      .eq("isActive", true)
      .order("createdAt", { ascending: false });
    if (!error && Array.isArray(data)) {
      if (typeof window !== "undefined") {
        localStorage.setItem(VOUCHERS_STORAGE_KEY, JSON.stringify(data));
      }
      return data as Voucher[];
    }
  } catch (e) {
    console.warn("Direct Supabase vouchers query note:", e);
  }

  try {
    const res = await fetch(`/api/vouchers?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data: Voucher[] = await res.json();
      if (Array.isArray(data)) {
        if (typeof window !== "undefined") {
          localStorage.setItem(VOUCHERS_STORAGE_KEY, JSON.stringify(data));
        }
        return data.filter((v) => v.isActive !== false);
      }
    }
  } catch (e) {
    console.warn("Failed to fetch active vouchers from DB:", e);
  }
  return [];
}

export function addTransaction(newTrx: Transaction): Transaction[] {
  const current = getStoredTransactions();
  const updated = [newTrx, ...current];
  saveTransactions(updated);
  broadcastPOSSync("TRANSACTION_UPDATED", newTrx);
  return updated;
}

export function getNextOrderNumber(): string {
  const trxs = getStoredTransactions();
  const count = trxs.length + 1;
  return `#${String(count).padStart(3, "0")}`;
}

export function getStoredAddOns(): AddOn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ADDONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((a: AddOn) => {
      const nameLower = (a.name || "").toLowerCase();
      let correctCat = a.category;
      if (nameLower.includes("nasi") || nameLower.includes("karbo")) {
        correctCat = "🍚 Pilihan Nasi";
      } else if (
        nameLower.includes("sambal") ||
        nameLower.includes("bawang") ||
        nameLower.includes("hijau") ||
        nameLower.includes("matah") ||
        nameLower.includes("terasi")
      ) {
        correctCat = "🌶️ Pilihan Sambal";
      } else if (
        nameLower.includes("pedas") ||
        nameLower.includes("level") ||
        nameLower.includes("sedang") ||
        nameLower.includes("super")
      ) {
        correctCat = "🔥 Level Pedas";
      } else if (
        (nameLower.includes("es") && nameLower.includes("teh")) ||
        (nameLower.includes("es") && nameLower.includes("jeruk")) ||
        nameLower.includes("mineral")
      ) {
        correctCat = "🍹 Pilihan Minuman Paket";
      } else if (
        nameLower.includes("gula") ||
        nameLower.includes("ice") ||
        nameLower.includes("sugar")
      ) {
        correctCat = "🥤 Pilihan Es & Gula";
      }
      return { ...a, category: correctCat };
    });
  } catch {
    return [];
  }
}

export function saveAddOns(addons: AddOn[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADDONS_STORAGE_KEY, JSON.stringify(addons));
}

export async function fetchAddOnsFromDB(): Promise<AddOn[]> {
  try {
    const { data, error } = await supabase
      .from("AddOn")
      .select("*")
      .order("name", { ascending: true });
    if (!error && Array.isArray(data) && data.length > 0) {
      saveAddOns(data as AddOn[]);
      return data as AddOn[];
    }
  } catch (e) {
    console.warn("Direct Supabase AddOn fetch notice:", e);
  }

  try {
    const res = await fetch(`/api/addons?t=${Date.now()}`, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveAddOns(data);
        return data;
      }
    }
  } catch (e) {
    console.warn("API AddOn fetch notice:", e);
  }

  return getStoredAddOns();
}

export async function saveAddOnOptimistic(addon: AddOn): Promise<AddOn> {
  const current = getStoredAddOns();
  const exists = current.find((a) => a.id === addon.id);
  const updated = exists ? current.map((a) => (a.id === addon.id ? addon : a)) : [addon, ...current];
  saveAddOns(updated);
  broadcastPOSSync("ADDONS_UPDATED", addon);

  // Background async persistence to Supabase
  try {
    const { error } = await supabase.from("AddOn").upsert(addon, { onConflict: "id" });
    if (error) {
      fetch("/api/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addon),
      }).catch((e) => console.warn("API AddOn fallback save note:", e));
    }
  } catch (err) {
    console.warn("Background AddOn save error:", err);
  }

  return addon;
}

export async function deleteAddOnOptimistic(id: string): Promise<boolean> {
  const current = getStoredAddOns();
  const updated = current.filter((a) => a.id !== id);
  saveAddOns(updated);
  broadcastPOSSync("ADDONS_UPDATED", { deletedId: id });

  // Background async delete
  try {
    const { error } = await supabase.from("AddOn").delete().eq("id", id);
    if (error) {
      fetch(`/api/addons?id=${id}`, { method: "DELETE" }).catch((e) => console.warn("API AddOn fallback delete note:", e));
    }
  } catch (err) {
    console.warn("Background AddOn delete error:", err);
  }

  return true;
}

// -------------------------------------------------------------
// DYNAMIC CATEGORY / WADAH MANAGEMENT (0ms Realtime Sync)
// -------------------------------------------------------------

export function getStoredCategories(): string[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    const existingMenu = getStoredMenuItems();
    const menuCategories = existingMenu.map((m) => m.category || "Menu Alacarte").filter(Boolean);

    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with any categories present in current items
        const merged = Array.from(new Set([...parsed, ...menuCategories]));
        return merged;
      }
    }
    const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...menuCategories]));
    return merged;
  } catch (e) {
    console.warn("Failed reading categories from localStorage:", e);
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const clean = Array.from(new Set(categories.map((c) => c.trim()).filter(Boolean)));
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(clean));
    broadcastPOSSync("CATEGORY_UPDATED", { categories: clean });
  } catch (e) {
    console.warn("Failed saving categories to localStorage:", e);
  }
}

export async function addNewCategoryOptimistic(catName: string): Promise<string[]> {
  const current = getStoredCategories();
  const trimmed = catName.trim();
  if (!trimmed || current.includes(trimmed)) return current;

  const updated = [...current, trimmed];
  saveCategories(updated);
  return updated;
}

export async function renameCategoryOptimistic(
  oldName: string,
  newName: string,
  currentItems: MenuItem[]
): Promise<{ categories: string[]; items: MenuItem[] }> {
  const current = getStoredCategories();
  const trimmedOld = oldName.trim();
  const trimmedNew = newName.trim();
  if (!trimmedNew || trimmedOld === trimmedNew) return { categories: current, items: currentItems };

  // 1. Update category list
  const updatedCategories = current.map((c) => (c === trimmedOld ? trimmedNew : c));
  saveCategories(updatedCategories);

  // 2. 0ms Optimistic update for all menu items belonging to old category
  const updatedItems = currentItems.map((item) =>
    item.category === trimmedOld ? { ...item, category: trimmedNew } : item
  );
  saveMenuItems(updatedItems);
  broadcastPOSSync("MENU_UPDATED", updatedItems);

  // 3. Background async batch update in Supabase PostgreSQL Cloud
  try {
    const { error } = await supabase
      .from("MenuItem")
      .update({ category: trimmedNew, updatedAt: new Date().toISOString() })
      .eq("category", trimmedOld);

    if (error) {
      console.warn("Supabase category rename fallback:", error);
      // Update individual items via REST if needed
      for (const it of currentItems) {
        if (it.category === trimmedOld) {
          fetch("/api/menu", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...it, category: trimmedNew }),
          }).catch((e) => console.warn("Fallback single item rename error:", e));
        }
      }
    }
  } catch (err) {
    console.warn("Background category rename error:", err);
  }

  return { categories: updatedCategories, items: updatedItems };
}

export async function deleteCategoryOptimistic(
  catNameToDelete: string,
  fallbackCat: string = "Menu Alacarte",
  currentItems: MenuItem[]
): Promise<{ categories: string[]; items: MenuItem[] }> {
  const current = getStoredCategories();
  const trimmed = catNameToDelete.trim();
  const updatedCategories = current.filter((c) => c !== trimmed);
  saveCategories(updatedCategories);

  // Move items in deleted category to fallbackCat
  const updatedItems = currentItems.map((item) =>
    item.category === trimmed ? { ...item, category: fallbackCat } : item
  );
  saveMenuItems(updatedItems);
  broadcastPOSSync("MENU_UPDATED", updatedItems);

  // Background update in Supabase
  try {
    await supabase
      .from("MenuItem")
      .update({ category: fallbackCat, updatedAt: new Date().toISOString() })
      .eq("category", trimmed);
  } catch (err) {
    console.warn("Background delete category error:", err);
  }

  return { categories: updatedCategories, items: updatedItems };
}

// ---------------------------------------------------------------------------
// Store Operational Settings Services (Realtime Sync & Persistence)
// ---------------------------------------------------------------------------

export function getStoredStoreSettings(): StoreSettings {
  if (typeof window === "undefined") return DEFAULT_STORE_SETTINGS;
  try {
    const raw = localStorage.getItem(STORE_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_STORE_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STORE_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

export function saveStoreSettings(settings: StoreSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORE_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn("Error saving store settings to localStorage:", err);
  }
}

export async function fetchStoreSettingsFromDB(): Promise<StoreSettings> {
  try {
    // 1. Direct Supabase Query (0ms latency)
    const { data: supaData, error: supaErr } = await supabase
      .from("StoreSettings")
      .select("*")
      .eq("id", "default")
      .single();

    if (!supaErr && supaData) {
      const merged: StoreSettings = {
        ...DEFAULT_STORE_SETTINGS,
        ...supaData,
        isOpen: typeof supaData.isOpen === "boolean" ? supaData.isOpen : true,
        openTime: supaData.openTime || "08:00",
        closeTime: supaData.closeTime || "22:00",
        isAutoSchedule: typeof supaData.isAutoSchedule === "boolean" ? supaData.isAutoSchedule : true,
        closedReason: supaData.closedReason || "Kedai sedang istirahat / tutup sementara.",
      };
      saveStoreSettings(merged);
      return merged;
    }

    // 2. REST API Fallback
    const res = await fetch("/api/settings", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const merged: StoreSettings = {
        ...DEFAULT_STORE_SETTINGS,
        ...data,
      };
      saveStoreSettings(merged);
      return merged;
    }
  } catch (err) {
    console.warn("fetchStoreSettingsFromDB error:", err);
  }
  return getStoredStoreSettings();
}

export async function saveStoreSettingsOptimistic(
  updatedFields: Partial<StoreSettings>,
  currentSettings?: StoreSettings
): Promise<StoreSettings> {
  const current = currentSettings || getStoredStoreSettings();
  const merged: StoreSettings = {
    ...current,
    ...updatedFields,
    id: "default",
    updatedAt: new Date().toISOString(),
  };

  // 1. 0ms Optimistic Save to local storage
  saveStoreSettings(merged);

  // 2. Broadcast immediately across POS tabs and digital menu
  broadcastPOSSync("STORE_SETTINGS_UPDATED", merged);

  // 3. Background persist to REST API and Supabase
  fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(merged),
  }).catch((err) => console.warn("Background saveStoreSettings error:", err));

  return merged;
}



