"use client";

import { useState } from "react";
import { Transaction } from "@/types";
import { Bell, Printer, CheckCircle2, Clock, X, Utensils, RefreshCw, ShoppingBag, ChevronRight } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"NEW" | "PROCESSED" | "ALL">("NEW");

  if (!isOpen) return null;

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "NEW") {
      return !o.orderStatus || o.orderStatus === "NEW_ORDER" || o.orderStatus === "PENDING";
    }
    if (activeTab === "PROCESSED") {
      return o.orderStatus === "PROCESSED";
    }
    return true;
  });

  const countNew = orders.filter((o) => !o.orderStatus || o.orderStatus === "NEW_ORDER" || o.orderStatus === "PENDING").length;
  const countProcessed = orders.filter((o) => o.orderStatus === "PROCESSED").length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="bg-white max-w-xl w-full h-full shadow-2xl border-l border-amber-200 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header Drawer */}
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
                <span className="text-[10px] font-bold text-slate-400 font-mono">Real-time List</span>
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
              title="Refresh Data"
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

        {/* Status Filter Tabs */}
        <div className="p-3 bg-slate-100/80 border-b border-slate-200 flex gap-1.5 shrink-0 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab("NEW")}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "NEW"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>Pesanan Baru</span>
            {countNew > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-slate-950 text-amber-400 font-mono">
                {countNew}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("PROCESSED")}
            className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "PROCESSED"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>Sedang Diproses</span>
            {countProcessed > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-slate-200 text-slate-900 font-mono">
                {countProcessed}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === "ALL"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>Semua Riwayat</span>
          </button>
        </div>

        {/* Orders List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 p-8 my-auto">
              <Bell className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-800 text-base">Tidak Ada Pesanan Masuk</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {activeTab === "NEW"
                  ? "Belum ada pesanan digital baru dari pembeli saat ini."
                  : "Tidak ada data pesanan untuk kategori ini."}
              </p>
            </div>
          ) : (
            filteredOrders.map((trx) => {
              const isNew = !trx.orderStatus || trx.orderStatus === "NEW_ORDER" || trx.orderStatus === "PENDING";
              const formattedTime = new Date(trx.createdAt).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={trx.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 relative overflow-hidden ${
                    isNew
                      ? "bg-white border-amber-400/90 shadow-md shadow-amber-500/10"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  {/* Top Bar Card */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-slate-900">
                        {trx.orderNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        isNew
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : trx.orderStatus === "PROCESSED"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {isNew ? "Pesanan Baru" : trx.orderStatus}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formattedTime} WIB</span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                        Pemesan
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {trx.customerName || "Pelanggan"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                        Tipe / Meja
                      </span>
                      <span className="font-bold text-amber-700 flex items-center gap-1">
                        {trx.orderType === "dine-in" ? (
                          <>
                            <Utensils className="w-3 h-3" /> Meja {trx.tableNumber || "-"}
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3 h-3" /> Bungkus
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="bg-white/90 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Menu Dipesan ({trx.items?.length || 0}):
                    </span>
                    {trx.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-800">
                        <span>
                          <strong className="font-mono text-amber-600 mr-1">{item.qty}x</strong>{" "}
                          {item.nameSnapshot}
                        </span>
                        <span className="font-mono font-semibold text-slate-600">
                          Rp {(item.priceSnapshot * item.qty).toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total & Action Buttons */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Total Tagihan
                      </span>
                      <span className="text-base font-black font-mono text-amber-600">
                        Rp {trx.total.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onPrintReceipt(trx)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer"
                        title="Cetak Nota Dapur/Kasir"
                      >
                        <Printer className="w-4 h-4" />
                        <span className="hidden sm:inline">Cetak</span>
                      </button>

                      {isNew ? (
                        <button
                          onClick={() => onUpdateStatus(trx.id, "PROCESSED")}
                          className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <span>Proses</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : trx.orderStatus === "PROCESSED" ? (
                        <button
                          onClick={() => onUpdateStatus(trx.id, "COMPLETED")}
                          className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Selesai</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Otomatis tersinkron dengan Supabase DB</span>
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
