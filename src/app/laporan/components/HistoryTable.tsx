"use client";

import { useState } from "react";
import { Transaction } from "@/types";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

interface HistoryTableProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
}

export default function HistoryTable({
  transactions,
  onDeleteTransaction,
}: HistoryTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-sm">Tabel Riwayat Transaksi</h3>
        <span className="text-xs text-slate-500 font-medium">{transactions.length} Transaksi</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Nota / Waktu</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Tipe Pesanan</th>
              <th className="py-3 px-4">Omzet Total</th>
              <th className="py-3 px-4">Laba Bersih</th>
              <th className="py-3 px-4 text-center">Detail</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400">
                  Belum ada riwayat transaksi.
                </td>
              </tr>
            ) : (
              transactions.map((t) => {
                const isExpanded = expandedId === t.id;
                return (
                  <tr key={t.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td colSpan={7} className="p-0">
                      <div className="flex items-center justify-between py-3 px-4 border-b border-slate-50 min-w-[640px]">
                        <div className="w-44">
                          <span className="font-bold font-mono text-slate-900 block">
                            {t.orderNumber}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(t.createdAt).toLocaleString("id-ID")}
                          </span>
                        </div>

                        <div className="w-32 font-semibold text-slate-700">
                          {t.customerName || "Pelanggan"}
                        </div>

                        <div className="w-32">
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                            {t.orderType}{" "}
                            {t.orderType === "dine-in" ? `(${t.tableNumber})` : ""}
                          </span>
                        </div>

                        <div className="w-32 font-bold font-mono text-amber-600">
                          Rp {t.total.toLocaleString("id-ID")}
                        </div>

                        <div className="w-32 font-bold font-mono text-emerald-600">
                          +Rp {t.netProfit.toLocaleString("id-ID")}
                        </div>

                        <div className="w-20 text-center">
                          <button
                            onClick={() => toggleExpand(t.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        <div className="w-16 text-right">
                          <button
                            onClick={() => onDeleteTransaction(t.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 bg-slate-50/90 border-b border-slate-200 space-y-2">
                          <h4 className="font-bold text-[11px] text-slate-700 uppercase tracking-wider">
                            Rincian Item Transaksi:
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                            {t.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center"
                              >
                                <span className="font-semibold text-slate-800">
                                  {item.qty}x {item.nameSnapshot}
                                </span>
                                <span className="font-mono text-slate-600">
                                  @ Rp {item.priceSnapshot.toLocaleString("id-ID")} = Rp{" "}
                                  {(item.qty * item.priceSnapshot).toLocaleString("id-ID")}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
