"use client";

import { Transaction } from "@/types";

interface MenuPerformanceTableProps {
  transactions: Transaction[];
}

export default function MenuPerformanceTable({ transactions }: MenuPerformanceTableProps) {
  const itemMap: Record<
    string,
    { name: string; qty: number; revenue: number; hpp: number }
  > = {};

  transactions.forEach((t) => {
    t.items.forEach((item) => {
      if (!itemMap[item.nameSnapshot]) {
        itemMap[item.nameSnapshot] = {
          name: item.nameSnapshot,
          qty: 0,
          revenue: 0,
          hpp: 0,
        };
      }
      itemMap[item.nameSnapshot].qty += item.qty;
      itemMap[item.nameSnapshot].revenue += item.qty * item.priceSnapshot;
      itemMap[item.nameSnapshot].hpp += item.qty * item.hppSnapshot;
    });
  });

  const sortedList = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-sm">Analisis Performa Per Menu</h3>
        <span className="text-xs text-slate-500 font-medium">Diurutkan Berdasarkan Omzet</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Nama Menu</th>
              <th className="py-3 px-4 text-center">Terjual (Qty)</th>
              <th className="py-3 px-4">Total Omzet (Rp)</th>
              <th className="py-3 px-4">Total HPP (Rp)</th>
              <th className="py-3 px-4 text-right">Laba Bersih (Rp)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium">
            {sortedList.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-slate-400">
                  Belum ada data item terjual dalam periode ini.
                </td>
              </tr>
            ) : (
              sortedList.map((item, idx) => {
                const profit = item.revenue - item.hpp;
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                      {item.qty}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      Rp {item.revenue.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      Rp {item.hpp.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      +Rp {profit.toLocaleString("id-ID")}
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
