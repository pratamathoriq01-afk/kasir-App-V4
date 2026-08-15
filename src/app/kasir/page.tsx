"use client";

import { useState, useEffect, useRef } from "react";
import { MenuItem, Transaction } from "@/types";
import { fetchMenuItemsFromDB, addTransaction, getNextOrderNumber } from "@/lib/data-service";
import { playNotificationChime } from "@/lib/audio-notifier";
import { useCartStore } from "@/store/cart-store";
import MenuGrid from "./components/MenuGrid";
import CartSection from "./components/CartSection";
import PaymentModal from "./components/PaymentModal";
import ReceiptModal from "./components/ReceiptModal";
import IncomingOrdersDrawer from "./components/IncomingOrdersDrawer";
import { ArrowRight, ShoppingCart, Utensils, Bell, RefreshCw } from "lucide-react";

export default function KasirPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);

  // Real-time Incoming Digital Orders State
  const [digitalOrders, setDigitalOrders] = useState<Transaction[]>([]);
  const [isOrdersDrawerOpen, setIsOrdersDrawerOpen] = useState<boolean>(false);
  const [newOrdersCount, setNewOrdersCount] = useState<number>(0);
  const knownTxIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef<boolean>(true);

  // Mobile active tab ("menu" | "cart" | "orders")
  const [mobileTab, setMobileTab] = useState<"menu" | "cart" | "orders">("menu");

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

  const loadDigitalOrders = async () => {
    try {
      const res = await fetch("/api/transactions");
      if (!res.ok) return;

      const transactions: Transaction[] = await res.json();
      if (!Array.isArray(transactions)) return;

      setDigitalOrders(transactions);

      const pendingCount = transactions.filter(
        (t) => !t.orderStatus || t.orderStatus === "NEW_ORDER" || t.orderStatus === "PENDING"
      ).length;
      setNewOrdersCount(pendingCount);

      if (isFirstLoadRef.current) {
        transactions.forEach((t) => knownTxIdsRef.current.add(t.id));
        isFirstLoadRef.current = false;
        return;
      }

      // Check if new orders arrived that were not in knownTxIds
      const brandNew = transactions.filter((t) => !knownTxIdsRef.current.has(t.id));
      if (brandNew.length > 0) {
        brandNew.forEach((t) => knownTxIdsRef.current.add(t.id));
        // Play notification chime without interrupting cashier screen!
        playNotificationChime();
      }
    } catch (err) {
      console.warn("Error fetching digital orders:", err);
    }
  };

  // Real-time Poller for incoming orders from Menu Digital v2 (every 4s)
  useEffect(() => {
    loadDigitalOrders();
    const interval = setInterval(loadDigitalOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const totalItemsCount = items.reduce((s, i) => s + i.qty, 0);

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
      orderStatus: "COMPLETED",
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
    knownTxIdsRef.current.add(transaction.id);

    fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaction),
    }).catch(() => {});

    setIsPaymentModalOpen(false);
    setIsReceiptModalOpen(true);
  };

  const handlePrintReceipt = (trx: Transaction) => {
    setCompletedTransaction(trx);
    setIsReceiptModalOpen(true);
  };

  const handleUpdateOrderStatus = (trxId: string, status: "PROCESSED" | "COMPLETED" | "CANCELLED") => {
    setDigitalOrders((prev) =>
      prev.map((t) => (t.id === trxId ? { ...t, orderStatus: status } : t))
    );

    // Sync status change to backend if endpoint available
    fetch(`/api/transactions?id=${trxId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: trxId, orderStatus: status }),
    }).catch(() => {});

    loadDigitalOrders();
  };

  const handleCloseReceipt = () => {
    setIsReceiptModalOpen(false);
    setCompletedTransaction(null);
    clearCart();
    setMobileTab("menu");
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Top Action & Real-time Incoming Orders Header Banner */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
            Kasir POS Offline &amp; Menu Digital v2
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Layan transaksi pembeli offline dan pantau pesanan masuk secara realtime.
          </p>
        </div>

        {/* Dedicated Wadah Pesanan Masuk Trigger Button */}
        <button
          onClick={() => setIsOrdersDrawerOpen(true)}
          className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-md cursor-pointer shrink-0 ${
            newOrdersCount > 0
              ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/25 animate-pulse"
              : "bg-slate-900 hover:bg-slate-800 text-white"
          }`}
        >
          <div className="relative">
            <Bell className="w-4 h-4 stroke-[2.5]" />
            {newOrdersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white animate-ping" />
            )}
          </div>
          <span>Wadah Pesanan Masuk (Menu Digital)</span>
          <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-black ${
            newOrdersCount > 0
              ? "bg-slate-950 text-amber-400"
              : "bg-slate-800 text-slate-300"
          }`}>
            {newOrdersCount > 0 ? `${newOrdersCount} Baru` : `${digitalOrders.length}`}
          </span>
        </button>
      </div>

      {/* Mobile Top View Switcher (Visible on < lg screens) */}
      <div className="lg:hidden bg-slate-900 p-1.5 rounded-2xl flex gap-1 shadow-md">
        <button
          type="button"
          onClick={() => setMobileTab("menu")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === "menu"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Daftar Menu</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab("cart")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 relative ${
            mobileTab === "cart"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Keranjang</span>
          {totalItemsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-black rounded-full bg-slate-950 text-amber-400 font-mono">
              {totalItemsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsOrdersDrawerOpen(true)}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-800 text-amber-400 hover:bg-slate-700"
        >
          <Bell className="w-4 h-4" />
          <span>Pesanan ({newOrdersCount})</span>
        </button>
      </div>

      {/* Main Grid Container */}
      <div className="min-h-[calc(100vh-12rem)] lg:h-[calc(100vh-10rem)] grid grid-cols-1 lg:grid-cols-12 gap-4 pb-20 lg:pb-0">
        {/* Left Column: Menu Grid (7 cols desktop) */}
        <div
          className={`lg:col-span-7 xl:col-span-8 lg:h-full lg:overflow-hidden flex flex-col ${
            mobileTab === "menu" ? "block" : "hidden lg:flex"
          }`}
        >
          <MenuGrid items={menuItems} />
        </div>

        {/* Right Column: Cart Section (5 cols desktop) */}
        <div
          className={`lg:col-span-5 xl:col-span-4 lg:h-full lg:overflow-hidden flex flex-col ${
            mobileTab === "cart" ? "block" : "hidden lg:flex"
          }`}
        >
          <CartSection onOpenPaymentModal={() => setIsPaymentModalOpen(true)} />
        </div>
      </div>

      {/* Mobile Floating Sticky Bottom Bar */}
      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md text-white p-3 border-t border-slate-800 shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom duration-200">
          <div
            onClick={() => setMobileTab("cart")}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">
                {totalItemsCount} item pesanan
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

      {/* Dedicated Incoming Digital Orders List Drawer Panel */}
      <IncomingOrdersDrawer
        isOpen={isOrdersDrawerOpen}
        orders={digitalOrders}
        onClose={() => setIsOrdersDrawerOpen(false)}
        onRefresh={loadDigitalOrders}
        onPrintReceipt={handlePrintReceipt}
        onUpdateStatus={handleUpdateOrderStatus}
      />
    </div>
  );
}
