"use client";

import { useState } from "react";
import { Transaction } from "@/types";
import { Bell, Printer, CheckCircle2, Clock, X, Utensils, RefreshCw, ShoppingBag, ArrowRight, Check, Sparkles, AlertCircle } from "lucide-react";

interface IncomingOrdersDrawerProps {
  isOpen: boolean;
  orders: Transaction[];
  onClose: () => void;
  onRefresh: () => void;
  onPrintReceipt: (trx: Transaction) => void;
  onUpdateStatus: (trxId: string, status: "IN_PROCESSED" | "ORDER_FINISH" | "CANCELLED") => void;
}

export default function IncomingOrdersDrawer({
  isOpen,
  orders,
  onClose,
  onRefresh,
  onPrintReceipt,
  onUpdateStatus,
}: IncomingOrdersDrawerProps) {
  const [activeTab, setActiveTab] = useState<"NEW_ORDER" | "IN_PROCESSED" | "ORDER_FINISH">("NEW_ORDER");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const showNotificationToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filter 3 Tabs
  const newOrders = orders.filter(
    (o) => !o.orderStatus || o.orderStatus === "NEW_ORDER" || o.orderStatus === "PENDING" || o.orderStatus === "ORDER_ACCEPTED"
  );
  const inProcessedOrders = orders.filter(
    (o) => o.orderStatus === "IN_PROCESSED" || o.orderStatus === "PROCESSED" || o.orderStatus === "COOKING"
  );
  const finishedOrders = orders.filter(
    (o) => o.orderStatus === "ORDER_FINISH" || o.orderStatus === "COMPLETED" || o.orderStatus === "PAID" || o.orderStatus === "DONE"
  );

  const filteredOrders =
    activeTab === "NEW_ORDER"
      ? newOrders
      : activeTab === "IN_PROCESSED"
      ? inProcessedOrders
      : finishedOrders;

  const handleActionClick = (trx: Transaction, targetStatus: "IN_PROCESSED" | "ORDER_FINISH") => {
    const id = trx.id || trx.orderNumber;
    setProcessingId(id);
    setTimeout(() => {
      onUpdateStatus(id, targetStatus);
      setProcessingId(null);
      if (targetStatus === "IN_PROCESSED") {
        showNotificationToast(`🔥 Pesanan ${trx.orderNumber} diterima & diteruskan ke Dapur!`);
        setActiveTab("IN_PROCESSED");
      } else if (targetStatus === "ORDER_FINISH") {
        showNotificationToast(`✅ Pesanan ${trx.orderNumber} selesai & masuk ke Riwayat Nota!`);
      }
    }, 250);
  };


  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex justify-end animate-in fade-in duration-300">
      {/* Toast Floating Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white border border-emerald-500/40 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
          <span className="text-xs font-black tracking-wide">{toastMessage}</span>
        </div>
      )}

      <div className="bg-white max-w-full sm:max-w-xl w-full h-full shadow-2xl border-l border-slate-300 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Top Header Drawer */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-between shrink-0 shadow-lg border-b border-slate-800">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-2xl shadow-lg shadow-amber-500/20 relative shrink-0">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              {newOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-slate-900"></span>
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] sm:text-[10px] font-extrabold text-amber-300 uppercase tracking-widest bg-amber-500/20 px-1.5 py-0.5 rounded-md border border-amber-500/30">
                  Menu Digital v2
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400 font-mono flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Real-time DB Sync
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white mt-0.5 tracking-tight truncate">
                Wadah Pesanan Masuk ({orders.length})
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={onRefresh}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all active:scale-95 cursor-pointer"
              title="Refresh Data Supabase"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Clean 3-Tab Bar (1. Baru | 2. Diproses | 3. Selesai) */}
        <div className="p-2 sm:p-3 bg-slate-100/90 border-b border-slate-200 grid grid-cols-3 gap-1.5 sm:gap-2 shrink-0 text-[10px] sm:text-xs">
          {/* Tab 1: Pesanan Baru */}
          <button
            onClick={() => setActiveTab("NEW_ORDER")}
            className={`py-2 px-1.5 sm:py-2.5 sm:px-3 rounded-xl font-black flex items-center justify-center gap-1 sm:gap-2 transition-all duration-200 cursor-pointer ${
              activeTab === "NEW_ORDER"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-400 scale-[1.02]"
                : newOrders.length > 0
                ? "bg-amber-50 text-slate-800 border border-amber-300/80 animate-pulse hover:bg-amber-100"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <span className="truncate">1. Baru</span>
            <span className={`px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black rounded-full font-mono transition-transform duration-200 ${
              activeTab === "NEW_ORDER" ? "bg-slate-950 text-amber-400 scale-110" : "bg-slate-200 text-slate-800"
            }`}>
              {newOrders.length}
            </span>
          </button>

          {/* Tab 2: Memproses Pesanan */}
          <button
            onClick={() => setActiveTab("IN_PROCESSED")}
            className={`py-2 px-1.5 sm:py-2.5 sm:px-3 rounded-xl font-black flex items-center justify-center gap-1 sm:gap-2 transition-all duration-200 cursor-pointer ${
              activeTab === "IN_PROCESSED"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400 scale-[1.02]"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <span className="truncate">2. Diproses</span>
            <span className={`px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black rounded-full font-mono transition-transform duration-200 ${
              activeTab === "IN_PROCESSED" ? "bg-white text-indigo-900 scale-110" : "bg-slate-200 text-slate-800"
            }`}>
              {inProcessedOrders.length}
            </span>
          </button>

          {/* Tab 3: Riwayat Selesai */}
          <button
            onClick={() => setActiveTab("ORDER_FINISH")}
            className={`py-2 px-1.5 sm:py-2.5 sm:px-3 rounded-xl font-black flex items-center justify-center gap-1 sm:gap-2 transition-all duration-200 cursor-pointer ${
              activeTab === "ORDER_FINISH"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400 scale-[1.02]"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <span className="truncate">3. Selesai</span>
            <span className={`px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black rounded-full font-mono transition-transform duration-200 ${
              activeTab === "ORDER_FINISH" ? "bg-white text-emerald-900 scale-110" : "bg-slate-200 text-slate-800"
            }`}>
              {finishedOrders.length}
            </span>
          </button>
        </div>

        {/* Orders List Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/80">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs my-auto animate-in fade-in duration-300">
              <Bell className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-300 animate-bounce" />
              <p className="font-bold text-slate-800 text-base">Tidak Ada Pesanan</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {activeTab === "NEW_ORDER"
                  ? "Belum ada pesanan baru dari Menu Digital v2."
                  : activeTab === "IN_PROCESSED"
                  ? "Tidak ada pesanan yang sedang dimasak di dapur."
                  : "Belum ada riwayat pesanan selesai."}
              </p>
            </div>
          ) : (
            filteredOrders.map((trx) => {
              const statusUpper = (trx.orderStatus || "NEW_ORDER").toUpperCase();
              const isNew = !trx.orderStatus || statusUpper === "NEW_ORDER" || statusUpper === "PENDING" || statusUpper === "ORDER_ACCEPTED";
              const isProcessed = statusUpper === "IN_PROCESSED" || statusUpper === "PROCESSED" || statusUpper === "COOKING";
              const isFinished = statusUpper === "ORDER_FINISH" || statusUpper === "COMPLETED" || statusUpper === "PAID" || statusUpper === "DONE";

              const formattedTime = new Date(trx.createdAt).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={trx.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col transition-all duration-200 hover:shadow-xl hover:border-slate-300 hover:scale-[1.01] animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  {/* Distinct Color Header Bar for 3 Stages */}
                  <div
                    className={`px-4 py-2.5 flex items-center justify-between font-bold text-xs ${
                      isNew
                        ? "bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950"
                        : isProcessed
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white"
                        : "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm tracking-tight">
                        {trx.orderNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/20 text-white border border-white/20">
                        {isNew
                          ? "1. PESANAN BARU"
                          : isProcessed
                          ? "2. DIPROSES DAPUR"
                          : "3. SELESAI"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono opacity-90">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formattedTime} WIB</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    {/* Customer & Table Row */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                          Nama Pemesan
                        </span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          {trx.customerName || "Pelanggan"}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                          Tipe / Meja
                        </span>
                        <span className="font-bold text-amber-700 flex items-center gap-1 text-xs">
                          {trx.orderType === "dine-in" ? (
                            <>
                              <Utensils className="w-3.5 h-3.5" /> Meja {trx.tableNumber || "-"}
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5" /> Bungkus
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Purchased Menu List */}
                    <div className="space-y-1.5 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Daftar Menu ({trx.items?.length || 0}):
                      </span>
                      <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto pr-1">
                        {trx.items?.map((item, idx) => (
                          <div key={idx} className="py-1.5 first:pt-0 flex justify-between items-center text-slate-800">
                            <span>
                              <strong className="font-mono text-amber-600 mr-1.5 text-sm">{item.qty}x</strong>{" "}
                              {item.nameSnapshot}
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              Rp {(item.priceSnapshot * item.qty).toLocaleString("id-ID")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Total Tagihan
                        </span>
                        <span className="text-base font-black font-mono text-amber-600">
                          Rp {trx.total.toLocaleString("id-ID")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Print Receipt Action */}
                        <button
                          onClick={() => onPrintReceipt(trx)}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer border border-slate-200"
                          title="Cetak Struk Dapur/Kasir"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak Struk</span>
                        </button>

                        {/* 3-Stage Workflow Action Buttons */}
                        {isNew && (
                          <button
                            onClick={() => handleActionClick(trx, "IN_PROCESSED")}
                            disabled={processingId === (trx.id || trx.orderNumber)}
                            className={`py-2.5 px-4 font-black rounded-xl text-xs shadow-md transition-all duration-300 flex items-center gap-1.5 active:scale-95 hover:scale-[1.02] cursor-pointer ${
                              processingId === (trx.id || trx.orderNumber)
                                ? "bg-amber-500 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-300"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                            }`}
                          >
                            {processingId === (trx.id || trx.orderNumber) ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                                <span>Memproses Pesanan...</span>
                              </>
                            ) : (
                              <>
                                <span>Terima Pesanan</span>
                                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                              </>
                            )}
                          </button>
                        )}

                        {isProcessed && (
                          <button
                            onClick={() => handleActionClick(trx, "ORDER_FINISH")}
                            className="py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-black rounded-xl text-xs shadow-md shadow-indigo-500/25 transition-all duration-200 flex items-center gap-1.5 active:scale-95 hover:scale-[1.03] cursor-pointer"
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>Selesaikan Pesanan</span>
                          </button>
                        )}

                        {isFinished && (
                          <span className="py-1.5 px-3 bg-emerald-50 text-emerald-800 font-bold rounded-xl text-xs flex items-center gap-1 border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Selesai
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="font-mono flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Terhubung ke PostgreSQL Supabase DB
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
}
