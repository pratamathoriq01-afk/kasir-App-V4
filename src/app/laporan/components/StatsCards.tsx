"use client";

import { DollarSign, TrendingUp, Wallet, Percent, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

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
      <Card className="p-4 space-y-2 hover:border-amber-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Total Omzet</span>
          <div className="p-2 rounded-xl bg-amber-100/80 text-amber-700">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 font-mono">
          Rp {totalRevenue.toLocaleString("id-ID")}
        </h3>
        <span className="text-[10px] text-slate-400 block">Kotor termasuk pajak</span>
      </Card>

      {/* Total HPP / Modal */}
      <Card className="p-4 space-y-2 hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Total HPP / Modal</span>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 font-mono">
          Rp {totalHpp.toLocaleString("id-ID")}
        </h3>
        <span className="text-[10px] text-slate-400 block">Bahan baku &amp; porsi</span>
      </Card>

      {/* Laba Bersih */}
      <Card className="p-4 space-y-2 bg-gradient-to-br from-emerald-50/90 to-white border-emerald-200/90 shadow-sm hover:border-emerald-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-900">Laba Bersih</span>
          <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <h3 className="text-lg font-black text-emerald-700 font-mono">
          Rp {netProfit.toLocaleString("id-ID")}
        </h3>
        <span className="text-[10px] text-emerald-600/90 font-medium block">Omzet - HPP - Pajak</span>
      </Card>

      {/* Margin Laba % */}
      <Card className="p-4 space-y-2 hover:border-indigo-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Margin Laba</span>
          <div className="p-2 rounded-xl bg-indigo-100/80 text-indigo-700">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 font-mono">{marginPercentage}%</h3>
        <span className="text-[10px] text-slate-400 block">Rata-rata keuntungan</span>
      </Card>

      {/* Pajak Terkumpul */}
      <Card className="p-4 space-y-2 col-span-2 lg:col-span-1 hover:border-blue-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Pajak (10%)</span>
          <div className="p-2 rounded-xl bg-blue-100/80 text-blue-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <h3 className="text-lg font-extrabold text-slate-900 font-mono">
          Rp {totalTax.toLocaleString("id-ID")}
        </h3>
        <span className="text-[10px] text-slate-400 block">Terkumpul dari pembeli</span>
      </Card>
    </div>
  );
}
