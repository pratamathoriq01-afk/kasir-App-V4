"use client";

import { useState, useEffect } from "react";
import { MenuItem, Transaction } from "@/types";
import { fetchMenuItemsFromDB, addTransaction, getNextOrderNumber } from "@/lib/data-service";
import { useCartStore } from "@/store/cart-store";
import MenuGrid from "./components/MenuGrid";
import CartSection from "./components/CartSection";
import PaymentModal from "./components/PaymentModal";
import ReceiptModal from "./components/ReceiptModal";
import { ArrowRight, ShoppingCart } from "lucide-react";

export default function KasirPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);

  const {
    items,
    customerName,
    orderType,
    tableNumber,
    discountType,
    discountValue,
    cashReceived,
    clearCart,
    getSubtotal,
    getHppTotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
    getNetProfit,
    getChange,
  } = useCartStore();

  useEffect(() => {
    fetchMenuItemsFromDB().then((loaded) => setMenuItems(loaded));
  }, []);

  const handleConfirmPayment = async () => {
    const orderNumber = getNextOrderNumber();

    const transaction: Transaction = {
      id: `trx-${Date.now()}`,
      orderNumber,
      customerName: customerName.trim() || "Pelanggan",
      orderType,
      tableNumber: orderType === "dine-in" ? tableNumber || "01" : "-",
      subtotal: getSubtotal(),
      discountType,
      discountValue,
      discountAmount: getDiscountAmount(),
      tax: getTaxAmount(),
      total: getTotal(),
      hppTotal: getHppTotal(),
      netProfit: getNetProfit(),
      cashReceived,
      change: getChange(),
      createdAt: new Date().toISOString(),
      items: items.map((i) => ({
        id: `ti-${Date.now()}-${Math.random()}`,
        menuItemId: i.menuItem.id,
        nameSnapshot: i.menuItem.name,
        priceSnapshot: i.menuItem.price,
        hppSnapshot: i.menuItem.hpp,
        qty: i.qty,
      })),
    };

    addTransaction(transaction);
    setCompletedTransaction(transaction);

    fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaction),
    }).catch(() => {});

    setIsPaymentModalOpen(false);
    setIsReceiptModalOpen(true);
  };

  const handleCloseReceipt = () => {
    setIsReceiptModalOpen(false);
    setCompletedTransaction(null);
    clearCart();
  };

  return (
    <div className="min-h-[calc(100vh-6.5rem)] lg:h-[calc(100vh-6.5rem)] grid grid-cols-1 lg:grid-cols-12 gap-5 pb-20 lg:pb-0">
      {/* Left Column: Menu Items & Filter (7 cols) */}
      <div className="lg:col-span-7 xl:col-span-8 lg:h-full lg:overflow-hidden flex flex-col min-h-[450px]">
        <MenuGrid items={menuItems} />
      </div>

      {/* Right Column: Cart & Summary (5 cols) */}
      <div className="lg:col-span-5 xl:col-span-4 lg:h-full lg:overflow-hidden flex flex-col">
        <CartSection onOpenPaymentModal={() => setIsPaymentModalOpen(true)} />
      </div>

      {/* Mobile Floating Sticky Bottom Checkout Bar */}
      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md text-white p-3.5 border-t border-slate-800 shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">
                {items.reduce((s, i) => s + i.qty, 0)} item pesanan
              </span>
              <span className="text-base font-black text-amber-400 font-mono">
                Rp {getTotal().toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
          >
            <span>Bayar Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Payment Dialog */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Receipt & Thermal Print Dialog */}
      <ReceiptModal
        transaction={completedTransaction}
        isOpen={isReceiptModalOpen}
        onClose={handleCloseReceipt}
      />
    </div>
  );
}
