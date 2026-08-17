"use client";

import { useState, useEffect, useRef } from "react";
import { MenuItem, Transaction } from "@/types";
import { fetchMenuItemsFromDB, addTransaction, getNextOrderNumber } from "@/lib/data-service";
import {
  playNotificationChime,
  warmUpAudioContext,
  unlockAudioContext,
  requestPushNotificationPermission,
  showOrderPushNotification,
} from "@/lib/audio-notifier";
import { useCartStore } from "@/store/cart-store";
import MenuGrid from "./components/MenuGrid";
import CartSection from "./components/CartSection";
import PaymentModal from "./components/PaymentModal";
import ReceiptModal from "./components/ReceiptModal";
import IncomingOrdersDrawer from "./components/IncomingOrdersDrawer";
import { ArrowRight, ShoppingCart, Utensils, Bell, RefreshCw, Volume2 } from "lucide-react";

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
    unlockAudioContext();
    requestPushNotificationPermission();
  }, []);

  // Continuous Alarm Loop: Repeat chime every 3s UNTIL cashier accepts orders (newOrdersCount === 0)
  useEffect(() => {
    if (newOrdersCount > 0) {
      const alarmInterval = setInterval(() => {
        warmUpAudioContext();
        playNotificationChime();
      }, 3000);
      return () => clearInterval(alarmInterval);
    }
  }, [newOrdersCount]);

  // Title Flashing Alert for Background Tabs (when cashier is on WhatsApp / Antigravity)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalTitle = "Kasir POS - Kedai Nyamleng";
    let titleInterval: NodeJS.Timeout | null = null;

    if (newOrdersCount > 0) {
      let isFlashing = false;
      titleInterval = setInterval(() => {
        isFlashing = !isFlashing;
        document.title = isFlashing
          ? `🚨 (${newOrdersCount}) PESANAN ONLINE BARU!`
          : `🔔 MOHON TERIMA PESANAN (${newOrdersCount})`;
      }, 1000);
    } else {
      document.title = originalTitle;
    }

    const handleFocus = () => {
      if (newOrdersCount === 0) {
        document.title = originalTitle;
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      if (titleInterval) clearInterval(titleInterval);
      document.title = originalTitle;
      window.removeEventListener("focus", handleFocus);
    };
  }, [newOrdersCount]);

  const loadDigitalOrders = async () => {
    try {
      const res = await fetch(`/api/transactions?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });
      if (!res.ok) return;

      const transactions: Transaction[] = await res.json();
      if (!Array.isArray(transactions)) return;

      setDigitalOrders(transactions);

      const pendingOrders = transactions.filter(
        (t) => !t.orderStatus || t.orderStatus === "NEW_ORDER" || t.orderStatus === "PENDING"
      );
      setNewOrdersCount(pendingOrders.length);

      if (isFirstLoadRef.current) {
        transactions.forEach((t) => {
          if (t.id) knownTxIdsRef.current.add(t.id);
          if (t.orderNumber) knownTxIdsRef.current.add(t.orderNumber);
        });
        isFirstLoadRef.current = false;
        if (pendingOrders.length > 0) {
          playNotificationChime();
          showOrderPushNotification(pendingOrders[0]);
        }
        return;
      }

      // Check if new orders arrived that were not in knownTxIds
      const brandNew = transactions.filter(
        (t) =>
          (!knownTxIdsRef.current.has(t.id) && !knownTxIdsRef.current.has(t.orderNumber)) ||
          (!t.orderStatus || t.orderStatus === "NEW_ORDER" || t.orderStatus === "PENDING")
      );

      const unannounced = brandNew.filter(
        (t) => !knownTxIdsRef.current.has(`${t.id}-announced`)
      );

      if (unannounced.length > 0) {
        unannounced.forEach((t) => {
          if (t.id) {
            knownTxIdsRef.current.add(t.id);
            knownTxIdsRef.current.add(`${t.id}-announced`);
          }
          if (t.orderNumber) knownTxIdsRef.current.add(t.orderNumber);
          showOrderPushNotification(t);
        });
        // Play instant automatic notification chime!
        warmUpAudioContext();
        playNotificationChime();
      }
    } catch (err) {
      console.warn("Error fetching digital orders:", err);
    }
  };

  // Dual Web Worker + Foreground Poller for 100% background-resilient realtime order sync
  useEffect(() => {
    loadDigitalOrders();

    let worker: Worker | null = null;
    if (typeof window !== "undefined" && "Worker" in window) {
      try {
        worker = new Worker("/poller-worker.js");
        worker.onmessage = () => {
          loadDigitalOrders();
        };
        worker.postMessage("start");
      } catch {
        // Worker fallback silently
      }
    }

    const interval = setInterval(loadDigitalOrders, 400);

    return () => {
      clearInterval(interval);
      if (worker) {
        worker.postMessage("stop");
        worker.terminate();
      }
    };
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
      orderStatus: "ORDER_FINISH",
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
    knownTxIdsRef.current.add(transaction.orderNumber);

    fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...transaction, isPOSAdminCheckout: true }),
    })
      .then(() => loadDigitalOrders())
      .catch(() => {});

    setIsPaymentModalOpen(false);
    setIsReceiptModalOpen(true);
  };

  const handlePrintReceipt = (trx: Transaction) => {
    setCompletedTransaction(trx);
    setIsReceiptModalOpen(true);
  };

  const handleUpdateOrderStatus = (
    trxId: string,
    status: "ORDER_ACCEPTED" | "IN_PROCESSED" | "ORDER_FINISH" | "CANCELLED" | string
  ) => {
    // Instant 0ms Optimistic UI state update
    setDigitalOrders((prev) =>
      prev.map((t) => (t.id === trxId || t.orderNumber === trxId ? { ...t, orderStatus: status } : t))
    );

    // Non-blocking background sync to Supabase DB
    fetch("/api/transactions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: trxId, orderStatus: status }),
    }).catch((err) => console.warn("Failed to update status in DB:", err));
  };

  const handleCloseReceipt = () => {
    setIsReceiptModalOpen(false);
    setCompletedTransaction(null);
    clearCart();
    setMobileTab("menu");
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* High-Priority Emergency Sound & Push Notification Banner for Cashier Shift */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 p-2.5 px-3.5 sm:px-4 rounded-2xl shadow-md flex items-center justify-between gap-2.5 text-xs font-black">
        <div className="flex items-center gap-2 min-w-0">
          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] text-slate-950 shrink-0 animate-bounce" />
          <span className="truncate sm:whitespace-normal">
            {newOrdersCount > 0
              ? `🚨 ALARM AKTIF: Ada ${newOrdersCount} Pesanan Baru! Bel berbunyi berulang setiap 3 detik...`
              : "🔊 Klik 1x saat buka kasir agar Alarm POS & Push Notifikasi berbunyi otomatis tanpa henti"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            unlockAudioContext();
            warmUpAudioContext();
            playNotificationChime();
            requestPushNotificationPermission();
          }}
          className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-slate-950 text-amber-300 hover:bg-slate-900 rounded-xl text-[10px] sm:text-xs font-black shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
        >
          Aktifkan Audio 📢
        </button>
      </div>

      {/* Top Action & Real-time Incoming Orders Header Banner */}
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            Kasir POS Offline &amp; Menu Digital v2
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Layan transaksi pembeli offline dan pantau pesanan masuk secara realtime.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Audio Notifier Status & Test Trigger Pill */}
          <button
            type="button"
            onClick={() => {
              warmUpAudioContext();
              playNotificationChime();
            }}
            className="py-1.5 px-2.5 sm:py-2 sm:px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 active:scale-95 cursor-pointer"
            title="Tes Suara Bel Notifikasi POS"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="inline">Audio</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] sm:text-[10px] font-black">Aktif</span>
          </button>

          {/* Dedicated Compact Pesanan Online Trigger Button */}
          <button
            onClick={() => setIsOrdersDrawerOpen(true)}
            className={`py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-md cursor-pointer shrink-0 ${
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
            <span>Pesanan Online</span>
            <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] sm:text-[11px] font-black ${
              newOrdersCount > 0
                ? "bg-slate-950 text-amber-400"
                : "bg-slate-800 text-slate-300"
            }`}>
              {newOrdersCount > 0 ? `🔴 ${newOrdersCount} Baru` : `${digitalOrders.length}`}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Top View Switcher (Visible on < lg screens) */}
      <div className="lg:hidden bg-slate-900 p-1.5 rounded-2xl flex gap-1 shadow-md">
        <button
          type="button"
          onClick={() => setMobileTab("menu")}
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
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
          className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 relative ${
            mobileTab === "cart"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Keranjang</span>
          {totalItemsCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-black rounded-full bg-slate-950 text-amber-400 font-mono">
              {totalItemsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsOrdersDrawerOpen(true)}
          className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-slate-800 text-amber-400 hover:bg-slate-700"
        >
          <Bell className="w-4 h-4" />
          <span>Pesanan ({newOrdersCount})</span>
        </button>
      </div>

      {/* Main Grid Container */}
      <div className="min-h-0 flex-1 lg:h-[calc(100vh-11.5rem)] grid grid-cols-1 lg:grid-cols-12 gap-4 pb-20 lg:pb-0 overflow-hidden">
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

      {/* Mobile Floating Sticky Bottom Bar (Only visible when viewing Menu Tab) */}
      {items.length > 0 && mobileTab === "menu" && (
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
