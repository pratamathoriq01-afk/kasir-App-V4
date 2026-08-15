"use client";

import { Transaction } from "@/types";
import { BellRing, Printer, CheckCircle, X } from "lucide-react";

interface IncomingOrderModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onPrintAndProcess: (trx: Transaction) => void;
}

export default function IncomingOrderModal({
  transaction,
  isOpen,
  onClose,
  onPrintAndProcess,
}: IncomingOrderModalProps) {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Decorative Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header Badge */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-md shadow-amber-500/30 animate-bounce">
              <BellRing className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300/60">
                  Menu Digital v2
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Pesanan Baru Masuk!
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-1">
                Order {transaction.orderNumber}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Details Body */}
        <div className="py-4 space-y-4 text-xs">
          {/* Customer & Table Info Box */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Nama Pemesan
              </span>
              <span className="font-extrabold text-slate-900 text-sm">
                {transaction.customerName || "Pelanggan"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Tipe / Meja
              </span>
              <span className="font-extrabold text-amber-700 text-sm">
                {transaction.orderType === "dine-in"
                  ? `Dine-In (Meja ${transaction.tableNumber || "-"})`
                  : "Takeaway"}
              </span>
            </div>
          </div>

          {/* Purchased Items List */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Daftar Pesanan ({transaction.items?.length || 0} Menu):
            </span>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
              {transaction.items?.map((item, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-extrabold text-[11px] flex items-center justify-center font-mono">
                      {item.qty}x
                    </span>
                    <span className="font-bold text-slate-800">{item.nameSnapshot}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    Rp {(item.priceSnapshot * item.qty).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary Total */}
          <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-800/80 uppercase tracking-wider block">
                Total Tagihan Digital
              </span>
              <span className="text-xs text-amber-900/70 font-medium">
                Termasuk Pajak &amp; Potongan
              </span>
            </div>
            <span className="text-xl font-black text-amber-700 font-mono tracking-tight">
              Rp {transaction.total.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-2 flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all cursor-pointer text-xs"
          >
            Nanti Dulu
          </button>

          <button
            onClick={() => onPrintAndProcess(transaction)}
            className="flex-2 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer text-xs"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            <span>Cetak Nota &amp; Proses</span>
          </button>
        </div>
      </div>
    </div>
  );
}
