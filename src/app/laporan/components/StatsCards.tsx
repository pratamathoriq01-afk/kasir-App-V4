"use client";

import { DollarSign, TrendingUp, Wallet, Percent, ShieldCheck } from "lucide-react";

interface StatsCardsProps {
  totalRevenue: number;
  totalHpp: number;
  netProfit: number;
  totalTax: number;
}

export default function StatsCards({
  totalRevenue,
  totalHpp,
  netProfit,
  totalTax,
}: StatsCardsProps) {
  const marginPercentage =
    totalRevenue > 0 ? Math.round((netProfit / (totalRevenue - totalTax)) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* Total Omzet */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Total Omzet</span>
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <h3 className="text-lg font-black text-slate-900 font-mono">
          Rp {totalRevenue.toLocaleString("id-ID")}
        </h3>
        <span className="text-[10px] text-slate-400 block">Kotor termasuk pajak</span>
      </div>

      {/* Total HPP / Modal */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Total HPP / Modal</span>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <h3 className="text-lg font-black text-slate-900 font-mono">
          Rp {totalHpp.toLocaleString("id-ID")}
        </h3>
        <span className="text-[10px] text-slate-400 block">Bahan baku & porsi</span>
      </div>

      {/* Laba Bersih */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-800">Laba Bersih</span>
          <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-xs">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <h3 className="text-lg font-black text-emerald-700 font-mono">
          Rp {netProfit.toLocaleString("id-ID")}
        </h3>
        <span className="text-[10px] text-emerald-600 block">Omzet - HPP - Pajak</span>
      </div>

      {/* Margin Laba % */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Margin Laba</span>
          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <h3 className="text-lg font-black text-slate-900 font-mono">{marginPercentage}%</h3>
        <span className="text-[10px] text-slate-400 block">Rata-rata keuntungan</span>
      </div>

      {/* Pajak Terkumpul */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2 col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Pajak (10%)</span>
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <h3 className="text-lg font-black text-slate-900 font-mono">
          Rp {totalTax.toLocaleString("id-ID")}
        </h3>
        <span className="text-[10px] text-slate-400 block">Terkumpul dari pembeli</span>
      </div>
    </div>
  );
}
