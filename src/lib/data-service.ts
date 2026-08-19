import { MenuItem, Transaction, Voucher } from "@/types";
import { supabase } from "./supabase";

const MENU_STORAGE_KEY = "kedainyamleng_menu_v4";
const TRANSACTIONS_STORAGE_KEY = "kedainyamleng_transactions_v4";
const VOUCHERS_STORAGE_KEY = "kedainyamleng_vouchers_v4";

// Cross-tab / Cross-window broadcast channel for 0ms instant sync
let posBroadcastChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    posBroadcastChannel = new BroadcastChannel("kedai_pos_sync");
  } catch (e) {
    console.warn("BroadcastChannel not supported:", e);
  }
}

export function broadcastPOSSync(type: "MENU_UPDATED" | "TRANSACTION_UPDATED" | "VOUCHER_UPDATED", payload?: any) {
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
  localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(items));
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

  // 2. Background DB Upsert
  (async () => {
    try {
      await supabase.from("MenuItem").upsert(item, { onConflict: "id" });
      await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
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

export function saveTransactions(transactions: Transaction[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
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
