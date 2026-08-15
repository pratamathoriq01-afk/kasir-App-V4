import { MenuItem, Transaction, Voucher } from "@/types";
import { INITIAL_MENU_ITEMS, INITIAL_TRANSACTIONS } from "./mock-data";

const MENU_STORAGE_KEY = "kedainyamleng_menu_v4";
const TRANSACTIONS_STORAGE_KEY = "kedainyamleng_transactions_v4";

export function getStoredMenuItems(): MenuItem[] {
  if (typeof window === "undefined") return INITIAL_MENU_ITEMS;
  try {
    const raw = localStorage.getItem(MENU_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(INITIAL_MENU_ITEMS));
      return INITIAL_MENU_ITEMS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MENU_ITEMS;
  }
}

export async function fetchMenuItemsFromDB(): Promise<MenuItem[]> {
  try {
    const res = await fetch("/api/menu");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveMenuItems(data);
        return data;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch menu from DB API:", e);
  }
  return getStoredMenuItems();
}

export function saveMenuItems(items: MenuItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(items));
}

export function getStoredTransactions(): Transaction[] {
  if (typeof window === "undefined") return INITIAL_TRANSACTIONS;
  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TRANSACTIONS;
  }
}

export async function fetchTransactionsFromDB(): Promise<Transaction[]> {
  try {
    const res = await fetch("/api/transactions");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
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
  try {
    const res = await fetch("/api/vouchers");
    if (res.ok) {
      const data: Voucher[] = await res.json();
      if (Array.isArray(data)) {
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
  return updated;
}

export function getNextOrderNumber(): string {
  const trxs = getStoredTransactions();
  const count = trxs.length + 1;
  return `#${String(count).padStart(3, "0")}`;
}
