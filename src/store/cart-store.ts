import { create } from "zustand";
import { CartItem, MenuItem } from "@/types";

interface CartState {
  items: CartItem[];
  customerName: string;
  orderType: "dine-in" | "takeaway";
  tableNumber: string;
  discountType: "percent" | "fixed" | null;
  discountValue: number;
  cashReceived: number;

  addItem: (item: MenuItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQty: (menuItemId: string, qty: number) => void;
  updateNotes: (menuItemId: string, notes: string) => void;
  setCustomerName: (name: string) => void;
  setOrderType: (type: "dine-in" | "takeaway") => void;
  setTableNumber: (table: string) => void;
  setDiscount: (type: "percent" | "fixed" | null, value: number) => void;
  setCashReceived: (amount: number) => void;
  clearCart: () => void;

  getSubtotal: () => number;
  getHppTotal: () => number;
  getDiscountAmount: () => number;
  getTaxAmount: () => number;
  getTotal: () => number;
  getNetProfit: () => number;
  getChange: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerName: "",
  orderType: "dine-in",
  tableNumber: "01",
  discountType: null,
  discountValue: 0,
  cashReceived: 0,

  addItem: (item: MenuItem) => {
    set((state) => {
      const existing = state.items.find((i) => i.menuItem.id === item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.menuItem.id === item.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { menuItem: item, qty: 1 }] };
    });
  },

  removeItem: (menuItemId: string) => {
    set((state) => ({
      items: state.items.filter((i) => i.menuItem.id !== menuItemId),
    }));
  },

  updateQty: (menuItemId: string, qty: number) => {
    set((state) => {
      if (qty <= 0) {
        return {
          items: state.items.filter((i) => i.menuItem.id !== menuItemId),
        };
      }
      return {
        items: state.items.map((i) =>
          i.menuItem.id === menuItemId ? { ...i, qty } : i
        ),
      };
    });
  },

  updateNotes: (menuItemId: string, notes: string) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.menuItem.id === menuItemId ? { ...i, notes } : i
      ),
    }));
  },

  setCustomerName: (name: string) => set({ customerName: name }),
  setOrderType: (type: "dine-in" | "takeaway") => set({ orderType: type }),
  setTableNumber: (table: string) => set({ tableNumber: table }),

  setDiscount: (type: "percent" | "fixed" | null, value: number) =>
    set({ discountType: type, discountValue: value }),

  setCashReceived: (amount: number) => set({ cashReceived: amount }),

  clearCart: () =>
    set({
      items: [],
      customerName: "",
      orderType: "dine-in",
      tableNumber: "01",
      discountType: null,
      discountValue: 0,
      cashReceived: 0,
    }),

  getSubtotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.menuItem.price * item.qty, 0);
  },

  getHppTotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.menuItem.hpp * item.qty, 0);
  },

  getDiscountAmount: () => {
    const { discountType, discountValue } = get();
    const subtotal = get().getSubtotal();
    if (!discountType || discountValue <= 0) return 0;
    if (discountType === "percent") {
      return Math.round((subtotal * Math.min(discountValue, 100)) / 100);
    }
    return Math.min(discountValue, subtotal);
  },

  getTaxAmount: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    const taxableAmount = Math.max(0, subtotal - discount);
    return Math.round(taxableAmount * 0.1);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    const tax = get().getTaxAmount();
    return Math.max(0, subtotal - discount + tax);
  },

  getNetProfit: () => {
    const total = get().getTotal();
    const tax = get().getTaxAmount();
    const hpp = get().getHppTotal();
    const revenueBeforeTax = total - tax;
    return revenueBeforeTax - hpp;
  },

  getChange: () => {
    const { cashReceived } = get();
    const total = get().getTotal();
    return Math.max(0, cashReceived - total);
  },
}));
