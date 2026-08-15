"use client";

import { useState } from "react";
import { Transaction } from "@/types";
import { Bell, Printer, CheckCircle2, Clock, X, Utensils, RefreshCw, ShoppingBag, ArrowRight, Check } from "lucide-react";

interface IncomingOrdersDrawerProps {
  isOpen: boolean;
  orders: Transaction[];
  onClose: () => void;
  onRefresh: () => void;
  onPrintReceipt: (trx: Transaction) => void;
  onUpdateStatus: (trxId: string, status: "PROCESSED" | "COMPLETED" | "CANCELLED") => void;
}

export default function IncomingOrdersDrawer({
  isOpen,
  orders,
  onClose,
  onRefresh,
  onPrintReceipt,
  onUpdateStatus,
}: IncomingOrdersDrawerProps) {
  const [activeTab, setActiveTab] = useState<"NEW" | "PROCESSED" | "COMPLETED">("NEW");

  if (!isOpen) return null;

  const newOrders = orders.filter(
    (o) => !o.orderStatus || o.orderStatus === "NEW_ORDER" || o.orderStatus === "PENDING"
  );
  const processedOrders = orders.filter((o) => o.orderStatus === "PROCESSED");
  const completedOrders = orders.filter((o) => o.orderStatus === "COMPLETED" || o.orderStatus === "PAID");

  const filteredOrders =
    activeTab === "NEW"
      ? newOrders
      : activeTab === "PROCESSED"
      ? processedOrders
      : completedOrders;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="bg-white max-w-xl w-full h-full shadow-2xl border-l border-slate-300 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Top Header Drawer */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl shadow-md">
              <Bell className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-widest bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
                  Menu Digital v2
                </span>
                <span className="text-[10px] font-bold text-emerald-400 font-mono">Real-time DB Sync</span>
              </div>
              <h2 className="text-base font-black text-white mt-0.5">
                Wadah Pesanan Masuk ({orders.length})
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Refresh Data Supabase"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Distinct 3-Tab Filter Bar */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 grid grid-cols-3 gap-2 shrink-0 text-xs">
          {/* Tab 1: Pesanan Baru */}
          <button
            onClick={() => setActiveTab("NEW")}
            className={`py-2.5 px-3 rounded-xl font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "NEW"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 ring-2 ring-amber-400"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <span>1. Pesanan Baru</span>
            <span className={`px-1.5 py-0.5 text-[10px] font-black rounded-full font-mono ${
              activeTab === "NEW" ? "bg-slate-950 text-amber-400" : "bg-slate-200 text-slate-800"
            }`}>
              {newOrders.length}
            </span>
          </button>

          {/* Tab 2: Pesanan Diproses */}
          <button
            onClick={() => setActiveTab("PROCESSED")}
            className={`py-2.5 px-3 rounded-xl font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "PROCESSED"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-400"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <span>2. Diproses</span>
            <span className={`px-1.5 py-0.5 text-[10px] font-black rounded-full font-mono ${
              activeTab === "PROCESSED" ? "bg-white text-indigo-900" : "bg-slate-200 text-slate-800"
            }`}>
              {processedOrders.length}
            </span>
          </button>

          {/* Tab 3: Semua Riwayat */}
          <button
            onClick={() => setActiveTab("COMPLETED")}
            className={`py-2.5 px-3 rounded-xl font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "COMPLETED"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400"
                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
            }`}
          >
            <span>3. Riwayat Selesai</span>
            <span className={`px-1.5 py-0.5 text-[10px] font-black rounded-full font-mono ${
              activeTab === "COMPLETED" ? "bg-white text-emerald-900" : "bg-slate-200 text-slate-800"
            }`}>
              {completedOrders.length}
            </span>
          </button>
        </div>

        {/* Orders List Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs my-auto">
              <Bell className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-800 text-base">Tidak Ada Pesanan</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {activeTab === "NEW"
                  ? "Belum ada pesanan baru dari Menu Digital v2."
                  : activeTab === "PROCESSED"
                  ? "Tidak ada pesanan yang sedang diproses di dapur."
                  : "Belum ada riwayat pesanan selesai."}
              </p>
            </div>
          ) : (
            filteredOrders.map((trx) => {
              const isNew = !trx.orderStatus || trx.orderStatus === "NEW_ORDER" || trx.orderStatus === "PENDING";
              const isProcessed = trx.orderStatus === "PROCESSED";
              const formattedTime = new Date(trx.createdAt).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={trx.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col transition-all hover:shadow-md"
                >
                  {/* Distinct Color Header Bar */}
                  <div
                    className={`px-4 py-2.5 flex items-center justify-between font-bold text-xs ${
                      isNew
                        ? "bg-amber-500 text-slate-950"
                        : isProcessed
                        ? "bg-indigo-600 text-white"
                        : "bg-emerald-600 text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm tracking-tight">
                        {trx.orderNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/20 text-white border border-white/20">
                        {isNew ? "1. PESANAN BARU" : isProcessed ? "2. SEDANG DIPROSES" : "3. SELESAI"}
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
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
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
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
                          title="Cetak Struk Dapur/Kasir"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak Struk</span>
                        </button>

                        {/* Workflow Action Buttons */}
                        {isNew && (
                          <button
                            onClick={() => onUpdateStatus(trx.id || trx.orderNumber, "PROCESSED")}
                            className="py-2 px-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                          >
                            <span>Terima Pesanan</span>
                            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        )}

                        {isProcessed && (
                          <button
                            onClick={() => onUpdateStatus(trx.id || trx.orderNumber, "COMPLETED")}
                            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>Tandai Selesai</span>
                          </button>
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
          <span className="font-mono">Terhubung ke PostgreSQL Supabase DB</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
}
