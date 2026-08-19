"use client";

import { useState, useEffect, useRef } from "react";
import { MenuItem, Transaction, AddOn } from "@/types";
import {
  fetchMenuItemsFromDB,
  getStoredMenuItems,
  saveMenuItemOptimistic,
  addTransaction,
  getNextOrderNumber,
  subscribePOSSync,
  fetchAddOnsFromDB,
  getStoredAddOns,
} from "@/lib/data-service";
import { supabase } from "@/lib/supabase";
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
import MenuFormModal from "@/app/menu/components/MenuFormModal";
import AddOnPickerModal from "./components/AddOnPickerModal";
import AddOnManagementModal from "@/app/menu/components/AddOnManagementModal";
import { ArrowRight, ShoppingCart, Utensils, Bell, RefreshCw, Volume2, Sparkles, ShieldCheck, Plus, UtensilsCrossed } from "lucide-react";

export default function KasirPage() {
  // Initialize with cached local items for instant 0ms initial render without blank screen
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => getStoredMenuItems());
  const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>(() => getStoredAddOns());
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);

  // Quick Menu Modal (Core POS Menu Management)
  const [isMenuModalOpen, setIsMenuModalOpen] = useState<boolean>(false);
  const [itemToEdit, setItemToEdit] = useState<MenuItem | null>(null);

  // Add-On Selection Modal & Management Modal
  const [selectedMenuItemForAddOns, setSelectedMenuItemForAddOns] = useState<MenuItem | null>(null);
  const [isAddOnPickerOpen, setIsAddOnPickerOpen] = useState<boolean>(false);
  const [isAddOnManagementOpen, setIsAddOnManagementOpen] = useState<boolean>(false);

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
    addItem,
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

  const loadMenu = () => {
    fetchMenuItemsFromDB().then((loaded) => setMenuItems(loaded));
  };

  const loadAddOns = () => {
    fetchAddOnsFromDB().then((loaded) => setAvailableAddOns(loaded));
  };

  // 1. Core Supabase Realtime WebSocket Connection (0ms Instant Latency)
  useEffect(() => {
    loadMenu();
    loadAddOns();
    loadDigitalOrders();
    unlockAudioContext();
    requestPushNotificationPermission();

    // Direct Supabase WebSocket Channel Subscription
    const realtimeChannel = supabase
      .channel("kasir_realtime_orders_stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Transaction" },
        (payload) => {
          console.log("⚡ [SUPABASE REALTIME WS EVENT RECEIVED]:", payload.eventType, payload.new);
          loadDigitalOrders();
          warmUpAudioContext();
          playNotificationChime();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "MenuItem" },
        () => {
          loadMenu();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "AddOn" },
        () => {
          loadAddOns();
        }
      )
      .subscribe();

    const handleWindowFocus = () => {
      loadMenu();
      loadAddOns();
      loadDigitalOrders();
    };
    window.addEventListener("focus", handleWindowFocus);

    const unsubscribe = subscribePOSSync((type) => {
      if (type === "MENU_UPDATED") {
        setMenuItems(getStoredMenuItems());
        loadMenu();
      } else if (type === "ADDONS_UPDATED") {
        setAvailableAddOns(getStoredAddOns());
        loadAddOns();
      } else if (type === "TRANSACTION_UPDATED") {
        loadDigitalOrders();
      }
    });

    return () => {
      supabase.removeChannel(realtimeChannel);
      window.removeEventListener("focus", handleWindowFocus);
      unsubscribe();
    };
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

  // Title Flashing Alert for Background Tabs (when cashier is on WhatsApp / another app)
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
      // 1. Direct Supabase Query (Blazing Fast ~30ms)
      const { data: directData, error } = await supabase
        .from("Transaction")
        .select("*, items:TransactionItem(*)")
        .order("createdAt", { ascending: false });

      let transactions: Transaction[] = [];

      if (!error && Array.isArray(directData)) {
        transactions = directData as Transaction[];
      } else {
        // Fallback to API endpoint
        const res = await fetch(`/api/transactions?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
          const apiData = await res.json();
          if (Array.isArray(apiData)) transactions = apiData;
        }
      }

      if (!transactions || !Array.isArray(transactions)) return;

      // Filter all unconfirmed digital orders
      const pendingOrders = transactions.filter((t) => {
        const isDigitalUnconfirmed =
          t.orderNotes !== "KASIR_CONFIRMED" &&
          ((t.orderNumber && String(t.orderNumber).startsWith("KDN-")) || Boolean(t.customerEmail) || Boolean(t.customerPhone) || (Boolean(t.tableNumber) && t.tableNumber !== "-"));
        return (
          isDigitalUnconfirmed ||
          !t.orderStatus ||
          t.orderStatus === "NEW_ORDER" ||
          t.orderStatus === "PENDING"
        );
      });

      setDigitalOrders(transactions);
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

      // Check if brand new orders arrived that were not in knownTxIds
      const brandNew = pendingOrders.filter(
        (t) => !knownTxIdsRef.current.has(t.id) && !knownTxIdsRef.current.has(t.orderNumber)
      );

      if (brandNew.length > 0) {
        brandNew.forEach((t) => {
          if (t.id) knownTxIdsRef.current.add(t.id);
          if (t.orderNumber) knownTxIdsRef.current.add(t.orderNumber);
          showOrderPushNotification(t);
        });
        warmUpAudioContext();
        playNotificationChime();
      }
    } catch (err) {
      console.warn("Error fetching digital orders:", err);
    }
  };

  // Lightweight fallback interval (Every 5s) - Supabase WebSocket Stream handles instant real-time push
  useEffect(() => {
    const interval = setInterval(loadDigitalOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalItemsCount = items.reduce((sum, item) => sum + item.qty, 0);

  const handleConfirmPayment = async () => {
    const orderNumber = getNextOrderNumber();
    const subtotal = getSubtotal();
    const discountAmount = getDiscountAmount();
    const tax = getTaxAmount();
    const total = getTotal();
    const hppTotal = getHppTotal();
    const netProfit = getNetProfit();
    const paid = cashReceived || total;
    const changeAmount = getChange();

    const newTrx: Transaction = {
      id: `trx-${Date.now()}`,
      orderNumber,
      customerName: customerName || "Pelanggan",
      orderType,
      tableNumber: orderType === "dine-in" ? tableNumber : "-",
      subtotal,
      discountType: discountType || null,
      discountValue: discountValue || 0,
      discountAmount,
      tax,
      total,
      hppTotal,
      netProfit,
      cashReceived: paid,
      change: changeAmount,
      createdAt: new Date().toISOString(),
      orderStatus: "ORDER_FINISH",
      orderNotes: "KASIR_CONFIRMED",
      paymentStatus: "PAID",
      paymentMethod: "CASH",
      items: items.map((item) => {
        const addOnsExtra = (item.selectedAddOns || []).reduce((s, a) => s + (a.price || 0), 0);
        const addOnsHpp = (item.selectedAddOns || []).reduce((s, a) => s + (a.hpp || 0), 0);
        const addOnsText = (item.selectedAddOns || []).map((a) => a.name).join(", ");
        return {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          menuItemId: item.menuItem.id,
          nameSnapshot: item.menuItem.name,
          priceSnapshot: Number(item.menuItem.price) + addOnsExtra,
          hppSnapshot: Number(item.menuItem.hpp) + addOnsHpp,
          qty: item.qty,
          addOnsSnapshot: addOnsText || null,
        };
      }),
    };

    addTransaction(newTrx);

    fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newTrx, isPOSAdminCheckout: true }),
    }).catch((err) => console.warn("Failed to persist POS transaction:", err));

    setIsPaymentModalOpen(false);
    setCompletedTransaction(newTrx);
    setIsReceiptModalOpen(true);
  };

  const handlePrintReceipt = (trx: Transaction) => {
    setCompletedTransaction(trx);
    setIsReceiptModalOpen(true);
  };

  const handleUpdateOrderStatus = (trxId: string, status: "IN_PROCESSED" | "ORDER_FINISH" | "CANCELLED") => {
    setDigitalOrders((prev) =>
      prev.map((t) =>
        t.id === trxId || t.orderNumber === trxId
          ? { ...t, orderStatus: status, orderNotes: "KASIR_CONFIRMED" }
          : t
      )
    );

    fetch("/api/transactions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: trxId, orderStatus: status }),
    }).catch((err) => console.warn("Failed to update status in DB:", err));
  };

  const handleSaveItemFromPOS = async (item: MenuItem) => {
    const updated = await saveMenuItemOptimistic(item, menuItems);
    setMenuItems(updated);
    setIsMenuModalOpen(false);
    setItemToEdit(null);
  };

  const handleCloseReceipt = () => {
    setIsReceiptModalOpen(false);
    setCompletedTransaction(null);
    if (items.length > 0) {
      clearCart();
      setMobileTab("menu");
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-2 h-full">
      {/* Streamlined Single-Row Header Bar (Compact & High-Contrast) */}
      <div className="bg-card p-2 sm:p-2.5 rounded-2xl border border-border shadow-xs flex items-center justify-between gap-2 shrink-0 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-xl bg-primary text-primary-foreground font-black text-sm">
            ⚡
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-extrabold text-foreground truncate">
              Kasir POS Kedai Nyamleng
            </h1>
            <p className="text-[10px] text-muted-foreground hidden sm:block truncate">
              Realtime POS, sinkronisasi pesanan digital &amp; thermal printing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Add Menu Button (Core POS Edit Feature) */}
          <button
            type="button"
            onClick={() => {
              setItemToEdit(null);
              setIsMenuModalOpen(true);
            }}
            className="py-1 px-2.5 sm:py-1.5 sm:px-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-black transition-all flex items-center gap-1 shadow-xs cursor-pointer"
            title="Tambah Menu Makanan/Minuman Baru"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">+ Menu Baru</span>
          </button>

          {/* Quick Add-On Management Button */}
          <button
            type="button"
            onClick={() => setIsAddOnManagementOpen(true)}
            className="py-1 px-2 sm:py-1.5 sm:px-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-black transition-all flex items-center gap-1 shadow-xs cursor-pointer"
            title="Kelola Daftar Add-On & Topping"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Add-On</span>
          </button>

          {/* Audio Alert Trigger */}
          <button
            type="button"
            onClick={() => {
              unlockAudioContext();
              warmUpAudioContext();
              playNotificationChime();
              requestPushNotificationPermission();
            }}
            className="py-1 px-2 sm:py-1.5 sm:px-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 border border-border cursor-pointer"
            title="Aktifkan & Tes Audio Alarm"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Audio</span>
          </button>

          {/* Dedicated Incoming Digital Orders Trigger Button */}
          <button
            onClick={() => setIsOrdersDrawerOpen(true)}
            className={`py-1 px-2.5 sm:py-1.5 sm:px-3.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
              newOrdersCount > 0
                ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/25 animate-pulse"
                : "bg-slate-900 hover:bg-slate-800 text-white"
            }`}
          >
            <div className="relative">
              <Bell className="w-3.5 h-3.5 stroke-[2.5]" />
              {newOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white animate-ping" />
              )}
            </div>
            <span>Pesanan Online</span>
            <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] font-black ${
              newOrdersCount > 0
                ? "bg-slate-950 text-amber-400"
                : "bg-slate-800 text-slate-300"
            }`}>
              {newOrdersCount > 0 ? `${newOrdersCount} Baru` : `${digitalOrders.length}`}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Top View Switcher (Visible only on mobile < lg screens) */}
      <div className="lg:hidden bg-slate-900 p-1 rounded-xl flex gap-1 shadow-md shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab("menu")}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            mobileTab === "menu"
              ? "bg-amber-500 text-slate-950 shadow-xs"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Menu</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab("cart")}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 relative ${
            mobileTab === "cart"
              ? "bg-amber-500 text-slate-950 shadow-xs"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Keranjang</span>
          {totalItemsCount > 0 && (
            <span className="px-1.5 py-0.2 text-[9px] font-black rounded-full bg-slate-950 text-amber-400 font-mono">
              {totalItemsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsOrdersDrawerOpen(true)}
          className="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 bg-slate-800 text-amber-400 hover:bg-slate-700"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Pesanan ({newOrdersCount})</span>
        </button>
      </div>

      {/* Main Grid Container - Viewport-Lock Layout (Never Requires Zoom In / Zoom Out) */}
      <div className="min-h-0 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden pb-16 lg:pb-0">
        {/* Left Column: Menu Grid (7 cols desktop, 8 cols widescreen) */}
        <div
          className={`lg:col-span-7 xl:col-span-8 h-full min-h-0 overflow-hidden flex flex-col ${
            mobileTab === "menu" ? "block" : "hidden lg:flex"
          }`}
        >
          <MenuGrid
            items={menuItems}
            onSelectItem={(item) => {
              setSelectedMenuItemForAddOns(item);
              setIsAddOnPickerOpen(true);
            }}
            onEditItem={(item) => {
              setItemToEdit(item);
              setIsMenuModalOpen(true);
            }}
            onAddNewItem={() => {
              setItemToEdit(null);
              setIsMenuModalOpen(true);
            }}
          />
        </div>

        {/* Right Column: Cart Section (5 cols desktop, 4 cols widescreen) */}
        <div
          className={`lg:col-span-5 xl:col-span-4 h-full min-h-0 overflow-hidden flex flex-col ${
            mobileTab === "cart" ? "block" : "hidden lg:flex"
          }`}
        >
          <CartSection onOpenPaymentModal={() => setIsPaymentModalOpen(true)} />
        </div>
      </div>

      {/* Mobile Floating Sticky Bottom Bar (Only visible when viewing Menu Tab on small devices) */}
      {items.length > 0 && mobileTab === "menu" && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md text-white p-2.5 border-t border-slate-800 shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom duration-200">
          <div
            onClick={() => setMobileTab("cart")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">
                {totalItemsCount} item
              </span>
              <span className="text-sm font-black text-amber-400 font-mono">
                Rp {getTotal().toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="py-2 px-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-md active:scale-95 cursor-pointer"
          >
            <span>Bayar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick Menu Form Modal (Core POS Menu Management) */}
      <MenuFormModal
        isOpen={isMenuModalOpen}
        itemToEdit={itemToEdit}
        onClose={() => {
          setIsMenuModalOpen(false);
          setItemToEdit(null);
        }}
        onSave={handleSaveItemFromPOS}
      />

      {/* Add-On Picker Modal (Triggered on Menu Item Selection) */}
      <AddOnPickerModal
        isOpen={isAddOnPickerOpen}
        menuItem={selectedMenuItemForAddOns}
        availableAddOns={availableAddOns}
        onConfirm={(item, selectedAddOns) => {
          addItem(item, selectedAddOns);
          setIsAddOnPickerOpen(false);
          setSelectedMenuItemForAddOns(null);
        }}
        onDirectAdd={(item) => {
          addItem(item);
          setIsAddOnPickerOpen(false);
          setSelectedMenuItemForAddOns(null);
        }}
        onClose={() => {
          setIsAddOnPickerOpen(false);
          setSelectedMenuItemForAddOns(null);
        }}
      />

      {/* Add-On Management Modal (Core POS Toppings Management) */}
      <AddOnManagementModal
        isOpen={isAddOnManagementOpen}
        onClose={() => {
          setIsAddOnManagementOpen(false);
          setAvailableAddOns(getStoredAddOns());
        }}
      />

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
