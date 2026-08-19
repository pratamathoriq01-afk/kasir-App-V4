import { create } from "zustand";
import { CartItem, MenuItem, Voucher, AddOn } from "@/types";

function getCartItemId(menuItem: MenuItem, selectedAddOns?: AddOn[]): string {
  if (!selectedAddOns || selectedAddOns.length === 0) {
    return menuItem.id;
  }
  const addOnIds = selectedAddOns.map((a) => a.id).sort().join("_");
  return `${menuItem.id}__${addOnIds}`;
}

interface CartState {
  items: CartItem[];
  customerName: string;
  orderType: "dine-in" | "takeaway";
  tableNumber: string;
  discountType: "percent" | "fixed" | null;
  discountValue: number;
  appliedVoucher: Voucher | null;
  cashReceived: number;

  addItem: (item: MenuItem, selectedAddOns?: AddOn[]) => void;
  removeItem: (cartItemIdOrMenuId: string) => void;
  updateQty: (cartItemIdOrMenuId: string, qty: number) => void;
  updateNotes: (cartItemIdOrMenuId: string, notes: string) => void;
  setCustomerName: (name: string) => void;
  setOrderType: (type: "dine-in" | "takeaway") => void;
  setTableNumber: (table: string) => void;
  setDiscount: (type: "percent" | "fixed" | null, value: number) => void;
  setVoucher: (voucher: Voucher | null, calculatedDiscountAmount?: number) => void;
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
  orderType: "takeaway",
  tableNumber: "-",
  discountType: null,
  discountValue: 0,
  appliedVoucher: null,
  cashReceived: 0,

  addItem: (item: MenuItem, selectedAddOns?: AddOn[]) => {
    const lineId = getCartItemId(item, selectedAddOns);
    set((state) => {
      const existingIndex = state.items.findIndex(
        (i) => (i.id || i.menuItem.id) === lineId
      );
      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: updated[existingIndex].qty + 1,
        };
        return { items: updated };
      }
      return {
        items: [
          ...state.items,
          {
            id: lineId,
            menuItem: item,
            qty: 1,
            selectedAddOns: selectedAddOns ? [...selectedAddOns] : [],
          },
        ],
      };
    });
  },

  removeItem: (cartItemIdOrMenuId: string) => {
    set((state) => ({
      items: state.items.filter(
        (i) => (i.id || i.menuItem.id) !== cartItemIdOrMenuId && i.menuItem.id !== cartItemIdOrMenuId
      ),
    }));
  },

  updateQty: (cartItemIdOrMenuId: string, qty: number) => {
    set((state) => {
      if (qty <= 0) {
        return {
          items: state.items.filter(
            (i) => (i.id || i.menuItem.id) !== cartItemIdOrMenuId && i.menuItem.id !== cartItemIdOrMenuId
          ),
        };
      }
      return {
        items: state.items.map((i) =>
          (i.id || i.menuItem.id) === cartItemIdOrMenuId || i.menuItem.id === cartItemIdOrMenuId
            ? { ...i, qty }
            : i
        ),
      };
    });
  },

  updateNotes: (cartItemIdOrMenuId: string, notes: string) => {
    set((state) => ({
      items: state.items.map((i) =>
        (i.id || i.menuItem.id) === cartItemIdOrMenuId || i.menuItem.id === cartItemIdOrMenuId
          ? { ...i, notes }
          : i
      ),
    }));
  },

  setCustomerName: (name: string) => set({ customerName: name }),
  setOrderType: (type: "dine-in" | "takeaway") => set({ orderType: type }),
  setTableNumber: (table: string) => set({ tableNumber: table }),

  setDiscount: (type: "percent" | "fixed" | null, value: number) =>
    set({ discountType: type, discountValue: value, appliedVoucher: null }),

  setVoucher: (voucher: Voucher | null, calculatedDiscountAmount?: number) => {
    if (!voucher) {
      set({ appliedVoucher: null, discountType: null, discountValue: 0 });
      return;
    }

    if (voucher.discountType === "percent") {
      set({
        appliedVoucher: voucher,
        discountType: "percent",
        discountValue: voucher.discountValue,
      });
    } else {
      set({
        appliedVoucher: voucher,
        discountType: "fixed",
        discountValue: calculatedDiscountAmount || voucher.discountValue,
      });
    }
  },

  setCashReceived: (amount: number) => set({ cashReceived: amount }),

  clearCart: () =>
    set({
      items: [],
      customerName: "",
      orderType: "dine-in",
      tableNumber: "01",
      discountType: null,
      discountValue: 0,
      appliedVoucher: null,
      cashReceived: 0,
    }),

  getSubtotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => {
      const addOnsTotal = (item.selectedAddOns || []).reduce(
        (aSum, a) => aSum + Number(a.price || 0),
        0
      );
      return sum + (Number(item.menuItem.price) + addOnsTotal) * item.qty;
    }, 0);
  },

  getHppTotal: () => {
    const { items } = get();
    return items.reduce((sum, item) => {
      const addOnsHpp = (item.selectedAddOns || []).reduce(
        (aSum, a) => aSum + Number(a.hpp || 0),
        0
      );
      return sum + (Number(item.menuItem.hpp) + addOnsHpp) * item.qty;
    }, 0);
  },

  getDiscountAmount: () => {
    const { discountType, discountValue, appliedVoucher } = get();
    const subtotal = get().getSubtotal();
    if (!discountType || discountValue <= 0) return 0;
    if (discountType === "percent") {
      let calc = Math.round((subtotal * Math.min(discountValue, 100)) / 100);
      if (appliedVoucher?.maxDiscount && calc > appliedVoucher.maxDiscount) {
        calc = appliedVoucher.maxDiscount;
      }
      return calc;
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
