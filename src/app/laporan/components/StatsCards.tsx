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
  // SAK EMKM Net Revenue (Excluding Tax)
  const netRevenue = Math.max(0, totalRevenue - totalTax);
  const marginPercentage =
    netRevenue > 0 ? Math.round((netProfit / netRevenue) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* Omzet Netto Kedai */}
      <Card className="p-4 space-y-2 bg-card border-border hover:border-primary/50 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Omzet Netto Kedai</span>
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <h3 className="text-lg font-extrabold text-foreground font-mono">
          Rp {netRevenue.toLocaleString("id-ID")}
        </h3>
        <span className="text-[10px] text-muted-foreground block truncate">
          Kas masuk: Rp {totalRevenue.toLocaleString("id-ID")}
        </span>
      </Card>

      {/* Total HPP / Modal */}
      <Card className="p-4 space-y-2 bg-card border-border hover:border-muted-foreground/30 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Total HPP / Modal</span>
          <div className="p-2 rounded-xl bg-muted text-muted-foreground">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <h3 className="text-lg font-extrabold text-foreground font-mono">
          Rp {totalHpp.toLocaleString("id-ID")}
        </h3>
        <span className="text-[10px] text-muted-foreground block truncate">Bahan baku &amp; porsi</span>
      </Card>

      {/* Laba Bersih SAK EMKM */}
      <Card className="p-4 space-y-2 bg-emerald-500/10 border-emerald-500/30 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Laba Bersih SAK EMKM</span>
          <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
          Rp {netProfit.toLocaleString("id-ID")}
        </h3>
        <span className="text-[10px] text-emerald-600/90 dark:text-emerald-400/80 font-medium block truncate">
          Omzet Netto - HPP (Bebas Pajak)
        </span>
      </Card>

      {/* Margin Laba % */}
      <Card className="p-4 space-y-2 bg-card border-border hover:border-indigo-400 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Margin Laba</span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <h3 className="text-lg font-extrabold text-foreground font-mono">{marginPercentage}%</h3>
        <span className="text-[10px] text-muted-foreground block truncate">Persentase Laba Netto Usaha</span>
      </Card>

      {/* Pajak Terkumpul */}
      <Card className="p-4 space-y-2 col-span-2 lg:col-span-1 bg-card border-border hover:border-blue-400 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Pajak (10%)</span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <h3 className="text-lg font-extrabold text-foreground font-mono">
          Rp {totalTax.toLocaleString("id-ID")}
        </h3>
        <span className="text-[10px] text-muted-foreground block truncate">Titipan dari pembeli</span>
      </Card>
    </div>
  );
}
