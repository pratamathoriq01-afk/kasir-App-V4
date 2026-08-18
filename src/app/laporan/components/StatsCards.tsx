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
      <Card className="p-4 space-y-2 bg-card border-border hover:border-amber-400/80 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Total Omzet</span>
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <h3 className="text-lg font-extrabold text-foreground font-mono">
          Rp {totalRevenue.toLocaleString("id-ID")}
        </h3>
        <span className="text-[10px] text-muted-foreground block">Kotor termasuk pajak</span>
      </Card>

      {/* Total HPP / Modal */}
      <Card className="p-4 space-y-2 bg-card border-border hover:border-slate-400 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Total HPP / Modal</span>
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <h3 className="text-lg font-extrabold text-foreground font-mono">
          Rp {totalHpp.toLocaleString("id-ID")}
        </h3>
        <span className="text-[10px] text-muted-foreground block">Bahan baku &amp; porsi</span>
      </Card>

      {/* Laba Bersih */}
      <Card className="p-4 space-y-2 bg-gradient-to-br from-emerald-50/90 to-white dark:from-emerald-950/40 dark:to-slate-900 border-emerald-200/90 dark:border-emerald-800/60 shadow-sm hover:border-emerald-400 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Laba Bersih</span>
          <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <h3 className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
          Rp {netProfit.toLocaleString("id-ID")}
        </h3>
        <span className="text-[10px] text-emerald-600/90 dark:text-emerald-400/80 font-medium block">Omzet - HPP - Pajak</span>
      </Card>

      {/* Margin Laba % */}
      <Card className="p-4 space-y-2 bg-card border-border hover:border-indigo-400 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Margin Laba</span>
          <div className="p-2 rounded-xl bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <h3 className="text-lg font-extrabold text-foreground font-mono">{marginPercentage}%</h3>
        <span className="text-[10px] text-muted-foreground block">Rata-rata keuntungan</span>
      </Card>

      {/* Pajak Terkumpul */}
      <Card className="p-4 space-y-2 col-span-2 lg:col-span-1 bg-card border-border hover:border-blue-400 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Pajak (10%)</span>
          <div className="p-2 rounded-xl bg-blue-100/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <h3 className="text-lg font-extrabold text-foreground font-mono">
          Rp {totalTax.toLocaleString("id-ID")}
        </h3>
        <span className="text-[10px] text-muted-foreground block">Terkumpul dari pembeli</span>
      </Card>
    </div>
  );
}

